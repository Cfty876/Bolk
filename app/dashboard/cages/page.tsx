'use client'
import { useState, useEffect } from 'react'
import { getCages, createCage, deleteCage } from '../../actions'
import { Plus, Activity, LayoutGrid, Droplets, Trash2 } from 'lucide-react'

export default function CagesPage() {
  const [cages, setCages] = useState<any[]>([])
  const [isModalOpen, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [analyticsCage, setAnalyticsCage] = useState<any>(null)
  
  // form
  const [name, setName] = useState('')
  const [fishType, setFishType] = useState('Нерка')

  const load = async () => {
    try {
      const data = await getCages()
      setCages(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await createCage(name, fishType)
    setModal(false)
    setName('')
    load()
  }

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)'}}>Загрузка данных...</div>

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'24px'}}>
        <h1 style={{fontSize:'2rem', fontWeight:800, color:'var(--color-text-main)'}}>Мои Садки / УЗВ</h1>
        <button onClick={() => setModal(true)} className="btn-primary" style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <Plus size={18}/> Добавить
        </button>
      </div>

      {cages.length === 0 ? (
        <div style={{textAlign:'center', padding:'80px 20px', background:'var(--color-card-bg)', borderRadius:'16px', border: '1px solid var(--color-border)'}}>
          <Droplets size={64} color="var(--color-secondary)" style={{marginBottom:'20px', opacity: 0.5}} />
          <h2 style={{fontSize: '1.5rem', marginBottom: '10px'}}>У вас пока нет садков</h2>
          <p style={{color:'var(--color-text-muted)'}}>Добавьте первый садок или бассейн УЗВ, чтобы начать мониторинг и зарыбление.</p>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'24px'}}>
          {cages.map(cage => {
            const statusText = cage.status === 'GOOD' ? 'В норме' : cage.status === 'WARNING' ? 'Внимание' : cage.status === 'CRITICAL' ? 'Критично' : cage.status;
            const statusColor = cage.status === 'WARNING' ? '#F39C12' : cage.status === 'CRITICAL' ? '#E74C3C' : '#2ECC71';
            const statusBg = cage.status === 'WARNING' ? 'rgba(243, 156, 18, 0.1)' : cage.status === 'CRITICAL' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)';
            
            return (
            <div key={cage.id} style={{
                background:'var(--glass-bg, var(--color-card-bg))', 
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                padding:'24px', 
                borderRadius:'20px', 
                border:'1px solid var(--glass-border, var(--color-border))', 
                boxShadow:'0 10px 30px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Decorative background element */}
                <div style={{position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: statusBg, borderRadius: '50%', filter: 'blur(30px)', opacity: 0.6, pointerEvents: 'none'}}></div>

              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems: 'flex-start', gap: '10px', position: 'relative', zIndex: 2}}>
                <h3 style={{fontSize:'1.3rem', fontWeight:800, color:'var(--color-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1}} title={cage.name}>
                    {cage.name}
                </h3>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0}}>
                  <span style={{padding:'4px 10px', background: statusBg, color: statusColor, borderRadius:'12px', fontSize:'0.8rem', fontWeight:600, border: `1px solid ${statusColor}40`}}>
                    {statusText}
                  </span>
                  <button onClick={async () => { if(confirm('Удалить садок и все его данные?')) { await deleteCage(cage.id); load(); } }} style={{background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.2)', color: 'var(--color-danger)', cursor: 'pointer', padding: '6px', display: 'flex', borderRadius: '8px', transition: 'background 0.2s'}} title="Удалить садок">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:'12px', color:'var(--color-text-main)', fontSize:'0.95rem', marginBottom:'24px', position: 'relative', zIndex: 2}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', background: 'var(--color-bg-light)', padding: '10px 12px', borderRadius: '12px'}}>
                  <LayoutGrid size={18} color="var(--color-secondary)"/> 
                  <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={cage.fishType}>{cage.fishType}</span>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'8px', background: 'var(--color-bg-light)', padding: '10px 12px', borderRadius: '12px'}}>
                  <Activity size={18} color="var(--color-secondary)"/> 
                  <span>Партий: {cage.fishes?.length || 0}</span>
                </div>
              </div>
              
              <div style={{marginTop: 'auto', position: 'relative', zIndex: 2}}>
                <button onClick={() => setAnalyticsCage(cage)} className="btn-outline" style={{width:'100%', padding:'12px', borderRadius:'12px', fontWeight:600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}}>
                    <Activity size={18} /> Данные садка
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <div style={{background:'var(--color-card-bg)', padding:'32px', borderRadius:'20px', width:'400px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginBottom:'24px', color:'var(--color-text-main)'}}>Добавление садка</h2>
            <form onSubmit={handleAdd}>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Название или номер</label>
                <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Например, Бассейн А-1" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
              </div>
              <div style={{marginBottom:'32px'}}>
                <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Вид рыбы</label>
                <select value={fishType} onChange={e=>setFishType(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                  <option>Нерка</option>
                  <option>Форель</option>
                  <option>Осетр</option>
                </select>
              </div>
              <div style={{display:'flex', gap:'12px'}}>
                <button type="button" onClick={()=>setModal(false)} style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'transparent', color:'var(--color-text-main)', cursor:'pointer', fontWeight:600}}>Отмена</button>
                <button type="submit" className="btn-primary" style={{flex:1, padding:'12px', borderRadius:'10px'}}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* АНАЛИТИКА САДКА (ФАКТИЧЕСКИЕ ДАННЫЕ) */}
      {analyticsCage && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'var(--color-overlay, rgba(0,0,0,0.5))', backdropFilter: 'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200}}>
          <div style={{background:'var(--color-card-bg)', padding:'32px', borderRadius:'24px', width:'800px', maxWidth:'90vw', maxHeight:'90vh', overflowY:'auto', border:'1px solid var(--color-border)', boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
              <div>
                <h2 style={{margin:0, fontSize:'2rem', color:'var(--color-text-main)'}}>Сводка: {analyticsCage.name}</h2>
                <p style={{margin:'8px 0 0 0', color:'var(--color-text-muted)'}}>Тип водоема: {analyticsCage.fishType}</p>
              </div>
              <button onClick={() => setAnalyticsCage(null)} style={{background:'none', border:'none', color:'var(--color-text-muted)', fontSize:'2rem', cursor:'pointer', lineHeight:1}}>&times;</button>
            </div>

            {/* ТАБЛИЦА: ПАРТИИ РЫБ */}
            <h3 style={{fontSize:'1.2rem', color:'var(--color-primary)', borderBottom:'1px solid var(--color-border)', paddingBottom:'10px', marginBottom:'16px'}}>Партии рыб (Биомасса)</h3>
            {analyticsCage.fishes && analyticsCage.fishes.length > 0 ? (
              <table style={{width:'100%', borderCollapse:'collapse', marginBottom:'32px', textAlign:'left'}}>
                <thead style={{background:'var(--color-bg-light)', color:'var(--color-text-muted)'}}>
                  <tr>
                    <th style={{padding:'12px'}}>Вид</th>
                    <th style={{padding:'12px'}}>Статус</th>
                    <th style={{padding:'12px'}}>Кол-во (шт)</th>
                    <th style={{padding:'12px'}}>Ср. Вес (г)</th>
                    <th style={{padding:'12px'}}>Итого Биомасса (т)</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsCage.fishes.map((f: any) => (
                    <tr key={f.id} style={{borderBottom:'1px solid var(--color-border)'}}>
                      <td style={{padding:'12px', color:'var(--color-text-main)'}}>{f.species}</td>
                      <td style={{padding:'12px', color:'var(--color-text-muted)'}}>{f.status === 'GROWING' ? 'Выращивание' : 'Выпущена'}</td>
                      <td style={{padding:'12px', color:'var(--color-text-main)'}}>{f.quantity.toLocaleString()}</td>
                      <td style={{padding:'12px', color:'var(--color-text-main)'}}>{f.avgWeight}</td>
                      <td style={{padding:'12px', color:'var(--color-text-main)', fontWeight:600}}>{((f.quantity * f.avgWeight) / 1000000).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{color:'var(--color-text-muted)', marginBottom:'32px'}}>В этом садке пока нет рыб.</p>
            )}

            {/* ТАБЛИЦА: ПОКАЗАТЕЛИ ДАТЧИКОВ */}
            <h3 style={{fontSize:'1.2rem', color:'var(--color-secondary)', borderBottom:'1px solid var(--color-border)', paddingBottom:'10px', marginBottom:'16px'}}>Датчики (IoT)</h3>
            {analyticsCage.sensors && analyticsCage.sensors.length > 0 ? (
              <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
                <thead style={{background:'var(--color-bg-light)', color:'var(--color-text-muted)'}}>
                  <tr>
                    <th style={{padding:'12px'}}>Тип датчика</th>
                    <th style={{padding:'12px'}}>Текущее значение</th>
                    <th style={{padding:'12px'}}>Статус связи</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsCage.sensors.map((s: any) => {
                    const hasData = s.telemetry && s.telemetry.length > 0;
                    const lastVal = hasData ? s.telemetry[0].value.toFixed(2) : '—';
                    return (
                      <tr key={s.id} style={{borderBottom:'1px solid var(--color-border)'}}>
                        <td style={{padding:'12px', color:'var(--color-text-main)'}}>
                          {s.type === 'O2' ? 'Кислород (O2)' : s.type === 'TEMP' ? 'Температура' : 'pH'}
                        </td>
                        <td style={{padding:'12px', color:'var(--color-text-main)', fontSize:'1.1rem', fontWeight:600}}>
                          {lastVal}
                        </td>
                        <td style={{padding:'12px', color: hasData ? '#2ECC71' : 'var(--color-text-muted)'}}>
                          {hasData ? 'Активен' : 'Нет данных'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{color:'var(--color-text-muted)'}}>К этому садку не привязано ни одного датчика.</p>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
