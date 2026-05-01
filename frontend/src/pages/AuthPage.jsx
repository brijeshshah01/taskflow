import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Alert } from '../components/UI';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Please fill all fields');
    if (mode === 'signup' && !form.name) return setError('Name is required');
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await signup(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(124,106,247,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(155,109,247,0.06) 0%, transparent 50%)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent), #9b6df7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 0 30px var(--accent-glow)',
            }}>⚡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>TaskFlow</span>
          </div>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Team task management, simplified</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.4s ease',
        }}>
          {/* Toggle */}
          <div style={{
            display: 'flex', background: 'var(--bg3)', borderRadius: 8,
            padding: 4, marginBottom: 28,
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 6,
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text3)',
              }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <Input label="Full Name" placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} />
            )}
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
            <Input label="Password" type="password" placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'} value={form.password} onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Role</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['member', 'admin'].map(r => (
                    <button key={r} onClick={() => set('role', r)} style={{
                      flex: 1, padding: '10px', border: `1px solid ${form.role === r ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', background: form.role === r ? 'var(--accent-glow)' : 'var(--bg3)',
                      color: form.role === r ? 'var(--accent2)' : 'var(--text2)',
                      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {r === 'admin' ? '👑 Admin' : '👤 Member'}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {form.role === 'admin' ? 'Can create projects, manage members & all tasks' : 'Can view projects, create & manage own tasks'}
                </p>
              </div>
            )}
            {error && <Alert message={error} type="error" />}
            <Button variant="primary" size="lg" loading={loading} onClick={handleSubmit} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </div>

          {mode === 'login' && (
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
              Demo: admin@demo.com / password123
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
