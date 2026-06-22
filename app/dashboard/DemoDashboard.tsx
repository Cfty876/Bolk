'use client';
import styles from './dashboard.module.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Plus, FileText, Activity, AlertTriangle, CheckCircle, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

const data = [
  { time: '08:00', temp: 14.5, o2: 8.2, ph: 7.1 },
  { time: '10:00', temp: 14.7, o2: 8.1, ph: 7.1 },
  { time: '12:00', temp: 15.2, o2: 7.8, ph: 7.2 },
  { time: '14:00', temp: 15.5, o2: 7.5, ph: 7.2 },
  { time: '16:00', temp: 15.1, o2: 7.9, ph: 7.1 },
  { time: '18:00', temp: 14.8, o2: 8.0, ph: 7.1 },
];

export default function DemoDashboard() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    fetch('/api/ai-forecasts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setForecasts(data);
      })
      .catch(console.error);
  }, []);

  const fetchAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data.slice(-2) })
      });
      const result = await res.json();
      if (result.id) {
        setForecasts([result, ...forecasts]);
      }
    } catch (e) {
      console.error('Ошибка получения прогноза от ИИ.');
    }
    setIsAiLoading(false);
  };

  const deleteForecast = async (id: string) => {
    setForecasts(forecasts.filter(f => f.id !== id));
    fetch(`/api/ai-forecasts/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h1 style={{fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-text-main)'}}>Сводка по ферме</h1>
        <div className={styles.quickActions}>
          <button className={styles.actionBtn}><Plus size={18} /> Добавить рыбу</button>
          <button className={styles.actionBtn}><FileText size={18} /> Отчёт</button>
          <button className={styles.actionBtn}><Activity size={18} /> Осмотр</button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Метрики */}
        <div className={`${styles.colSpan12} ${styles.metricsGrid}`}>
          <div className={`${styles.metricCard} ${styles.accent}`}>
            <div className={styles.metricLabel}>Всего рыбы (шт)</div>
            <div className={styles.metricValue}>20,000</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Биомасса (т)</div>
            <div className={styles.metricValue}>45.2</div>
          </div>
          <div className={`${styles.metricCard} ${styles.warning}`}>
            <div className={styles.metricLabel}>Критичные садки</div>
            <div className={styles.metricValue}>1</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Средний FCR</div>
            <div className={styles.metricValue}>1.12</div>
          </div>
        </div>

        {/* Графики */}
        <div className={`${styles.widget} ${styles.colSpan8}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>Качество воды (Садок #1)</div>
            <select style={{padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--color-text-main)'}}>
              <option>Садок #1 (Форель)</option>
              <option>Садок #2 (Осетр)</option>
            </select>
          </div>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                <XAxis dataKey="time" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip contentStyle={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
                <ReferenceArea y1={7} y2={9} fill="rgba(46, 204, 113, 0.1)" strokeOpacity={0} /> {/* Зона нормы O2 */}
                <Line type="monotone" dataKey="temp" stroke="#F39C12" strokeWidth={3} name="Температура (°C)" dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="o2" stroke="#00B4D8" strokeWidth={3} name="Кислород (мг/л)" dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Блок */}
        <div className={`${styles.widget} ${styles.colSpan4} ${styles.aiBlock}`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Bot size={20} color="var(--color-secondary)" /> AI Прогноз Рисков
            </div>
            <button onClick={fetchAiAnalysis} disabled={isAiLoading} style={{background: 'var(--color-secondary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: isAiLoading ? 'not-allowed' : 'pointer', fontSize: '0.85rem'}}>
              {isAiLoading ? 'Анализ...' : 'Получить'}
            </button>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div style={{background: 'var(--glass-bg)', padding: '16px', borderRadius: '10px', borderLeft: '4px solid var(--color-danger)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
              <div style={{background: 'var(--glass-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', minHeight: '150px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {forecasts.length > 0 ? forecasts.map(aiResult => (
                  <div key={aiResult.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', position: 'relative' }}>
                     <button onClick={() => deleteForecast(aiResult.id)} style={{position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1'}} title="Удалить прогноз">×</button>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                           padding: '4px 10px', 
                           borderRadius: '8px', 
                           fontSize: '0.8rem', 
                           fontWeight: 'bold',
                           background: aiResult.status === 'OK' ? 'rgba(46, 204, 113, 0.2)' : aiResult.status === 'WARNING' ? 'rgba(243, 156, 18, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                           color: aiResult.status === 'OK' ? '#2ecc71' : aiResult.status === 'WARNING' ? '#f39c12' : '#e74c3c'
                        }}>
                           {aiResult.status === 'OK' ? '✓ ВСЕ В НОРМЕ' : aiResult.status === 'WARNING' ? '⚠️ ВНИМАНИЕ' : '🚨 КРИТИЧЕСКИ'}
                        </span>
                        <span style={{color: 'var(--color-text-muted)', fontSize: '0.8rem'}}>
                          {new Date(aiResult.createdAt).toLocaleDateString('ru-RU', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                     <p style={{color: 'var(--color-text-main)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0}}>{aiResult.text}</p>
                     {aiResult.recommendation && (
                        <div style={{ background: 'rgba(52, 152, 219, 0.1)', borderLeft: '3px solid #3498db', padding: '10px 15px', borderRadius: '4px', marginTop: '8px' }}>
                           <p style={{ color: '#3498db', fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>Рекомендация ИИ:</p>
                           <p style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>{aiResult.recommendation}</p>
                        </div>
                     )}
                  </div>
                )) : (
                  <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <p style={{color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center'}}>Нажмите "Получить", чтобы ИИ проанализировал текущие показатели воды (O2, Temp, pH).</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
