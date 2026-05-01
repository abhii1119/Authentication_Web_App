// Local Storage based data service — acts as database for the entire app.

const KEYS = {
  USERS: 'ttm_users',
  PROJECTS: 'ttm_projects',
  TASKS: 'ttm_tasks',
  TEAM_MEMBERS: 'ttm_team_members',
  CURRENT_USER: 'ttm_current_user',
};

// ---------- helpers ----------
const read = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ---------- seed demo data on first visit ----------
export function seedIfEmpty() {
  if (localStorage.getItem(KEYS.USERS)) return;
  const admin = { id: genId(), name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() };
  const member = { id: genId(), name: 'John Member', email: 'john@demo.com', password: 'john123', role: 'member', createdAt: new Date().toISOString() };
  write(KEYS.USERS, [admin, member]);
}

// ==================== AUTH ====================
export function login(email, password) {
  const users = read(KEYS.USERS);
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { error: 'Invalid email or password' };
  const safe = { ...user }; delete safe.password;
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safe));
  return { user: safe };
}

export function register({ name, email, password, role }) {
  const users = read(KEYS.USERS);
  if (users.find(u => u.email === email)) return { error: 'Email already registered' };
  const user = { id: genId(), name, email, password, role: role || 'member', createdAt: new Date().toISOString() };
  users.push(user);
  write(KEYS.USERS, users);
  const safe = { ...user }; delete safe.password;
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(safe));
  return { user: safe };
}

export function logout() { localStorage.removeItem(KEYS.CURRENT_USER); }

export function getCurrentUser() {
  const raw = localStorage.getItem(KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

export function getAllUsers() {
  return read(KEYS.USERS).map(({ password, ...u }) => u);
}

// ==================== PROJECTS ====================
export function getProjects(userId, userRole) {
  const projects = read(KEYS.PROJECTS);
  const members = read(KEYS.TEAM_MEMBERS);
  if (userRole === 'admin') return projects;
  const myProjectIds = members.filter(m => m.userId === userId).map(m => m.projectId);
  return projects.filter(p => p.createdBy === userId || myProjectIds.includes(p.id));
}

export function getProject(id) { return read(KEYS.PROJECTS).find(p => p.id === id) || null; }

export function createProject({ name, description, createdBy }) {
  const projects = read(KEYS.PROJECTS);
  const project = { id: genId(), name, description, status: 'active', createdBy, createdAt: new Date().toISOString() };
  projects.push(project);
  write(KEYS.PROJECTS, projects);
  // add creator as team admin
  addTeamMember({ projectId: project.id, userId: createdBy, role: 'admin' });
  return project;
}

export function updateProject(id, updates) {
  const projects = read(KEYS.PROJECTS);
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates };
  write(KEYS.PROJECTS, projects);
  return projects[idx];
}

export function deleteProject(id) {
  write(KEYS.PROJECTS, read(KEYS.PROJECTS).filter(p => p.id !== id));
  write(KEYS.TASKS, read(KEYS.TASKS).filter(t => t.projectId !== id));
  write(KEYS.TEAM_MEMBERS, read(KEYS.TEAM_MEMBERS).filter(m => m.projectId !== id));
}

// ==================== TEAM MEMBERS ====================
export function getTeamMembers(projectId) {
  const members = read(KEYS.TEAM_MEMBERS).filter(m => m.projectId === projectId);
  const users = getAllUsers();
  return members.map(m => ({ ...m, user: users.find(u => u.id === m.userId) }));
}

export function addTeamMember({ projectId, userId, role }) {
  const members = read(KEYS.TEAM_MEMBERS);
  if (members.find(m => m.projectId === projectId && m.userId === userId)) return { error: 'Already a member' };
  const member = { id: genId(), projectId, userId, role: role || 'member' };
  members.push(member);
  write(KEYS.TEAM_MEMBERS, members);
  return member;
}

export function removeTeamMember(projectId, userId) {
  write(KEYS.TEAM_MEMBERS, read(KEYS.TEAM_MEMBERS).filter(m => !(m.projectId === projectId && m.userId === userId)));
}

// ==================== TASKS ====================
export function getTasks(filters = {}, userId, userRole) {
  let tasks = read(KEYS.TASKS);
  const projects = read(KEYS.PROJECTS);
  const users = getAllUsers();
  const members = read(KEYS.TEAM_MEMBERS);

  // scope to user's projects if not admin
  if (userRole !== 'admin') {
    const myProjectIds = members.filter(m => m.userId === userId).map(m => m.projectId);
    const ownedIds = projects.filter(p => p.createdBy === userId).map(p => p.id);
    const allowedIds = [...new Set([...myProjectIds, ...ownedIds])];
    tasks = tasks.filter(t => allowedIds.includes(t.projectId));
  }

  if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
  if (filters.priority) tasks = tasks.filter(t => t.priority === filters.priority);
  if (filters.projectId) tasks = tasks.filter(t => t.projectId === filters.projectId);

  return tasks.map(t => ({
    ...t,
    assignee: users.find(u => u.id === t.assigneeId) || null,
    project: projects.find(p => p.id === t.projectId) || null,
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getTasksByProject(projectId) {
  const tasks = read(KEYS.TASKS).filter(t => t.projectId === projectId);
  const users = getAllUsers();
  return tasks.map(t => ({
    ...t,
    assignee: users.find(u => u.id === t.assigneeId) || null,
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function createTask({ title, description, status, priority, dueDate, projectId, assigneeId, createdBy }) {
  const tasks = read(KEYS.TASKS);
  const task = { id: genId(), title, description, status: status || 'todo', priority: priority || 'medium', dueDate: dueDate || null, projectId, assigneeId: assigneeId || null, createdBy, createdAt: new Date().toISOString() };
  tasks.push(task);
  write(KEYS.TASKS, tasks);
  return task;
}

export function updateTask(id, updates) {
  const tasks = read(KEYS.TASKS);
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  write(KEYS.TASKS, tasks);
  return tasks[idx];
}

export function deleteTask(id) {
  write(KEYS.TASKS, read(KEYS.TASKS).filter(t => t.id !== id));
}

// ==================== DASHBOARD ====================
export function getDashboardStats(userId, userRole) {
  const tasks = getTasks({}, userId, userRole);
  const projects = getProjects(userId, userRole);
  const today = new Date().toISOString().split('T')[0];

  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => t.dueDate && t.status !== 'done' && t.dueDate < today);
  const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
  const myPending = tasks.filter(t => t.assigneeId === userId && t.status !== 'done').length;

  return {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    tasksByStatus: { todo, 'in-progress': inProgress, done },
    overdueTasks: overdueTasks.length,
    overdueTaskDetails: overdueTasks.slice(0, 10),
    highPriorityTasks: highPriority,
    myPendingTasks: myPending,
    recentTasks: tasks.slice(0, 5),
  };
}
