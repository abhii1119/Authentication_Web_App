import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as db from '../data';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => { setStats(db.getDashboardStats(user.id, user.role)); }, [user]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  if (!stats) return <div className="loading">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ color: 'var(--g500)', fontSize: '.88rem' }}>Welcome back, {user.name}!</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon blue">📁</div><div className="stat-info"><h3>{stats.totalProjects}</h3><p>Total Projects</p></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-info"><h3>{stats.totalTasks}</h3><p>Total Tasks</p></div></div>
        <div className="stat-card"><div className="stat-icon yellow">⏳</div><div className="stat-info"><h3>{stats.tasksByStatus['in-progress']}</h3><p>In Progress</p></div></div>
        <div className="stat-card"><div className="stat-icon red">⚠️</div><div className="stat-info"><h3>{stats.overdueTasks}</h3><p>Overdue Tasks</p></div></div>
        <div className="stat-card"><div className="stat-icon purple">👤</div><div className="stat-info"><h3>{stats.myPendingTasks}</h3><p>My Pending</p></div></div>
      </div>

      <div className="two-col">
        {/* Status summary */}
        <div className="card">
          <div className="card-header"><h3>Tasks by Status</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>📋 To Do</span><span className="badge badge-todo">{stats.tasksByStatus.todo}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>🔄 In Progress</span><span className="badge badge-in-progress">{stats.tasksByStatus['in-progress']}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>✅ Done</span><span className="badge badge-done">{stats.tasksByStatus.done}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>🔴 High Priority (Open)</span><span className="badge badge-high">{stats.highPriorityTasks}</span></div>
          </div>
        </div>

        {/* Recent tasks */}
        <div className="card">
          <div className="card-header"><h3>Recent Tasks</h3></div>
          {stats.recentTasks.length === 0
            ? <p style={{ color: 'var(--g400)', fontSize: '.84rem' }}>No tasks yet</p>
            : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Task</th><th>Status</th><th>Project</th></tr></thead>
                  <tbody>
                    {stats.recentTasks.map(t => (
                      <tr key={t.id}><td>{t.title}</td><td><span className={`badge badge-${t.status}`}>{t.status}</span></td><td>{t.project?.name}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

      {/* Overdue */}
      {stats.overdueTaskDetails.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-header"><h3>⚠️ Overdue Tasks</h3></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>
                {stats.overdueTaskDetails.map(t => (
                  <tr key={t.id} className="overdue-row">
                    <td><strong>{t.title}</strong></td>
                    <td>{t.project?.name}</td>
                    <td>{t.assignee?.name || 'Unassigned'}</td>
                    <td className="overdue-date">{fmtDate(t.dueDate)}</td>
                    <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
