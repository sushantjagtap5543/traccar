import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import Navbar from "../components/Navbar";
import { DollarSign, CreditCard, Calendar, TrendingUp, Users, Download, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function BillingPage() {
  const [stats, setStats] = useState({
    monthlyRevenue: 12450,
    activeSubscriptions: 45,
    pendingPayments: 3,
    growth: 12.5
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashRecord, setCashRecord] = useState({ userId: '', imei: '', planSlug: '1month' });

  const revenueData = [
    { month: 'Jan', revenue: 4500 }, { month: 'Feb', revenue: 5200 },
    { month: 'Mar', revenue: 4800 }, { month: 'Apr', revenue: 6100 },
    { month: 'May', revenue: 5900 }, { month: 'Jun', revenue: 7200 },
    { month: 'Jul', revenue: 8500 }, { month: 'Aug', revenue: 9400 },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const subs = await api("/api/billing/subscriptions");
      setSubscriptions(Array.isArray(subs) ? subs : []);
      const billingStats = await api("/api/billing/stats");
      if (billingStats) setStats(billingStats);
      const planData = await api("/api/billing/plans");
      setPlans(planData || []);
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (p) => {
    const newAmt = prompt(`Update amount for ${p.name}:`, p.amount);
    if (!newAmt) return;
    try {
        await api(`/api/billing/plans/${p.id}`, { method: 'POST', body: JSON.stringify({ amount: parseFloat(newAmt) }) });
        fetchData();
    } catch (err) { alert(err.message); }
  }

  const handleRecordCash = async (e) => {
    e.preventDefault();
    try {
        await api("/api/billing/cash-record", { method: 'POST', body: JSON.stringify(cashRecord) });
        alert("Cash transaction synchronized with asset server.");
        setIsCashModalOpen(false);
        fetchData();
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="billing-page animate-fade-in shadow-inner">
      <Navbar />
      <div className="container">
        {isCashModalOpen && (
            <div className="modal-overlay">
                <div className="card modal-content" style={{ width: '450px', background: '#1e293b' }}>
                    <h2 style={{ fontWeight: 900, marginBottom: '1.5rem' }}>Synchronize Cash Settlement</h2>
                    <form onSubmit={handleRecordCash}>
                        <div className="input-group-light" style={{ marginBottom: '1rem' }}>
                            <label>Target User ID</label>
                            <input type="text" value={cashRecord.userId} onChange={e => setCashRecord({...cashRecord, userId: e.target.value})} required />
                        </div>
                        <div className="input-group-light" style={{ marginBottom: '1rem' }}>
                            <label>Asset Signature (IMEI)</label>
                            <input type="text" value={cashRecord.imei} onChange={e => setCashRecord({...cashRecord, imei: e.target.value})} required />
                        </div>
                        <div className="input-group-light" style={{ marginBottom: '2rem' }}>
                            <label>Assigned Plan</label>
                            <select value={cashRecord.planSlug} onChange={e => setCashRecord({...cashRecord, planSlug: e.target.value})} style={{ width: '100%', background: 'none', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'white' }}>
                                {plans.map(p => <option key={p.id} value={p.slug} style={{ background: '#1e293b' }}>{p.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Execute Reallocation</button>
                            <button type="button" className="btn glass-bright" style={{ flex: 1 }} onClick={() => setIsCashModalOpen(false)}>Abort</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-px' }}>Revenue Governance</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '1rem' }}>Enterprise billing, subscription management, and financial analytics.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn glass-bright" onClick={() => setIsPlanModalOpen(!isPlanModalOpen)}>
                 Plan Architecture
            </button>
            <button className="btn glass-bright" onClick={fetchData} disabled={loading}>
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} /> Refresh Financials
            </button>
          </div>
        </header>

        {isPlanModalOpen && (
            <div className="card animate-slide-up" style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>Global Plan Management</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {plans.map(p => (
                        <div key={p.id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 800 }}>{p.name}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>₹{p.amount}</div>
                            </div>
                            <button className="btn-icon glass-bright" onClick={() => handleUpdatePlan(p)}><RefreshCcw size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card stat-card" style={{ borderBottom: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                    <DollarSign size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>MONTHLY REVENUE</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>${stats.monthlyRevenue?.toLocaleString()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: 700 }}>
                <ArrowUpRight size={14} /> {stats.growth}% vs last month
            </div>
          </div>

          <div className="card stat-card" style={{ borderBottom: '4px solid var(--accent-purple)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--accent-purple)' }}>
                    <Users size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>ACTIVE SUBSCRIPTIONS</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.activeSubscriptions}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Active recurring contracts</div>
          </div>

          <div className="card stat-card" style={{ borderBottom: '4px solid #fbbf24' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '10px', borderRadius: '12px', color: '#fbbf24' }}>
                    <CreditCard size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>PENDING PAYMENTS</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.pendingPayments}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem', fontWeight: 700 }}>Action required</div>
          </div>

          <div className="card stat-card" style={{ borderBottom: '4px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--success)' }}>
                    <TrendingUp size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-dim)' }}>NET GROWTH</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>+24%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Quarterly expansion rate</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2.5rem', marginBottom: '2.5rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={20} color="var(--primary)" /> Revenue Trajectory
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn glass-bright" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>1M</button>
                        <button className="btn glass-bright" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', background: 'var(--primary)', color: 'white' }}>6M</button>
                        <button className="btn glass-bright" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>1Y</button>
                    </div>
                </div>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={12} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--text-dim)" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ background: '#1e293b', border: '1px solid var(--border)', borderRadius: '12px' }}
                                itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2.5rem' }}>Tactical Options</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setIsCashModalOpen(true)} style={{ height: '60px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', padding: '0 1.5rem', alignItems: 'center' }}>
                         <span style={{ fontWeight: 700 }}>Record Cash Receipt</span>
                         <DollarSign size={20} />
                    </button>
                    <button className="btn glass-bright" style={{ height: '60px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', padding: '0 1.5rem', color: 'white' }}>
                         <span style={{ fontWeight: 700 }}>Generate Global Invoice</span>
                         <Download size={20} />
                    </button>
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>Automatic Billing active for all clients on the 1st of every month.</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                            STRIPE CONNECT OPERATIONAL
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Client Subscriptions</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input className="input-field" placeholder="Search accounts..." style={{ margin: 0, padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)' }} />
                    <button className="btn glass-bright" style={{ padding: '0.5rem 1rem' }}>Filter</button>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Account</th>
                        <th>Plan Level</th>
                        <th>Device Count</th>
                        <th>Next Renewal</th>
                        <th>Status</th>
                        <th>Volume</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { name: "Global Logistics Ltd", plan: "Enterprise Premium", devices: 124, renewal: "2024-10-12", status: "Active", amount: 1540.00 },
                        { name: "Speedy Corriers INC", plan: "Professional Core", devices: 42, renewal: "2024-09-28", status: "Active", amount: 620.00 },
                        { name: "SafePath Security", plan: "Enterprise Premium", devices: 215, renewal: "2024-10-05", status: "Pending", amount: 2450.00 },
                        { name: "Blue Fleet Systems", plan: "Basic Tracking", devices: 12, renewal: "2024-09-15", status: "Overdue", amount: 120.00 },
                    ].map((sub, i) => (
                        <tr key={i}>
                            <td><span style={{ fontWeight: 700 }}>{sub.name}</span></td>
                            <td><span className="badge" style={{ background: sub.plan.includes('Enterprise') ? 'rgba(129, 140, 248, 0.1)' : 'rgba(255,255,255,0.05)', color: sub.plan.includes('Enterprise') ? 'var(--accent-purple)' : 'var(--text-dim)' }}>{sub.plan}</span></td>
                            <td>{sub.devices} Assets</td>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}><Calendar size={14} /> {sub.renewal}</div></td>
                            <td><span className={`badge ${sub.status === 'Active' ? 'badge-success' : sub.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>{sub.status}</span></td>
                            <td><span style={{ fontWeight: 800 }}>${sub.amount.toFixed(2)}</span></td>
                            <td style={{ textAlign: 'right' }}>
                                <button className="btn glass-bright" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>View Statement</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
