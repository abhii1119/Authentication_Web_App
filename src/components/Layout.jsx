import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>📋 Task Manager</h2>
          <p>Team Collaboration</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>📊 Dashboard</NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>📁 Projects</NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>✅ Tasks</NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="user-info">
            <div className="avatar">{initials(user?.name)}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ width: '100%' }}>Logout</button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
