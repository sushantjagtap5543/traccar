import React, { useEffect, useState } from "react";
import api from "../services/api";
import { CreditCard, Calendar, ShieldCheck, Download, RefreshCcw, DollarSign, Clock, ShieldAlert, X, Plus } from "lucide-react";

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashForm, setCashForm] = useState({ imei: "", amount: "", notes: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, historyRes] = await Promise.all([
        api.get("/billing/plans"),
        api.get("/billing/history")
      ]);
      setPlans(plansRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCashSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.post("/billing/client/cash-record", cashForm);
        alert("Tactical Cash Record Synchronized. High-Command verification pending.");
        setShowCashModal(false);
        fetchData();
    } catch (err) {
        alert("Record failed: " + err.message);
    }
  };

  const handleDownloadInvoice = async (payId) => {
    try {
        const { data } = await api.get(`/invoices/${payId}`);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GeoSure_Invoice_${payId.substring(0,8)}.json`;
        a.click();
    } catch (err) {
        alert("Invoice retrieval failed: " + err.message);
    }
  };

  const handlePay = async (plan) => {
    try {
        const { data: order } = await api.post("/billing/order", { planId: plan.slug });
        
        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: "GeoSurePath",
            description: `Subscription: ${plan.name}`,
            order_id: order.id,
            handler: async (response) => {
                await api.post("/billing/verify", {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    imei: "ALL_DEVICES" // Simplified for now
                });
                alert("Tactical subscription successfully provisioned!");
                fetchData();
            },
            theme: { color: "#06B6D4" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err) {
        alert("Payment initialization failed: " + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Synchronizing financial ledger...</div>;

  return (
    <div className="billing-client-page animate-fade-in container" style={{ padding: '2rem' }}>
       <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1.5px' }}>Financial Infrastructure</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Manage your prepaid ecosystem and tactical asset subscriptions.</p>
       </header>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
          {plans.map(plan => (
            <div key={plan.id} className="card" style={{ padding: '2.5rem', textAlign: 'center', borderTop: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                {plan.slug === '12month' && <div style={{ position: 'absolute', top: '12px', right: '-30px', background: 'var(--success)', color: 'white', padding: '4px 40px', fontSize: '0.7rem', fontWeight: 800, transform: 'rotate(45deg)' }}>BEST VALUE</div>}
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{plan.name}</h3>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.2rem', verticalAlign: 'super' }}>₹</span>
                    {plan.amount}
                </div>
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <ShieldCheck size={16} color="var(--success)" /> 24/7 Strategic Monitoring
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <Clock size={16} color="var(--primary)" /> {plan.validityMonths} Months Governance
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        <ShieldAlert size={16} color="var(--primary)" /> Prepaid Tactical Access
                    </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', height: '54px', borderRadius: '16px' }} onClick={() => handlePay(plan)}>Activate Plan</button>
                <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-dim)' }}>Tax (GST 18%) calculated at checkout.</p>
            </div>
          ))}
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
             <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>Transaction History</h3>
                <button className="btn glass-bright" onClick={fetchData}><RefreshCcw size={16} /></button>
             </div>
             <table style={{ background: 'transparent' }}>
                <thead>
                   <tr>
                      <th>Transaction ID</th>
                      <th>Method</th>
                      <th>Volume</th>
                      <th>Execution Date</th>
                      <th style={{ textAlign: 'right' }}>Intel</th>
                   </tr>
                </thead>
                <tbody>
                   {history.map(pay => (
                      <tr key={pay.id}>
                         <td><code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{pay.paymentId || pay.orderId.substring(0, 12)}</code></td>
                         <td style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                            {pay.attributes?.method || 'ONLINE'}
                         </td>
                         <td><span style={{ fontWeight: 800 }}>₹{pay.amount}</span></td>
                         <td>{new Date(pay.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                             <span className={`badge ${pay.status === 'captured' ? 'badge-success' : 'badge-warning'}`}>
                                {pay.status === 'captured' ? 'Succeeded' : 'Pending'}
                             </span>
                             <button className="btn-icon" onClick={() => handleDownloadInvoice(pay.id)} title="Download Strategic Invoice">
                                 <Download size={14} />
                             </button>
                          </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div>
             <div className="card" style={{ marginBottom: '2rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px dashed var(--primary)' }}>
                <h4 style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <DollarSign size={18} /> Cash Settlement
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                   Prefer an offline transaction? Contact your local GeoSure executive for a cash settlement and record the details here for fast verification.
                </p>
                <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setShowCashModal(true)}>Record Cash Payment</button>
             </div>
             
             <div className="card">
                <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Strategic Security</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: 'var(--success)' }}>
                         <ShieldCheck size={20} />
                      </div>
                      <div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>PCI-DSS Level 1</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Encrypted signal processing</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}>
                         <CreditCard size={20} />
                      </div>
                      <div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Instant Provisioning</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Zero downtime activation</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>

       {showCashModal && (
         <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <div className="card modal-content animate-slide-up" style={{ width: '450px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ margin: 0 }}>Record Offline Cash</h3>
                    <button className="btn-icon" onClick={() => setShowCashModal(false)}><X size={20} /></button>
                </header>
                <form onSubmit={handleCashSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label className="label">Asset Identifier (IMEI)</label>
                        <input type="text" placeholder="IMEI for renewal" required value={cashForm.imei} onChange={(e) => setCashForm({...cashForm, imei: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label className="label">Amount Paid (INR)</label>
                        <input type="number" placeholder="Enter amount" required value={cashForm.amount} onChange={(e) => setCashForm({...cashForm, amount: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label className="label">Tactical Notes / Sequence</label>
                        <textarea rows="3" placeholder="Reference number or executive name..." value={cashForm.notes} onChange={(e) => setCashForm({...cashForm, notes: e.target.value})} />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.25rem' }}>Submit for Strategic Verification</button>
                </form>
            </div>
         </div>
       )}
    </div>
  );
}
