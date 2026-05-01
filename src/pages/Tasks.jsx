import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as db from '../data';
import Modal from '../components/Modal';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tStatus, setTStatus] = useState('todo');
  const [tPriority, setTPriority] = useState('medium');
  const [tDue, setTDue] = useState('');
  const [tProject, setTProject] = useState('');
  const [tAssignee, setTAssignee] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const filters = {};
    if (filterStatus) filters.status = filterStatus;
    if (filterPriority) filters.priority = filterPriority;
    if (filterProject) filters.projectId = filterProject;
    setTasks(db.getTasks(filters, user.id, user.role));
    setProjects(db.getProjects(user.id, user.role));
    setAllUsers(db.getAllUsers());
  }, [user, filterStatus, filterPriority, filterProject]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setTTitle(''); setTDesc(''); setTStatus('todo'); setTPriority('medium'); setTDue(''); setTProject(''); setTAssignee(''); setError(''); };

  const handleCreate = (e) => {
    e.preventDefault(); setError('');
    if (!tProject) return setError('Please select a project');
    if (tTitle.trim().length < 2) return setError('Title must be at least 2 characters');
    db.createTask({ title: tTitle.trim(), description: tDesc.trim(), status: tStatus, priority: tPriority, dueDate: tDue || null, projectId: tProject, assigneeId: tAssignee || null, createdBy: user.id });
    setShowCreate(false); resetForm(); load();
  };

  const changeStatus = (tid, st) => { db.updateTask(tid, { status: st }); load(); };
  const delTask = (tid) => { if (!window.confirm('Delete this task?')) return; db.deleteTask(tid); load(); };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
  const isOverdue = (t) => t.dueDate && t.status !== 'done' && t.dueDate < new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="page-header">
        <h1>All Tasks</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Task</button>
      </div>

      <div className="filters-row">
        <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option>
        </select>
        <select className="form-control" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <select className="form-control" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state"><h3>No Tasks Found</h3><p>{filterStatus || filterPriority || filterProject ? 'Try changing your filters' : 'Create your first task'}</p></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th>Actions</th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} className={isOverdue(t) ? 'overdue-row' : ''}>
                    <td><strong>{t.title}</strong>{isOverdue(t) && <span className="overdue-label">OVERDUE</span>}</td>
                    <td>{t.project?.name}</td>
                    <td>
                      <select className="form-control" value={t.status} onChange={e => changeStatus(t.id, e.target.value)} style={{ width: 'auto', padding: '2px 6px', fontSize: '.78rem' }}>
                        <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option>
                      </select>
                    </td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td>{t.assignee?.name || 'Unassigned'}</td>
                    <td className={isOverdue(t) ? 'overdue-date' : ''}>{fmtDate(t.dueDate)}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => delTask(t.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="Create New Task"
        footer={<><button className="btn btn-secondary" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}>Create Task</button></>}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>Title *</label><input className="form-control" value={tTitle} onChange={e => setTTitle(e.target.value)} required /></div>
          <div className="form-group"><label>Project *</label>
            <select className="form-control" value={tProject} onChange={e => setTProject(e.target.value)} required>
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-control" value={tDesc} onChange={e => setTDesc(e.target.value)} /></div>
          <div className="two-col">
            <div className="form-group"><label>Status</label><select className="form-control" value={tStatus} onChange={e => setTStatus(e.target.value)}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option></select></div>
            <div className="form-group"><label>Priority</label><select className="form-control" value={tPriority} onChange={e => setTPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
          <div className="form-group"><label>Due Date</label><input type="date" className="form-control" value={tDue} onChange={e => setTDue(e.target.value)} /></div>
          <div className="form-group"><label>Assign To</label>
            <select className="form-control" value={tAssignee} onChange={e => setTAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
