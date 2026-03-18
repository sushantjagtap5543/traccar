import { ShieldCheck, Zap } from "lucide-react";

export default function Loader() {
  return (
    <div className="loader-overlay" style={{ 
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 9999 
    }}>
      <div className="loader-content animate-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2rem' }}>
           <div className="loader-ring" style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
              borderRadius: '50%', border: '2px solid var(--primary)', 
              opacity: 0.2, animation: 'pulse 2s infinite' 
           }}></div>
           <div className="loader-ring-2" style={{ 
              position: 'absolute', top: '10%', left: '10%', width: '80%', height: '80%', 
              borderRadius: '50%', border: '2px solid var(--accent-purple)', 
              opacity: 0.1, animation: 'pulse 2s infinite 0.5s' 
           }}></div>
           <div style={{ 
              position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%', 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)', 
              borderRadius: '18px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', boxShadow: '0 0 30px var(--primary-glow)',
              transform: 'rotate(-5deg)'
           }}>
              <ShieldCheck size={32} color="white" />
           </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
           <Zap size={18} className="animate-pulse" color="var(--primary)" />
           <p style={{ 
              fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, 
              letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-main)' 
           }}>Establishing Link</p>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>GS-CONSULTING SECURE DATA HANDSHAKE</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}} />
    </div>
  );
}

