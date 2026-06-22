'use client'
import { useState, useEffect } from 'react'
import { RadioReceiver, Battery, Wifi, AlertTriangle, RefreshCw, Info } from 'lucide-react'
import { getSensors, getCages, addSensor } from '../../actions'

export default function SensorsPage() {
  const [isRefreshing, setRefreshing] = useState(false)
  const [sensors, setSensors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSensor, setSelectedSensor] = useState<any>(null)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [cages, setCages] = useState<any[]>([])

  // Modal states for adding sensor
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false)
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false)
  const [activeCageId, setActiveCageId] = useState<string>('')
  const [newSensorType, setNewSensorType] = useState('O2')
  const [isSensorSubmitting, setIsSensorSubmitting] = useState(false)
  const [createdSensor, setCreatedSensor] = useState<any>(null)

  const loadSensors = async () => {
    try {
      const [sensorsData, cagesData] = await Promise.all([getSensors(), getCages()])
      setSensors(sensorsData)
      setCages(cagesData)
      if (cagesData.length > 0) setActiveCageId(cagesData[0].id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSensors()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSensors()
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleAddSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCageId) return;
    setIsSensorSubmitting(true);
    const sensor = await addSensor(activeCageId, newSensorType);
    setIsSensorModalOpen(false);
    setIsSensorSubmitting(false);
    setCreatedSensor(sensor);
    setIsIntegrationModalOpen(true);
    await loadSensors();
  };

  const getTypeLabel = (type: string) => {
    if (type === 'O2') return 'Датчик Кислорода (O2)'
    if (type === 'TEMP') return 'Датчик Температуры'
    if (type === 'PH') return 'Датчик pH'
    return 'Неизвестный датчик'
  }

  const getTypeValue = (type: string, value: number) => {
    if (type === 'O2') return `${value.toFixed(1)} мг/л`
    if (type === 'TEMP') return `${value.toFixed(1)} °C`
    if (type === 'PH') return value.toFixed(1)
    return value.toString()
  }

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)'}}>Загрузка датчиков...</div>

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap: 'wrap', gap: '15px'}}>
        <h1 style={{fontSize:'2rem', fontWeight:800, color:'var(--color-text-main)'}}>IoT Датчики</h1>
        <div style={{display:'flex', gap:'12px'}}>
          <button onClick={() => setIsSensorModalOpen(true)} className="btn-primary" style={{display:'flex', gap:'8px', alignItems:'center'}}>
            + Подключить датчик
          </button>
          <button onClick={handleRefresh} disabled={isRefreshing} className="btn-outline" style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} /> {isRefreshing ? 'Опрос...' : 'Опросить датчики'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {sensors.length === 0 ? (
        <div style={{textAlign:'center', padding:'80px 20px', background:'var(--color-card-bg)', borderRadius:'16px', border: '1px solid var(--color-border)'}}>
          <RadioReceiver size={64} color="var(--color-secondary)" style={{marginBottom:'20px', opacity: 0.5}} />
          <h2 style={{fontSize: '1.5rem', marginBottom: '10px'}}>У вас пока не подключено ни одного датчика</h2>
          <p style={{color:'var(--color-text-muted)', marginBottom: '24px'}}>Перейдите в раздел "Садки" или на Главную панель, чтобы подключить новое IoT-устройство к вашему садку.</p>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
          {sensors.map(sensor => {
            const hasData = sensor.lastSeen != null;
            const isOnline = hasData && (new Date().getTime() - new Date(sensor.lastSeen).getTime() < 60000); // Онлайн если данные были в последнюю минуту
            
            return (
            <div key={sensor.id} style={{background:'var(--color-card-bg)', padding:'24px', borderRadius:'16px', border: `1px solid ${hasData ? (isOnline ? 'var(--color-border)' : 'var(--color-danger)') : 'var(--color-border)'}`, boxShadow:'0 4px 12px rgba(0,0,0,0.02)'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
                <h3 style={{fontSize:'1.1rem', fontWeight:700, color: hasData ? 'var(--color-text-main)' : 'var(--color-text-muted)', display:'flex', alignItems:'center', gap:'8px'}}>
                  <RadioReceiver size={20} color={hasData ? "var(--color-secondary)" : "var(--color-text-muted)"}/> {getTypeLabel(sensor.type)}
                </h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <button onClick={() => { setSelectedSensor(sensor); setIsInfoModalOpen(true); }} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, display: 'flex'}}>
                    <Info size={20} />
                  </button>
                  <Wifi size={20} color={hasData ? (isOnline ? "#2ECC71" : "#E74C3C") : "var(--color-text-muted)"} />
                </div>
              </div>
              
              <p style={{color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '10px'}}>
                Подключен к: <strong>{sensor.cage?.name || 'Неизвестный садок'}</strong>
              </p>

              <div style={{fontSize:'2rem', fontWeight:800, color: hasData ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom:'16px'}}>
                {hasData ? getTypeValue(sensor.type, sensor.value) : '—'}
              </div>

              <div style={{display:'flex', justifyContent:'space-between', color:'var(--color-text-muted)', fontSize:'0.9rem', padding:'12px 0 0 0', borderTop:'1px solid var(--color-border)'}}>
                <span style={{display:'flex', alignItems:'center', gap:'6px'}}>
                  <Battery size={16} color="var(--color-text-muted)"/> 
                  Заряд: {hasData ? '100%' : '—'}
                </span>
                <span style={{color: hasData ? (isOnline ? '#2ECC71' : '#E74C3C') : 'var(--color-text-muted)', fontWeight:600}}>
                  {hasData ? (isOnline ? 'ONLINE' : 'OFFLINE') : 'ОЖИДАЕТ ДАННЫХ'}
                </span>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Модалка Интеграции (Код) */}
      {isInfoModalOpen && selectedSensor && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--color-bg-dark)', padding: '30px', borderRadius: '16px', width: '600px', border: '1px solid var(--color-border)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{fontSize: '1.5rem', margin: 0, color: 'var(--color-text-main)'}}>Информация об устройстве</h3>
              <button onClick={() => setIsInfoModalOpen(false)} style={{background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
            </div>
            
            <p style={{color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5}}>
              Данные для подключения микроконтроллера (ESP32 / Arduino). 
              Подключен к садку: <strong>{selectedSensor.cage?.name || 'Неизвестный'}</strong>.
            </p>

            <div style={{background: '#000', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333'}}>
              <div style={{marginBottom: '10px'}}>
                <span style={{color: '#888', display: 'inline-block', width: '80px'}}>Endpoint:</span> 
                <span style={{color: '#fff', fontFamily: 'monospace'}}>POST http://localhost:3000/api/sensors/webhook</span>
              </div>
              <div style={{marginBottom: '10px'}}>
                <span style={{color: '#888', display: 'inline-block', width: '80px'}}>Sensor ID:</span> 
                <span style={{color: '#fff', fontFamily: 'monospace'}}>{selectedSensor.id}</span>
              </div>
              <div>
                <span style={{color: '#888', display: 'inline-block', width: '80px'}}>Token:</span> 
                <span style={{color: 'var(--color-danger)', fontFamily: 'monospace', fontWeight: 'bold'}}>{selectedSensor.secretToken}</span>
              </div>
            </div>

            <h4 style={{color: '#fff', marginBottom: '10px'}}>Пример прошивки (C++ / ESP32)</h4>
            <div style={{background: '#1e1e1e', padding: '15px', borderRadius: '8px', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto', marginBottom: '24px'}}>
<pre style={{margin: 0}}>{`HTTPClient http;
http.begin("http://localhost:3000/api/sensors/webhook");
http.addHeader("Content-Type", "application/json");

String payload = "{\\"sensorId\\":\\"${selectedSensor.id}\\",\\"token\\":\\"${selectedSensor.secretToken}\\",\\"value\\":22.5}";

int httpResponseCode = http.POST(payload);
http.end();`}</pre>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
              <button onClick={() => setIsInfoModalOpen(false)} className="btn-primary" style={{padding: '12px 24px', border: 'none', cursor: 'pointer'}}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка Подключения Датчика */}
      {isSensorModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--color-card-bg)', padding: '30px', borderRadius: '16px', width: '400px', border: '1px solid var(--color-border)'}}>
            <h3 style={{fontSize: '1.5rem', marginBottom: '20px', color: 'var(--color-text-main)'}}>Подключение датчика</h3>
            <form onSubmit={handleAddSensor}>
              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)'}}>Выберите садок</label>
                <select required value={activeCageId} onChange={e => setActiveCageId(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-light)', color: 'var(--color-text-main)'}}>
                  {cages.length === 0 && <option value="">Сначала создайте садок</option>}
                  {cages.map(c => <option key={c.id} value={c.id}>{c.name} ({c.fishType})</option>)}
                </select>
              </div>
              <div style={{marginBottom: '24px'}}>
                <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)'}}>Тип датчика</label>
                <select value={newSensorType} onChange={e => setNewSensorType(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-light)', color: 'var(--color-text-main)'}}>
                  <option value="O2">Кислород (O2)</option>
                  <option value="TEMP">Температура</option>
                  <option value="PH">Уровень pH</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px'}}>
                <button type="button" onClick={() => setIsSensorModalOpen(false)} style={{padding: '10px 20px', borderRadius: '8px', color: 'var(--color-text-muted)', border: 'none', background: 'transparent', cursor: 'pointer'}}>Отмена</button>
                <button type="submit" className="btn-primary" disabled={isSensorSubmitting || cages.length === 0} style={{border: 'none', cursor: 'pointer', opacity: (isSensorSubmitting || cages.length === 0) ? 0.5 : 1}}>
                  {isSensorSubmitting ? 'Подключение...' : 'Подключить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка Интеграции (Код) */}
      {isIntegrationModalOpen && createdSensor && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--color-bg-dark)', padding: '30px', borderRadius: '16px', width: '600px', border: '1px solid #2ECC71', boxShadow: '0 0 40px rgba(46, 204, 113, 0.2)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{fontSize: '1.5rem', margin: 0, color: '#2ECC71'}}>Устройство зарегистрировано!</h3>
              <button onClick={() => setIsIntegrationModalOpen(false)} style={{background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
            </div>
            
            <p style={{color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5}}>
              Используйте эти данные для прошивки вашего физического микроконтроллера (ESP32 / Arduino). 
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
              <button onClick={() => setIsIntegrationModalOpen(false)} className="btn-primary" style={{padding: '12px 24px', border: 'none', cursor: 'pointer'}}>Я сохранил код</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
