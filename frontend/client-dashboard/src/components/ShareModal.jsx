import { useState } from "react";
import { X, Copy, Clock, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import api from "../services/api";

export default function ShareModal({ isOpen, onClose, deviceId }) {
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/share/${deviceId}`, { hours });
      const fullUrl = `${window.location.origin}/share/${res.code}`;
      setShareLink(fullUrl);
    } catch (err) {
      alert("Failed to generate strategic link: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="glass modal-content animate-scale-in" style={{ width: '450px', padding: '2.5rem', borderRadius: '32px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Strategic Sharing</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Open a temporary portal for this asset</p>
          </div>
          <button className="btn-icon glass-bright" onClick={onClose}><X size={20} /></button>
        </header>

        {!shareLink ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'block' }}>TEMPORAL PERSISTENCE (HOURS)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[1, 4, 12, 24].map(h => (
                  <button 
                    key={h}
                    onClick={() => setHours(h)}
                    className={hours === h ? "btn-primary" : "btn glass-bright"}
                    style={{ padding: '0.75rem', fontSize: '0.85rem' }}
                  >
                    {h}H
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', padding: '1.25rem' }} onClick={handleGenerate} disabled={loading}>
              {loading ? "Establishing Secure Link..." : "Establish Public Intel Portal"}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <LinkIcon size={32} />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>Secure Portal Ready</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>This link will self-destruct in {hours} hours.</p>
            </div>
            <div className="glass-bright" style={{ padding: '1rem', borderRadius: '16px', wordBreak: 'break-all', fontSize: '0.8rem', fontWeight: 600, border: '1px dashed var(--primary)' }}>
              {shareLink}
            </div>
            <button className={`btn ${copied ? 'btn-success' : 'btn-primary'}`} style={{ width: '100%', padding: '1.25rem' }} onClick={copyToClipboard}>
              {copied ? <><CheckCircle2 size={18} /> Copied to Clipboard</> : <><Copy size={18} /> Copy Tactical URL</>}
            </button>
            <button className="btn underline" style={{ fontSize: '0.8rem', opacity: 0.6 }} onClick={() => setShareLink("")}>Generate Different Link</button>
          </div>
        )}
      </div>
    </div>
  );
}
