import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as db from '../data';
import Modal from '../components/Modal';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const list = db.getProjects(user.id, user.role).map(p => ({
      ...p,
      creator: db.getAllUsers().find(u => u.id === p.createdBy),
      teamMembers: db.getTeamMembers(p.id),
    }));
    setProjects(list);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = (e) => {
    e.preventDefault(); setError('');
    if (name.trim().length < 2) return setError('Name must be at least 2 characters');
    db.createProject({ name: name.trim(), description: description.trim(), createdBy: user.id });
    setShowModal(false); setName(''); setDescription(''); load();
  };

  const initials = (n) => n ? n.split(' ').map(c => c[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No Projects Yet</h3><p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3>{p.name}</h3>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </div>
              <p className="project-desc">{p.description || 'No description'}</p>
              <div className="project-meta">
                <span>By {p.creator?.name}</span>
                <div className="team-avatars">
                  {p.teamMembers.slice(0, 4).map(m => (
                    <div key={m.id} className="mini-avatar" title={m.user?.name}>{initials(m.user?.name)}</div>
                  ))}
                  {p.teamMembers.length > 4 && <div className="mini-avatar" style={{ background: 'var(--g400)' }}>+{p.teamMembers.length - 4}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}>Create Project</button></>}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group"><label>Project Name *</label><input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-group"><label>Description</label><textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} /></div>
        </form>
      </Modal>
    </div>
  );
}
