const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

// GET /api/projects/:projectId/tasks
router.get('/', authenticate, requireProjectAccess, (req, res) => {
  const { status, priority, assignee } = req.query;

  let query = `
    SELECT t.*,
      u.name as assignee_name, u.avatar_color as assignee_color,
      c.name as creator_name,
      COUNT(cm.id) as comment_count,
      CASE WHEN t.due_date < date('now') AND t.status != 'done' THEN 1 ELSE 0 END as is_overdue
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.created_by = c.id
    LEFT JOIN comments cm ON t.id = cm.task_id
    WHERE t.project_id = ?
  `;
  const params = [req.params.projectId];

  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (assignee) { query += ' AND t.assignee_id = ?'; params.push(assignee); }

  query += ' GROUP BY t.id ORDER BY CASE t.priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, t.due_date ASC, t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

// POST /api/projects/:projectId/tasks
router.post('/', authenticate, requireProjectAccess, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('assignee_id').optional().isInt(),
  body('due_date').optional().isISO8601(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, priority = 'medium', status = 'todo', assignee_id, due_date } = req.body;

  try {
    // Validate assignee is a project member
    if (assignee_id) {
      const isMember = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, assignee_id);
      if (!isMember) return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, priority, status, project_id, assignee_id, created_by, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || null, priority, status, req.params.projectId, assignee_id || null, req.user.id, due_date || null);

    const task = db.prepare(`
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      JOIN users c ON t.created_by = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:projectId/tasks/:taskId
router.get('/:taskId', authenticate, requireProjectAccess, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN users c ON t.created_by = c.id
    WHERE t.id = ? AND t.project_id = ?
  `).get(req.params.taskId, req.params.projectId);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const comments = db.prepare(`
    SELECT cm.*, u.name as user_name, u.avatar_color
    FROM comments cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.task_id = ?
    ORDER BY cm.created_at ASC
  `).all(req.params.taskId);

  res.json({ task, comments });
});

// PATCH /api/projects/:projectId/tasks/:taskId
router.patch('/:taskId', authenticate, requireProjectAccess, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('assignee_id').optional({ nullable: true }).isInt(),
  body('due_date').optional({ nullable: true }).isISO8601(),
], (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?').get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Members can only update their own tasks or tasks assigned to them
  if (req.projectRole === 'member' && task.created_by !== req.user.id && task.assignee_id !== req.user.id) {
    return res.status(403).json({ error: 'Cannot edit this task' });
  }

  const { title, description, priority, status, assignee_id, due_date } = req.body;

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      priority = COALESCE(?, priority),
      status = COALESCE(?, status),
      assignee_id = CASE WHEN ? IS NOT NULL THEN ? ELSE assignee_id END,
      due_date = CASE WHEN ? IS NOT NULL THEN ? ELSE due_date END
    WHERE id = ?
  `).run(
    title || null, description !== undefined ? description : null,
    priority || null, status || null,
    assignee_id !== undefined ? assignee_id : null, assignee_id || null,
    due_date !== undefined ? due_date : null, due_date || null,
    req.params.taskId
  );

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, c.name as creator_name
    FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(req.params.taskId);

  res.json({ task: updated });
});

// DELETE /api/projects/:projectId/tasks/:taskId
router.delete('/:taskId', authenticate, requireProjectAccess, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?').get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.projectRole === 'member' && task.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Cannot delete this task' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.taskId);
  res.json({ message: 'Task deleted' });
});

// POST /api/projects/:projectId/tasks/:taskId/comments
router.post('/:taskId/comments', authenticate, requireProjectAccess, [
  body('content').trim().notEmpty().withMessage('Comment cannot be empty'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const result = db.prepare(
    'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)'
  ).run(req.params.taskId, req.user.id, req.body.content);

  const comment = db.prepare(`
    SELECT cm.*, u.name as user_name, u.avatar_color
    FROM comments cm JOIN users u ON cm.user_id = u.id WHERE cm.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ comment });
});

module.exports = router;
