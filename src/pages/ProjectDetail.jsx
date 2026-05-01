import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as db from '../data';
import Modal from '../components/Modal';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');

  // edit project
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('active');

  // add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [selUserId, setSelUserId] = useState('');
  const [memRole, setMemRole] = useState('member');

  // create task
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tStatus, setTStatus] = useState('todo');
  const [tPriority, setTPriority] = useState('medium');
  const [tDue, setTDue] = useState('');
  const [tAssignee, setTAssignee] = useState('');

  // edit task
  const [editTask, setEditTask] = useState(null);
  const [etTitle, setEtTitle] = useState('');
  const [etDesc, setEtDesc] = useState('');
  const [etStatus, setEtStatus] = useState('todo');
  const [etPriority, setEtPriority] = useState('medium');
  const [etDue, setEtDue] = useState('');
  const [etAssignee, setEtAssignee] = useState('');

  const load = useCallback(() => {
    const p = db.getProject(id);
    if (!p) { setError('Project not found'); return; }
    setProject(p);
    setEditName(p.name); setEditDesc(p.description || ''); setEditStatus(p.status);
    setTasks(db.getTasksByProject(id));
    setMembers(db.getTeamMembers(id));
    setAllUsers(db.getAllUsers());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isAdmin = () => user.role === 'admin' || project?.createdBy === user.id || members.find(m => m.userId === user.id && m.role === 'admin');

  const saveProject = () => { db.updateProject(id, { name: editName, description: editDesc, status: editStatus }); setEditing(false); load(); };
  const delProject = () => { if (!window.confirm('Delete this project and all its tasks?')) return; db.deleteProject(id); navigate('/projects'); };

  const addMember = () => {
    if (!selUserId) return;
    const r = db.addTeamMember({ projectId: id, userId: selUserId, role: memRole });
    if (r.error) { setError(r.error); return; }
    setShowAddMember(false); setSelUserId(''); setMemRole('member'); load();
  };
  const removeMember = (uid) => { if (!window.confirm('Remove this member?')) return; db.removeTeamMember(id, uid); load(); };

  const createTask = (e) => {
    e.preventDefault();
    if (tTitle.trim().length < 2) { setError('Title must be at least 2 characters'); return; }
    db.createTask({ title: tTitle.trim(), description: tDesc.trim(), status: tStatus, priority: tPriority, dueDate: tDue || null, projectId: id, assigneeId: tAssignee || null, createdBy: user.id });
    setShowCreateTask(false); setTTitle(''); setTDesc(''); setTStatus('todo'); setTPriority('medium'); setTDue(''); setTAssignee(''); load();
  };

  const openEditTask = (t) => {
    setEditTask(t); setEtTitle(t.title); setEtDesc(t.description || '');
    setEtStatus(t.status); setEtPriority(t.priority); setEtDue(t.dueDate || ''); setEtAssignee(t.assigneeId || '');
  };
  const saveTask = () => {
    db.updateTask(editTask.id, { title: etTitle, description: etDesc, status: etStatus, priority: etPriority, dueDate: etDue || null, assigneeId: etAssignee || null });
    setEditTask(null); load();
  };
  const delTask = (tid) => { if (!window.confirm('Delete this task?')) return; db.deleteTask(tid); load(); };
  const quickStatus = (tid, st) => { db.updateTask(tid, { status: st }); load(); };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
  const isOverdue = (t) => t.dueDate && t.status !== 'done' && t.dueDate < new Date().toISOString().split('T')[0];
  const initials = (n) => n ? n.split(' ').map(c => c[0]).join('').toUpperCase().slice(0, 2) : '?';

  if (!project) return <div className="alert alert-error">{error || 'Project not found'}</div>;

  const memberIds = members.map(m => m.userId);
  const availableUsers = allUsers.filter(u => !memberIds.includes(u.id));

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 8 }}>← Back to Projects</button>
          {editing ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="form-control" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: 280 }} />
              <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ width: 140 }}>
                <option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={saveProject}>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <h1>{project.name} <span className={`badge badge-${project.status}`}>{project.status}</span></h1>
          )}
          {!editing && <p style={{ color: 'var(--g500)', fontSize: '.88rem' }}>{project.description || 'No description'}</p>}
        </div>
        {isAdmin() && !editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={delProject}>Delete</button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        {/* TASKS */}
        <div className="card">
          <div className="card-header">
            <h3>Tasks ({tasks.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}>+ Add Task</button>
          </div>
          {tasks.length === 0 ? <div className="empty-state"><p>No tasks yet. Create your first task!</p></div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th><th>Actions</th></tr></thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id} className={isOverdue(t) ? 'overdue-row' : ''}>
                      <td><strong>{t.title}</strong>{isOverdue(t) && <span className="overdue-label">OVERDUE</span>}</td>
                      <td>
                        <select className="form-control" value={t.status} onChange={e => quickStatus(t.id, e.target.value)} style={{ width: 'auto', padding: '2px 6px', fontSize: '.78rem' }}>
                          <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option>
                        </select>
                      </td>
                      <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                      <td>{t.assignee?.name || 'Unassigned'}</td>
                      <td className={isOverdue(t) ? 'overdue-date' : ''}>{fmtDate(t.dueDate)}</td>
                      <td><div className="action-btns"><button className="btn btn-secondary btn-sm" onClick={() => openEditTask(t)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => delTask(t.id)}>Del</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TEAM SIDEBAR */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Team ({members.length})</h3>
              {isAdmin() && <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>+ Add</button>}
            </div>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--g100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="mini-avatar" style={{ marginLeft: 0 }}>{initials(m.user?.name)}</div>
                  <div><div style={{ fontSize: '.84rem', fontWeight: 500 }}>{m.user?.name}</div><div style={{ fontSize: '.72rem', color: 'var(--g400)' }}>{m.user?.email}</div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                  {isAdmin() && m.userId !== project.createdBy && <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.userId)} style={{ padding: '1px 5px', fontSize: '.68rem' }}>×</button>}
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><h3>Project Info</h3></div>
            <div style={{ fontSize: '.84rem', color: 'var(--g600)' }}>
              <p><strong>Created by:</strong> {allUsers.find(u => u.id === project.createdBy)?.name}</p>
              <p><strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className={`badge badge-${project.status}`}>{project.status}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* ADD MEMBER MODAL */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button><button className="btn btn-primary" onClick={addMember}>Add Member</button></>}>
        <div className="form-group"><label>Select User</label>
          <select className="form-control" value={selUserId} onChange={e => setSelUserId(e.target.value)}>
            <option value="">-- Select --</option>
            {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
        <div className="form-group"><label>Role</label>
          <select className="form-control" value={memRole} onChange={e => setMemRole(e.target.value)}><option value="member">Member</option><option value="admin">Admin</option></select>
        </div>
      </Modal>

      {/* CREATE TASK MODAL */}
      <Modal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} title="Create New Task"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreateTask(false)}>Cancel</button><button className="btn btn-primary" onClick={createTask}>Create Task</button></>}>
        <form onSubmit={createTask}>
          <div className="form-group"><label>Title *</label><input className="form-control" value={tTitle} onChange={e => setTTitle(e.target.value)} required /></div>
          <div className="form-group"><label>Description</label><textarea className="form-control" value={tDesc} onChange={e => setTDesc(e.target.value)} /></div>
          <div className="two-col">
            <div className="form-group"><label>Status</label><select className="form-control" value={tStatus} onChange={e => setTStatus(e.target.value)}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option></select></div>
            <div className="form-group"><label>Priority</label><select className="form-control" value={tPriority} onChange={e => setTPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
          <div className="form-group"><label>Due Date</label><input type="date" className="form-control" value={tDue} onChange={e => setTDue(e.target.value)} /></div>
          <div className="form-group"><label>Assign To</label>
            <select className="form-control" value={tAssignee} onChange={e => setTAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.userId} value={m.userId}>{m.user?.name}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      {/* EDIT TASK MODAL */}
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task"
        footer={<><button className="btn btn-secondary" onClick={() => setEditTask(null)}>Cancel</button><button className="btn btn-primary" onClick={saveTask}>Save Changes</button></>}>
        <div className="form-group"><label>Title *</label><input className="form-control" value={etTitle} onChange={e => setEtTitle(e.target.value)} required /></div>
        <div className="form-group"><label>Description</label><textarea className="form-control" value={etDesc} onChange={e => setEtDesc(e.target.value)} /></div>
        <div className="two-col">
          <div className="form-group"><label>Status</label><select className="form-control" value={etStatus} onChange={e => setEtStatus(e.target.value)}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option></select></div>
          <div className="form-group"><label>Priority</label><select className="form-control" value={etPriority} onChange={e => setEtPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        </div>
        <div className="form-group"><label>Due Date</label><input type="date" className="form-control" value={etDue} onChange={e => setEtDue(e.target.value)} /></div>
        <div className="form-group"><label>Assign To</label>
          <select className="form-control" value={etAssignee} onChange={e => setEtAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.userId} value={m.userId}>{m.user?.name}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}
