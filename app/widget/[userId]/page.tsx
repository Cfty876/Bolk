import { getPublicEcoWidgetData } from '../../actions';
import { Leaf } from 'lucide-react';
import React from 'react';

export default async function EcoWidgetPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  const data = await getPublicEcoWidgetData(resolvedParams.userId);

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: '#888' }}>
          Виджет не найден или приватный.
        </div>
      </div>
    );
  }

  const percentage = Math.min(100, Math.max(0, (data.ecoReleasedCount / data.ecoTargetRelease) * 100));

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,20,30,0.8), rgba(0,40,50,0.9))',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 180, 216, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 180, 216, 0.15), inset 0 0 20px rgba(0,180,216,0.05)',
        borderRadius: '24px',
        padding: '24px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-50%', left: '-50%',
          width: '200%', height: '200%',
          background: 'radial-gradient(circle at 50% 0%, rgba(0,180,216,0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(0,180,216,0.2)', padding: '8px', borderRadius: '12px', color: '#00b4d8' }}>
              <Leaf size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Эко-Миссия</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Хозяйство: {data.name}</p>
            </div>
          </div>

          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {data.ecoReleasedCount.toLocaleString('ru-RU')} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94a3b8' }}>шт</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>выпущено в природу</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#00b4d8' }}>{percentage.toFixed(1)}%</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>от цели {data.ecoTargetRelease.toLocaleString('ru-RU')}</div>
            </div>
          </div>

          <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ 
              height: '100%', 
              width: `${percentage}%`, 
              background: 'linear-gradient(90deg, #0077b6, #00b4d8, #48cae4)', 
              borderRadius: '100px',
              boxShadow: '0 0 10px rgba(0,180,216,0.5)',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
