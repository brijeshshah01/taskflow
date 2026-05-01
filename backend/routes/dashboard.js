const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard - user's dashboard summary
router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;

  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT p.id) as total_projects,
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
      COUNT(DISTINCT CASE WHEN t.due_date < date('now') AND t.status != 'done' THEN t.id END) as overdue_tasks
    FROM project_members pm
    JOIN projects p ON pm.project_id = p.id
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE pm.user_id = ?
  `).get(userId);

  const myTasks = db.prepare(`
    SELECT t.*, p.name as project_name,
      CASE WHEN t.due_date < date('now') AND t.status != 'done' THEN 1 ELSE 0 END as is_overdue
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.assignee_id = ? AND t.status != 'done'
    ORDER BY t.due_date ASC, t.priority DESC
    LIMIT 10
  `).all(userId);

  const recentTasks = db.prepare(`
    SELECT t.*, p.name as project_name, u.name as assignee_name, u.avatar_color as assignee_color,
      CASE WHEN t.due_date < date('now') AND t.status != 'done' THEN 1 ELSE 0 END as is_overdue
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
    LEFT JOIN users u ON t.assignee_id = u.id
    ORDER BY t.updated_at DESC
    LIMIT 15
  `).all(userId);

  const tasksByStatus = db.prepare(`
    SELECT t.status, COUNT(*) as count
    FROM tasks t
    JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = ?
    GROUP BY t.status
  `).all(userId);

  const tasksByPriority = db.prepare(`
    SELECT t.priority, COUNT(*) as count
    FROM tasks t
    JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = ?
    WHERE t.status != 'done'
    GROUP BY t.priority
  `).all(userId);

  res.json({ stats, myTasks, recentTasks, tasksByStatus, tasksByPriority });
});

module.exports = router;
