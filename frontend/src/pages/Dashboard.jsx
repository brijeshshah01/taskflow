import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatCard, StatusBadge, PriorityBadge, Avatar, Spinner, EmptyState } from '../components/UI';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Spinner size={32} />
    </div>
  );

  const { stats = {}, myTasks = [], recentTasks = [] } = data || {};

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15 }}>Here's what's happening across your projects today.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
        <StatCard label="Total Projects" value={stats.total_projects || 0} icon="◫" color="var(--accent)" />
        <StatCard label="Total Tasks" value={stats.total_tasks || 0} icon="☑" color="var(--blue)" />
        <StatCard label="In Progress" value={stats.in_progress_tasks || 0} icon="◉" color="var(--yellow)" />
        <StatCard label="Completed" value={stats.completed_tasks || 0} icon="✓" color="var(--green)" />
        {stats.overdue_tasks > 0 && (
          <StatCard label="Overdue" value={stats.overdue_tasks} icon="⚠" color="var(--red)" />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* My Tasks */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>Assigned to Me</h2>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{myTasks.length} tasks</span>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState icon="🎉" title="All clear!" desc="No tasks assigned to you" />
          ) : (
            <div>
              {myTasks.map(task => (
                <div key={task.id} style={{
                  padding: '14px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.is_overdue ? '🔴 ' : ''}{task.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <StatusBadge status={task.status} />
                      <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>
                        {task.project_name}
                      </span>
                    </div>
                  </div>
                  {task.due_date && (
                    <div style={{ fontSize: 12, color: task.is_overdue ? 'var(--red)' : 'var(--text3)', flexShrink: 0 }}>
                      {new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>Recent Tasks</h2>
          </div>
          {recentTasks.length === 0 ? (
            <EmptyState icon="📋" title="No tasks yet" desc="Create tasks in your projects" />
          ) : (
            <div>
              {recentTasks.slice(0, 8).map(task => (
                <div key={task.id} style={{
                  padding: '12px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {task.assignee_name && <Avatar name={task.assignee_name} color={task.assignee_color} size={28} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{task.project_name}</div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
