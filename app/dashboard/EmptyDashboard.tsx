'use client';
import styles from './dashboard.module.css';
import { Plus, Database, Droplets, Activity, FileText, Camera, Trash2, Bot, Thermometer, Clock, Fish, CheckCircle2, AlertTriangle, Syringe, Eye, CalendarDays } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCage, addSensor, deleteCage, markTaskComplete, deleteTaskSchedule } from '../actions';
import WebRTCViewer from './WebRTCViewer';
import WebRTCBroadcaster from './WebRTCBroadcaster';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

export default function EmptyDashboard({ cages, userName, tasks, averageFCR }: { cages: any[], userName: string, tasks: any[], averageFCR?: string | null }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [activeCage, setActiveCage] = useState<{id: string, name: string} | null>(null);

  const [newCageName, setNewCageName] = useState('');
  const [newFishType, setNewFishType] = useState('Нерка');
  const [newSensorType, setNewSensorType] = useState('O2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSensorSubmitting, setIsSensorSubmitting] = useState(false);
  const [createdSensor, setCreatedSensor] = useState<any>(null);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [isBroadcasterOpen, setIsBroadcasterOpen] = useState(false);

  const [selectedChartCageId, setSelectedChartCageId] = useState<string>('');
  const [activeChartCage, setActiveChartCage] = useState<{id: string, name: string, fishType: string} | null>(null);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMarkingTask, setIsMarkingTask] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ai-forecasts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setForecasts(data);
      })
      .catch(console.error);
  }, []);

  const [mortalityTask, setMortalityTask] = useState<any>(null);
  const [mortalityQty, setMortalityQty] = useState<number>(0);
  const [mortalityReason, setMortalityReason] = useState<string>('');

  const handleMarkTaskBtn = (task: any) => {
    if (task.type === 'INSPECTION' || task.type === 'VET') {
       setMortalityTask(task);
       setMortalityQty(0);
       setMortalityReason('');
    } else {
       handleMarkTask(task.id);
    }
  };

  const handleMarkTask = async (scheduleId: string, qty?: number, reason?: string) => {
    setIsMarkingTask(scheduleId);
    try {
      await markTaskComplete(scheduleId, qty, reason);
    } catch (e: any) {
      alert(e.message || 'Ошибка');
    }
    setIsMarkingTask(null);
    setMortalityTask(null);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту задачу навсегда?')) {
      await deleteTaskSchedule(scheduleId);
    }
  };

  const handleCreateCage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createCage(newCageName, newFishType);
    setIsModalOpen(false);
    setNewCageName('');
    setIsSubmitting(false);
  };

  const handleAddSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCage) return;
    setIsSensorSubmitting(true);
    const sensor = await addSensor(activeCage.id, newSensorType);
    setIsSensorModalOpen(false);
    setIsSensorSubmitting(false);
    setCreatedSensor(sensor);
    setIsIntegrationModalOpen(true);
  };

  const totalCages = cages?.length || 0;
  const totalFish = cages?.reduce((sum, c) => {
    const batchesSum = c.fishes?.reduce((acc: number, f: any) => acc + (f.quantity || 0), 0) || 0;
    return sum + batchesSum + (c.fishCount || 0);
  }, 0) || 0;

  const chartData = useMemo(() => {
    const currentCage = cages.find(c => c.id === (selectedChartCageId || cages[0]?.id));
    if (!currentCage || !currentCage.sensors) return [];
    
    const dataMap = new Map<string, any>();
    
    currentCage.sensors.forEach((sensor: any) => {
      if (!sensor.telemetry) return;
      sensor.telemetry.forEach((t: any) => {
        const timeKey = new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!dataMap.has(timeKey)) dataMap.set(timeKey, { time: timeKey });
        
        const entry = dataMap.get(timeKey);
        if (sensor.type === 'TEMP') entry.temp = t.value;
        if (sensor.type === 'O2') entry.o2 = t.value;
        if (sensor.type === 'PH') entry.ph = t.value;
      });
    });

    return Array.from(dataMap.values()).sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedChartCageId, cages]);

  const fetchAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: chartData.length > 0 ? chartData : { message: "Датчики пока не передали метрики.", farmSummary: cages.map(c => ({ name: c.name, fishType: c.fishType, fishCount: c.fishCount })) },
          fishType: cages.find(c => c.id === (selectedChartCageId || cages[0]?.id))?.fishType || 'Рыба'
        })
      });
      const result = await res.json();
      if (result.id) {
        setForecasts([result, ...forecasts]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsAiLoading(false);
  };

  const deleteForecast = async (id: string) => {
    setForecasts(forecasts.filter(f => f.id !== id));
    fetch(`/api/ai-forecasts/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px'}}>
        <div>
          <h2 style={{fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-main)', marginBottom: '8px'}}>Привет, {userName || 'Пользователь'} 👋</h2>
          <p style={{color: 'var(--color-text-muted)', fontSize: '1.1rem'}}>Добро пожаловать в панель управления аквафермой.</p>
        </div>
        <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
          <button onClick={() => setIsBroadcasterOpen(true)} className="btn-outline" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1.05rem', background: 'var(--color-bg-light)'}}>
            <Camera size={20} /> Телефон как Камера
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'}}>
            <Plus size={20} /> Добавить садок
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Метрики */}
        <div className={`${styles.colSpan12} ${styles.metricsGrid}`}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Всего рыбы (шт)</div>
            <div className={styles.metricValue}>{totalFish}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Садков</div>
            <div className={styles.metricValue}>{totalCages}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Критичные садки</div>
            <div className={styles.metricValue}>0</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Средний FCR</div>
            <div className={styles.metricValue}>{averageFCR || '-'}</div>
          </div>
        </div>

        {totalCages === 0 ? (
          /* Пустое пространство с призывом к действию */
          <div className={`${styles.widget} ${styles.colSpan12}`} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center'}}>
            <div style={{marginBottom: '24px', opacity: 0.6}}>
              <Database size={80} color="var(--color-secondary)" />
            </div>
            <h2 style={{fontSize: '1.8rem', fontWeight: '700', marginBottom: '12px', color: 'var(--color-text-main)'}}>Рабочее место готово</h2>
            <p style={{fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '550px', marginBottom: '32px', lineHeight: '1.5'}}>
              В вашей системе пока нет данных. Добавьте первый садок и подключите датчики воды, чтобы начать цифровой мониторинг вашей аквафермы.
            </p>
            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center'}}>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 32px', fontSize: '1.1rem'}}>
                <Database size={20} /> Добавить садок
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Задачи на сегодня */}
            <div className={`${styles.widget} ${styles.colSpan12}`}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
                <h3 style={{fontSize: '1.4rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0}}>
                  <Clock size={24} color="var(--color-secondary)" /> Задачи на сегодня
                </h3>
                <Link href="/dashboard/calendar" className="btn-outline" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.95rem', textDecoration: 'none'}}>
                  <CalendarDays size={18} /> Весь календарь
                </Link>
              </div>
              
              {!tasks || tasks.length === 0 ? (
                <div style={{textAlign: 'center', padding: '30px 20px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px dashed var(--color-border)'}}>
                  <CheckCircle2 size={40} color="var(--color-text-muted)" style={{marginBottom: '10px', opacity: 0.5}} />
                  <h4 style={{margin: '0 0 5px 0', color: 'var(--color-text-main)'}}>На сегодня задач нет</h4>
                  <p style={{margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem'}}>Вы можете отдыхать или посмотреть расписание на другие дни в календаре.</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {tasks.map(task => (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px',
                      background: task.status === 'MISSED' ? 'rgba(231, 76, 60, 0.05)' : task.status === 'COMPLETED' ? 'rgba(46, 204, 113, 0.05)' : 'var(--glass-bg)',
                      border: `1px solid ${task.status === 'MISSED' ? 'rgba(231, 76, 60, 0.3)' : task.status === 'COMPLETED' ? 'rgba(46, 204, 113, 0.3)' : 'var(--glass-border)'}`
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <div style={{
                          padding: '10px', borderRadius: '50%', 
                          background: task.status === 'MISSED' ? 'rgba(231, 76, 60, 0.1)' : task.status === 'COMPLETED' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(52, 152, 219, 0.1)',
                          color: task.status === 'MISSED' ? '#E74C3C' : task.status === 'COMPLETED' ? 'var(--color-accent)' : 'var(--color-secondary)'
                        }}>
                          {task.type === 'VET' ? <Syringe size={20} /> : task.type === 'INSPECTION' ? <Eye size={20} /> : <Fish size={20} />}
                        </div>
                        <div>
                          <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-main)'}}>{task.time} — {task.cageName}</div>
                          <div style={{color: 'var(--color-text-muted)', fontSize: '0.9rem'}}>
                            {task.type === 'FEEDING' ? `Кормление: ${task.foodType}, ${task.amountKg} кг` : 
                             task.type === 'VET' ? `Ветеринар: ${task.title}` : 
                             `Осмотр: ${task.title}`}
                          </div>
                        </div>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        {task.status === 'COMPLETED' ? (
                          <span style={{display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-accent)', fontWeight: 'bold'}}>
                            <CheckCircle2 size={18} /> Выполнено
                          </span>
                        ) : task.status === 'MISSED' ? (
                          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                            <span style={{color: '#E74C3C', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                              <AlertTriangle size={18} /> Пропущено!
                            </span>
                            <button 
                              onClick={() => handleMarkTaskBtn(task)} 
                              disabled={isMarkingTask === task.id}
                              className="btn-danger" 
                              style={{padding: '8px 16px', fontSize: '0.9rem'}}
                            >
                              {isMarkingTask === task.id ? '...' : 'Отметить сейчас'}
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleMarkTaskBtn(task)} 
                            disabled={isMarkingTask === task.id}
                            className="btn-primary" 
                            style={{padding: '8px 16px', fontSize: '0.9rem'}}
                          >
                            {isMarkingTask === task.id ? '...' : 'Отметить выполнение'}
                          </button>
                        )}
                        <button onClick={() => handleDeleteSchedule(task.id)} style={{background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '5px'}} title="Удалить задачу">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Список садков */}
            <div className={`${styles.widget} ${styles.colSpan12}`}>
              <h3 style={{fontSize: '1.4rem', marginBottom: '20px', color: 'var(--color-text-main)'}}>Ваши садки</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
              {cages.map(cage => {
                const statusText = cage.status === 'GOOD' ? 'В норме' : cage.status === 'WARNING' ? 'Внимание' : cage.status === 'CRITICAL' ? 'Критично' : cage.status;
                return (
                <div key={cage.id} style={{padding: '20px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <h4 style={{fontSize: '1.2rem', color: 'var(--color-text-main)', fontWeight: 'bold'}}>{cage.name}</h4>
                    <span style={{padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', background: statusText === 'Внимание' ? 'rgba(243, 156, 18, 0.1)' : statusText === 'Критично' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: statusText === 'Внимание' ? '#F39C12' : statusText === 'Критично' ? '#E74C3C' : 'var(--color-accent)'}}>{statusText}</span>
                  </div>
                  <p style={{color: 'var(--color-text-muted)', marginBottom: '15px', fontSize: '0.9rem'}}>Вид: {cage.fishType}</p>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button onClick={() => { setActiveCage({id: cage.id, name: cage.name}); setIsSensorModalOpen(true); }} className="btn-outline" style={{padding: '8px 16px', fontSize: '0.85rem', flex: 1}}>Датчики</button>
                    <button onClick={() => { setActiveCage({id: cage.id, name: cage.name}); setIsCameraModalOpen(true); }} className="btn-outline" style={{padding: '8px 16px', fontSize: '0.85rem', flex: 1}}>Камера</button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
          </>
        )}

        {/* Графики и AI (показываем только если есть садки) */}
        {totalCages > 0 && (
          <>
            <div className={`${styles.widget} ${styles.colSpan8}`}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>Качество воды</div>
                <select value={selectedChartCageId || activeChartCage?.id || ''} onChange={e => setSelectedChartCageId(e.target.value)} style={{padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--color-text-main)'}}>
                  {cages.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.fishType})</option>
                  ))}
                </select>
              </div>
              <div style={{ height: '350px' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                      <XAxis dataKey="time" stroke="var(--color-text-muted)" />
                      <YAxis stroke="var(--color-text-muted)" />
                      <Tooltip contentStyle={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px'}} />
                      <ReferenceArea y1={7} y2={9} fill="rgba(46, 204, 113, 0.1)" strokeOpacity={0} /> {/* Зона нормы O2 */}
                      <Line type="monotone" dataKey="temp" stroke="#F39C12" strokeWidth={3} name="Температура (°C)" dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                      <Line type="monotone" dataKey="o2" stroke="#00B4D8" strokeWidth={3} name="Кислород (мг/л)" dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                      <Line type="monotone" dataKey="ph" stroke="#9B59B6" strokeWidth={3} name="pH" dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)'}}>Нет данных от датчиков для построения графика.</div>
                )}
              </div>
            </div>

            <div className={`${styles.widget} ${styles.colSpan4} ${styles.aiBlock}`}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Bot size={20} color="var(--color-secondary)" /> AI Прогноз Рисков
                </div>
                <button onClick={fetchAiAnalysis} disabled={isAiLoading || cages.length === 0} style={{background: 'var(--color-secondary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: (isAiLoading || cages.length === 0) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: (isAiLoading || cages.length === 0) ? 0.7 : 1}}>
                  {isAiLoading ? 'Анализ...' : 'Получить'}
                </button>
              </div>
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
                    <p style={{color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center'}}>Нажмите "Получить", чтобы ИИ проанализировал текущее состояние фермы и показатели.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Модалка создания садка */}
      {isModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--color-bg-light)', padding: '30px', borderRadius: '16px', width: '400px', border: '1px solid var(--glass-border)'}}>
            <h3 style={{fontSize: '1.5rem', marginBottom: '20px', color: 'var(--color-text-main)'}}>Новый садок</h3>
            <form onSubmit={handleCreateCage}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-main)'}}>Название садка</label>
                <input required value={newCageName} onChange={e => setNewCageName(e.target.value)} type="text" style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--color-text-main)'}} placeholder="Например: Садок #1" />
              </div>
              <div style={{marginBottom: '24px'}}>
                <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-main)'}}>Вид рыбы</label>
                <select value={newFishType} onChange={e => setNewFishType(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--color-text-main)'}}>
                  <option value="Нерка">Нерка</option>
                  <option value="Форель">Форель</option>
                  <option value="Осетр">Осетр</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{padding: '10px 20px', borderRadius: '8px', color: 'var(--color-text-muted)', border: 'none', background: 'transparent', cursor: 'pointer'}}>Отмена</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{border: 'none', cursor: 'pointer'}}>
                  {isSubmitting ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка Подключения Датчика */}
      {isSensorModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--color-bg-light)', padding: '30px', borderRadius: '16px', width: '400px', border: '1px solid var(--glass-border)'}}>
            <h3 style={{fontSize: '1.5rem', marginBottom: '10px', color: 'var(--color-text-main)'}}>Подключение датчика</h3>
            <p style={{color: 'var(--color-text-muted)', marginBottom: '20px'}}>К садку: {activeCage?.name}</p>
            <form onSubmit={handleAddSensor}>
              <div style={{marginBottom: '24px'}}>
                <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-main)'}}>Тип датчика</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'O2', name: 'Кислород', icon: <Droplets size={24} /> },
                    { id: 'TEMP', name: 'Температура', icon: <Thermometer size={24} /> },
                    { id: 'PH', name: 'Уровень pH', icon: <Activity size={24} /> }
                  ].map(sensor => (
                    <div 
                      key={sensor.id}
                      onClick={() => setNewSensorType(sensor.id)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: '2px solid',
                        borderColor: newSensorType === sensor.id ? 'var(--color-secondary)' : 'transparent',
                        background: newSensorType === sensor.id ? 'rgba(52, 152, 219, 0.1)' : 'var(--glass-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textAlign: 'center',
                        color: newSensorType === sensor.id ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                        transition: 'all 0.2s ease',
                        boxShadow: newSensorType === sensor.id ? '0 4px 12px rgba(52, 152, 219, 0.2)' : 'inset 0 0 0 1px var(--glass-border)',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '28px', flexShrink: 0 }}>
                        {sensor.icon}
                      </div>
                      <span style={{fontSize: '0.75rem', fontWeight: newSensorType === sensor.id ? 'bold' : 'normal', lineHeight: '1.2', width: '100%', wordWrap: 'break-word'}}>{sensor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px'}}>
                <button type="button" onClick={() => setIsSensorModalOpen(false)} style={{padding: '10px 20px', borderRadius: '8px', color: 'var(--color-text-muted)', border: 'none', background: 'transparent', cursor: 'pointer'}}>Отмена</button>
                <button type="submit" className="btn-primary" disabled={isSensorSubmitting} style={{border: 'none', cursor: 'pointer'}}>
                  {isSensorSubmitting ? 'Подключение...' : 'Подключить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WebRTC Viewer Modal */}
      {isCameraModalOpen && activeCage && (
        <WebRTCViewer cageName={activeCage.name} onClose={() => setIsCameraModalOpen(false)} />
      )}

      {/* WebRTC Broadcaster Modal */}
      {isBroadcasterOpen && (
        <WebRTCBroadcaster onClose={() => setIsBroadcasterOpen(false)} />
      )}

      {/* Модалка Интеграции (Код) */}
      {isIntegrationModalOpen && createdSensor && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--color-bg-dark)', padding: '30px', borderRadius: '16px', width: '600px', border: '1px solid var(--color-accent)', boxShadow: '0 0 40px rgba(46, 204, 113, 0.2)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{fontSize: '1.5rem', margin: 0, color: 'var(--color-accent)'}}>Устройство зарегистрировано!</h3>
              <button onClick={() => setIsIntegrationModalOpen(false)} style={{background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
            </div>
            
            <p style={{color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5}}>
              Используйте эти учетные данные для настройки вашего физического микроконтроллера (ESP32 / Arduino / ПЛК). 
              <strong style={{color: 'var(--color-danger)'}}> Сохраните токен, он показывается только один раз!</strong>
            </p>

            <div style={{background: '#000', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333'}}>
              <div style={{marginBottom: '10px'}}>
                <span style={{color: '#888', display: 'inline-block', width: '80px'}}>Endpoint:</span> 
                <span style={{color: '#fff', fontFamily: 'monospace'}}>POST http://localhost:3000/api/sensors/webhook</span>
              </div>
              <div style={{marginBottom: '10px'}}>
                <span style={{color: '#888', display: 'inline-block', width: '80px'}}>Sensor ID:</span> 
                <span style={{color: '#fff', fontFamily: 'monospace'}}>{createdSensor.id}</span>
              </div>
              <div>
                <span style={{color: '#888', display: 'inline-block', width: '80px'}}>Token:</span> 
                <span style={{color: 'var(--color-danger)', fontFamily: 'monospace', fontWeight: 'bold'}}>{createdSensor.secretToken}</span>
              </div>
            </div>

            <h4 style={{color: '#fff', marginBottom: '10px'}}>Пример прошивки (C++ / ESP32)</h4>
            <div style={{background: '#1e1e1e', padding: '15px', borderRadius: '8px', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto', marginBottom: '24px'}}>
<pre style={{margin: 0}}>{`HTTPClient http;
http.begin("http://localhost:3000/api/sensors/webhook");
http.addHeader("Content-Type", "application/json");

String payload = "{\\"sensorId\\":\\"${createdSensor.id}\\",\\"token\\":\\"${createdSensor.secretToken}\\",\\"value\\":22.5}";

int httpResponseCode = http.POST(payload);
http.end();`}</pre>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button onClick={() => setIsIntegrationModalOpen(false)} className="btn-primary" style={{padding: '12px 24px', border: 'none', cursor: 'pointer'}}>Я сохранил данные</button>
            </div>
          </div>
        </div>
      )}
      {/* Mortality Task Modal */}
      {mortalityTask && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--glass-bg)', padding: '30px', borderRadius: '16px', width: '400px', border: '1px solid var(--glass-border)'}}>
            <h3 style={{fontSize: '1.5rem', marginBottom: '20px', color: 'var(--color-text-main)'}}>Завершение осмотра</h3>
            <p style={{marginBottom: '20px', color: 'var(--color-text-muted)'}}>Был ли обнаружен падеж (мертвая рыба) при осмотре садков?</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleMarkTask(mortalityTask.id, mortalityQty, mortalityReason);
            }}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)'}}>Количество погибшей рыбы (шт)</label>
                <input 
                  type="number" 
                  min="0"
                  value={mortalityQty} 
                  onChange={e => setMortalityQty(Number(e.target.value))} 
                  style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--color-text-main)'}}
                />
              </div>
              
              {mortalityQty > 0 && (
                <div style={{marginBottom: '24px'}}>
                  <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)'}}>Причина падежа (для ИИ аналитики)</label>
                  <input 
                    type="text" 
                    value={mortalityReason} 
                    onChange={e => setMortalityReason(e.target.value)} 
                    placeholder="Например: Инфекция жабр, Травмы, и т.д."
                    required={mortalityQty > 0}
                    style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--color-text-main)'}}
                  />
                </div>
              )}
              
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setMortalityTask(null)} style={{padding: '10px 20px', borderRadius: '8px', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', cursor: 'pointer'}}>Отмена</button>
                <button type="submit" disabled={isMarkingTask === mortalityTask.id} className="btn-primary" style={{border: 'none', cursor: 'pointer', opacity: isMarkingTask ? 0.7 : 1}}>
                  {isMarkingTask === mortalityTask.id ? 'Завершение...' : 'Подтвердить и Завершить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
