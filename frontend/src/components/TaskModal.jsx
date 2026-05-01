import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Modal, Button, Input, Textarea, Select, Alert, StatusBadge, PriorityBadge, Avatar, Badge } from './UI';

export function TaskModal({ projectId, task, members, onClose, onSaved, onDeleted, currentUser }) {
  const isNew = !task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    assignee_id: task?.assignee_id || '',
    due_date: task?.due_date?.split('T')[0] || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isNew) {
      api.get(`/projects/${projectId}/tasks/${task.id}`).then(d => {
        setComments(d.comments || []);
      });
    }
  }, []);

  const submit = async () => {
    if (!form.title.trim()) return setError('Title is required');
    setLoading(true);
    try {
      const body = { ...form, assignee_id: form.assignee_id || undefined, due_date: form.due_date || undefined };
      let result;
      if (isNew) {
        result = await api.post(`/projects/${projectId}/tasks`, body);
      } else {
        result = await api.patch(`/projects/${projectId}/tasks/${task.id}`, body);
      }
      onSaved(result.task);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}`);
      onDeleted(task.id);
    } catch (e) { setError(e.message); setDeleting(false); }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const data = await api.post(`/projects/${projectId}/tasks/${task.id}/comments`, { content: newComment });
      setComments(c => [...c, data.comment]);
      setNewComment('');
    } finally { setPostingComment(false); }
  };

  const canEdit = isNew || currentUser?.role === 'admin' ||
    task?.created_by === currentUser?.id || task?.assignee_id === currentUser?.id;

  return (
    <Modal title={isNew ? 'New Task' : 'Edit Task'} onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {canEdit ? (
          <>
            <Input label="Title" placeholder="Task title" value={form.title} onChange={e => set('title', e.target.value)} />
            <Textarea label="Description" placeholder="Describe the task..." value={form.description} onChange={e => set('description', e.target.value)} rows={3} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done</option>
              </Select>
              <Select label="Priority" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Assignee" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
              <Input label="Due Date" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Title</div>
              <div style={{ fontWeight: 600 }}>{task.title}</div>
            </div>
            {task.description && (
              <div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14, color: 'var(--text2)' }}>{task.description}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
        )}

        {error && <Alert message={error} type="error" />}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          {!isNew && canEdit && (
            <Button variant="danger" size="sm" loading={deleting} onClick={deleteTask}>Delete</Button>
          )}
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            {canEdit && <Button variant="primary" loading={loading} onClick={submit}>{isNew ? 'Create Task' : 'Save Changes'}</Button>}
          </div>
        </div>

        {/* Comments section */}
        {!isNew && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>
              Comments ({comments.length})
            </h4>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <Avatar name={c.user_name} color={c.avatar_color} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{c.user_name}
                    <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>
                      {new Date(c.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', background: 'var(--bg3)', padding: '8px 12px', borderRadius: 8 }}>{c.content}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                style={{
                  flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13,
                  outline: 'none',
                }}
              />
              <Button variant="primary" size="sm" loading={postingComment} onClick={postComment}>Post</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
