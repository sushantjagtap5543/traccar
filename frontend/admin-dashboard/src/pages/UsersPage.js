import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { Users, Search, Filter, Shield, User, MoreVertical, Mail } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", administrator: false });

  const fetchUsers = () => {
    setLoading(true);
    api("/api/users")
      .then(res => {
        setUsers(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch users", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = (e) => {
    e.preventDefault();
    api("/api/users", {
        method: 'POST',
        body: JSON.stringify(newUser)
    }).then(() => {
        setIsModalOpen(false);
        setNewUser({ name: "", email: "", password: "", administrator: false });
        fetchUsers();
    }).catch(err => alert(err.message));
  };

  return (
    <div className="users-page animate-fade-in">
      <Navbar />
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-1px' }}>Operative Roster</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Manage all authorized personnel and system access level assignments.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <div className="input-group" style={{ width: '300px', margin: 0 }}>
                <Search size={18} className="input-icon" />
                <input type="text" placeholder="Find operative..." style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
             </div>
             <button className="btn glass-bright" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} /> Bulk Provisioning
             </button>
             <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Add Operative</button>
          </div>
        </header>

        {isModalOpen && (
            <div className="modal-overlay">
                <div className="card modal-content animate-slide-up" style={{ width: '450px' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontWeight: 900 }}>Provision New Operative</h2>
                    <form onSubmit={handleCreateUser}>
                        <div className="input-group-light" style={{ marginBottom: '1rem' }}>
                            <label>Full Asset Manager Name</label>
                            <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                        </div>
                        <div className="input-group-light" style={{ marginBottom: '1rem' }}>
                            <label>Authentication Email</label>
                            <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                        </div>
                        <div className="input-group-light" style={{ marginBottom: '1rem' }}>
                            <label>System Access Key (Password)</label>
                            <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                        </div>
                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" checked={newUser.administrator} onChange={e => setNewUser({...newUser, administrator: e.target.checked})} />
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Escalate to Master Authority (Admin)</label>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Deploy Operative</button>
                            <button type="button" className="btn glass-bright" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Abort</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="animate-fade-in">
            <thead>
              <tr>
                <th>Operative Identity</th>
                <th>Authentication Email</th>
                <th>Access Level</th>
                <th>Operative Status</th>
                <th>System ID</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={user.status === 'suspended' ? { opacity: 0.5 } : {}}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: user.status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: user.status === 'suspended' ? 'var(--danger)' : 'var(--primary)' }}>
                          {user.status === 'suspended' ? <Shield size={18} /> : <User size={20} />}
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{user.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                       <Mail size={16} />
                       {user.email}
                    </div>
                  </td>
                  <td>
                    {user.administrator ? (
                      <span className="badge" style={{ background: 'rgba(129, 140, 248, 0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(129, 140, 248, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={14} /> Master Authority
                      </span>
                    ) : (
                      <span className="badge badge-success">Field Operative</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'suspended' ? 'badge-danger' : 'badge-success'}`}>
                        {user.status?.toUpperCase() || "ACTIVE"}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontSize: '0.85rem' }}>#{user.id?.toString().substring(0,8)}</td>
                  <td style={{ textAlign: 'right' }}>
                     <button className="btn glass-bright" style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', color: user.status === 'suspended' ? 'var(--success)' : 'var(--danger)' }} onClick={() => {
                        api(`/api/users/${user.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: user.status === 'suspended' ? 'active' : 'suspended' })
                        }).then(fetchUsers);
                     }}>
                        {user.status === 'suspended' ? "Reactivate Access" : "Revoke Access"}
                     </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                   <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      No authorized operatives found in local repository.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

