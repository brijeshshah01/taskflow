// Run: node backend/seed.js
const db = require('./models/db');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding database...');

// Create demo users
const password = bcrypt.hashSync('password123', 10);

try {
  const adminId = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password, role, avatar_color)
    VALUES (?, ?, ?, ?, ?)
  `).run('Alex Admin', 'admin@demo.com', password, 'admin', '#6366f1').lastInsertRowid;

  const member1Id = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password, role, avatar_color)
    VALUES (?, ?, ?, ?, ?)
  `).run('Sam Smith', 'sam@demo.com', password, 'member', '#10b981').lastInsertRowid;

  const member2Id = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password, role, avatar_color)
    VALUES (?, ?, ?, ?, ?)
  `).run('Jordan Lee', 'jordan@demo.com', password, 'member', '#ec4899').lastInsertRowid;

  // Get actual IDs (in case rows already existed)
  const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@demo.com');
  const member1 = db.prepare('SELECT id FROM users WHERE email = ?').get('sam@demo.com');
  const member2 = db.prepare('SELECT id FROM users WHERE email = ?').get('jordan@demo.com');

  // Create project
  const project = db.prepare(`
    INSERT INTO projects (name, description, owner_id)
    VALUES (?, ?, ?)
  `).run('Website Redesign', 'Complete overhaul of the company website with new branding', admin.id);

  const projectId = project.lastInsertRowid;

  // Add all as members
  [admin.id, member1.id, member2.id].forEach((uid, i) => {
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(projectId, uid, i === 0 ? 'admin' : 'member');
  });

  // Create tasks
  const tasksData = [
    { title: 'Design new homepage mockup', description: 'Create Figma mockups for the new homepage', status: 'done', priority: 'high', assignee_id: member1.id, due_date: '2026-04-20' },
    { title: 'Set up React project structure', description: 'Initialize the new frontend with Vite + React', status: 'done', priority: 'high', assignee_id: admin.id, due_date: '2026-04-22' },
    { title: 'Implement authentication flow', description: 'JWT-based login and signup', status: 'in_progress', priority: 'urgent', assignee_id: admin.id, due_date: '2026-05-05' },
    { title: 'Build responsive navigation', description: 'Mobile-first navigation component', status: 'in_progress', priority: 'medium', assignee_id: member2.id, due_date: '2026-05-08' },
    { title: 'Write API documentation', description: 'Document all REST endpoints', status: 'todo', priority: 'low', assignee_id: member1.id, due_date: '2026-05-20' },
    { title: 'Performance optimization', description: 'Lighthouse score > 90', status: 'todo', priority: 'medium', assignee_id: null, due_date: '2026-05-25' },
    { title: 'SEO meta tags implementation', description: 'Add proper meta tags for all pages', status: 'review', priority: 'medium', assignee_id: member2.id, due_date: '2026-05-10' },
    { title: 'Fix overdue bug in login form', description: 'Form validation not working on mobile', status: 'todo', priority: 'urgent', assignee_id: admin.id, due_date: '2026-04-15' },
  ];

  tasksData.forEach(t => {
    db.prepare(`
      INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, created_by, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(t.title, t.description, t.status, t.priority, projectId, t.assignee_id, admin.id, t.due_date);
  });

  console.log('✅ Demo data created!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin: admin@demo.com / password123');
  console.log('  Member: sam@demo.com / password123');
  console.log('  Member: jordan@demo.com / password123');
} catch (e) {
  console.error('Seed error:', e.message);
}
