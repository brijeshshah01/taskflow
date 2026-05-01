import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Textarea, Modal, Alert, EmptyState, Spinner, Badge } from '../components/UI';

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) return setError('Project name is required');
    setLoading(true);
    try {
      const data = await api.post('/projects', form);
      onCreated(data.project);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="New Project" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Project Name" placeholder="e.g. Website Redesign" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <Textarea label="Description (optional)" placeholder="What is this project about?"
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        {error && <Alert message={error} type="error" />}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={submit}>Create Project</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(d => setProjects(d.projects)).finally(() => setLoading(false));
  }, []);

  const handleCreated = (p) => {
    setProjects(ps => [{ ...p, member_count: 1, task_count: 0, done_count: 0, overdue_count: 0 }, ...ps]);
    setShowNew(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Spinner size={32} />
    </div>
  );

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>+ New Project</Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="◫"
          title="No projects yet"
          desc="Create your first project to start managing tasks with your team"
          action={<Button variant="primary" onClick={() => setShowNew(true)}>+ Create Project</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {projects.map(p => {
            const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <Card key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, var(--accent), #9b6df7)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>◫</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {p.overdue_count > 0 && (
                      <span style={{ fontSize: 12, background: 'rgba(239,68,68,0.15)', color: 'var(--red)', padding: '3px 8px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600 }}>
                        ⚠ {p.overdue_count} overdue
                      </span>
                    )}
                  </div>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{p.name}</h3>
                {p.description && (
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.description}
                  </p>
                )}

                {/* Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
                    <span>{p.done_count}/{p.task_count} tasks done</span>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--accent), var(--green))',
                      borderRadius: 2, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text3)' }}>
                  <span>👥 {p.member_count} member{p.member_count !== 1 ? 's' : ''}</span>
                  <span>📋 {p.task_count} task{p.task_count !== 1 ? 's' : ''}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11 }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}
    </div>
  );
}
