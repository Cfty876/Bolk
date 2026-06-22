'use client';

import { useState, useEffect } from 'react';
import { X, Monitor } from 'lucide-react';

export default function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check screen size
    const checkSize = () => {
      if (window.innerWidth <= 768 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '15px',
      zIndex: 99999,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'rgba(0, 180, 216, 0.2)', padding: '8px', borderRadius: '50%' }}>
          <Monitor size={20} color="#00B4D8" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Лучший опыт — на ПК</span>
          <span style={{ color: '#A0AAB2', fontSize: '0.75rem' }}>На компьютере всё выглядит лучше!</span>
        </div>
      </div>
      
      <button 
        onClick={() => setIsDismissed(true)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          flexShrink: 0
        }}
      >
        <X size={16} />
      </button>
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
