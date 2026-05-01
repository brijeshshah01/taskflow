import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Button, Avatar, StatusBadge, PriorityBadge, Spinner, Alert, Modal, Input, Select, EmptyState, Badge } from '../components/UI';
import { TaskModal } from '../components/TaskModal';

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'var(--text3)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
  { key: 'review', label: 'In Review', color: 'var(--yellow)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

function TaskCard({ task, onClick }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg2)', border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
      borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
      transition: 'all 0.15s', marginBottom: 8,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10, lineHeight: 1.4 }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <PriorityBadge priority={task.priority} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.comment_count > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>💬 {task.comment_count}</span>
          )}
          {task.due_date && (
            <span style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>
              {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.assignee_name && (
            <Avatar name={task.assignee_name} color={task.assignee_color} size={22} />
          )}
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) return setError('Email required');
    setLoading(true);
    try {
      const data = await api.post(`/projects/${projectId}/members`, { email, role });
      onAdded(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add Team Member" onClose={onClose} width={400}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="User Email" type="email" placeholder="member@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <Select label="Role" value={role} onChange={e => setRole(e.target.value)}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </Select>
        {error && <Alert message={error} type="error" />}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={submit}>Add Member</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTask, setActiveTask] = useState(null); // null=closed, 'new'=new, task=edit
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/tasks`),
    ]).then(([pd, td]) => {
      setProject(pd.project);
      setMembers(pd.members);
      setTasks(td.tasks);
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredTasks = tasks.filter(t => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && String(t.assignee_id) !== filterAssignee) return false;
    return true;
  });

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s.key] = filteredTasks.filter(t => t.status === s.key)
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    return acc;
  }, {});

  const isProjectAdmin = project?.owner_id === user?.id || user?.role === 'admin';

  const handleTaskSaved = (saved) => {
    setTasks(ts => {
      const exists = ts.find(t => t.id === saved.id);
      if (exists) return ts.map(t => t.id === saved.id ? saved : t);
      return [saved, ...ts];
    });
    setActiveTask(null);
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(ts => ts.filter(t => t.id !== taskId));
    setActiveTask(null);
  };

  const handleAddMember = (data) => {
    setMembers(ms => [...ms, { id: data.user.id, name: data.user.name, email: data.user.email, avatar_color: data.user.avatar_color, role: data.role }]);
    setShowAddMember(false);
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      setMembers(ms => ms.filter(m => m.id !== memberId));
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Spinner size={32} /></div>;
  if (error) return <div style={{ padding: 40 }}><Alert message={error} type="error" /></div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: '2px 6px' }}>←</button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>{project?.name}</h1>
            {project?.description && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{project.description}</p>}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Members avatars */}
            <div style={{ display: 'flex', cursor: 'pointer' }} onClick={() => setShowMembers(true)}>
              {members.slice(0, 4).map((m, i) => (
                <div key={m.id} style={{ marginLeft: i > 0 ? -8 : 0 }}>
                  <Avatar name={m.name} color={m.avatar_color} size={30} />
                </div>
              ))}
              {members.length > 4 && <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text3)', marginLeft: -8 }}>+{members.length - 4}</div>}
            </div>
            {isProjectAdmin && <Button variant="ghost" size="sm" onClick={() => setShowAddMember(true)}>+ Add Member</Button>}
            <Button variant="primary" size="sm" onClick={() => setActiveTask('new')}>+ New Task</Button>
          </div>
        </div>

        {/* Tabs + Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['board', 'list'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer',
                background: activeTab === t ? 'var(--accent)' : 'transparent',
                color: activeTab === t ? '#fff' : 'var(--text2)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                transition: 'all 0.15s',
              }}>
                {t === 'board' ? '⬜ Board' : '☰ List'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6,
              padding: '5px 10px', color: 'var(--text2)', fontSize: 12, cursor: 'pointer',
            }}>
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6,
              padding: '5px 10px', color: 'var(--text2)', fontSize: 12, cursor: 'pointer',
            }}>
              <option value="">All Members</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Board */}
      {activeTab === 'board' && (
        <div style={{ flex: 1, overflowX: 'auto', padding: '20px 28px', display: 'flex', gap: 16 }}>
          {STATUSES.map(s => (
            <div key={s.key} style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: s.color }}>{s.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 7px', borderRadius: 10 }}>{tasksByStatus[s.key].length}</span>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '10px 10px', minHeight: 100 }}>
                {tasksByStatus[s.key].map(t => (
                  <TaskCard key={t.id} task={t} onClick={() => setActiveTask(t)} />
                ))}
                {tasksByStatus[s.key].length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {activeTab === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {filteredTasks.length === 0 ? (
            <EmptyState icon="📋" title="No tasks" desc="Create tasks using the button above" action={<Button variant="primary" onClick={() => setActiveTask('new')}>+ New Task</Button>} />
          ) : (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 120px 100px', gap: 0 }}>
                <div style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>TASK</div>
                <div style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>STATUS</div>
                <div style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>PRIORITY</div>
                <div style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>ASSIGNEE</div>
                <div style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>DUE</div>
              </div>
              {filteredTasks.map(t => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
                return (
                  <div key={t.id} onClick={() => setActiveTask(t)} style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 100px 120px 100px',
                    borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ padding: '12px 16px' }}><StatusBadge status={t.status} /></div>
                    <div style={{ padding: '12px 16px' }}><PriorityBadge priority={t.priority} /></div>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t.assignee_name ? <><Avatar name={t.assignee_name} color={t.assignee_color} size={20} /><span style={{ fontSize: 12, color: 'var(--text2)' }}>{t.assignee_name.split(' ')[0]}</span></> : <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>}
                    </div>
                    <div style={{ padding: '12px 16px', fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text3)' }}>
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Members panel */}
      {showMembers && (
        <Modal title={`Team Members (${members.length})`} onClose={() => setShowMembers(false)} width={440}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8 }}>
                <Avatar name={m.name} color={m.avatar_color} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name} {m.id === user.id && <span style={{ fontSize: 11, color: 'var(--text3)' }}>(you)</span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.email}</div>
                </div>
                <span style={{ fontSize: 12, color: m.role === 'admin' ? 'var(--yellow)' : 'var(--text3)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {m.role === 'admin' ? '👑 ' : ''}{m.role}
                </span>
                {isProjectAdmin && m.id !== user.id && (
                  <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>×</button>
                )}
              </div>
            ))}
            {isProjectAdmin && (
              <Button variant="ghost" onClick={() => { setShowMembers(false); setShowAddMember(true); }}>+ Add Member</Button>
            )}
          </div>
        </Modal>
      )}

      {/* Modals */}
      {activeTask && (
        <TaskModal
          projectId={id}
          task={activeTask === 'new' ? null : activeTask}
          members={members}
          onClose={() => setActiveTask(null)}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
          currentUser={user}
        />
      )}
      {showAddMember && (
        <AddMemberModal projectId={id} onClose={() => setShowAddMember(false)} onAdded={handleAddMember} />
      )}
    </div>
  );
}
