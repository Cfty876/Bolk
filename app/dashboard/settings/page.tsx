'use client'
import { useState, useEffect } from 'react'
import { Save, CheckCircle2, UserCircle, Bell, Bot, Brain, Leaf, Activity, Users, Trash2, Key, Shield, RefreshCw } from 'lucide-react'
import { getUserSettings, updateUserSettings, generateTmaToken, getTmaUsers, deleteTmaUser } from '../../actions'

export default function SettingsPage() {
  const [isSaving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Profile
  const [name, setName] = useState('')
  const [notifyO2, setNotifyO2] = useState(true)
  const [allowAiVideo, setAllowAiVideo] = useState(true)
  const [autoWeeklyReport, setAutoWeeklyReport] = useState(false)
  const [disableIntroVideo, setDisableIntroVideo] = useState(false)

  // Eco-Mission
  const [ecoTargetRelease, setEcoTargetRelease] = useState(50000)
  const [ecoReleasedCount, setEcoReleasedCount] = useState(0)
  const [isEcoPublic, setIsEcoPublic] = useState(false)
  const [userId, setUserId] = useState('')

  // IoT Thresholds
  const [minO2Threshold, setMinO2Threshold] = useState(6.0)
  const [minTempThreshold, setMinTempThreshold] = useState(8.0)
  const [maxTempThreshold, setMaxTempThreshold] = useState(15.0)

  // TMA Settings
  const [isTmaEnabled, setIsTmaEnabled] = useState(false)
  const [tmaAllowJournals, setTmaAllowJournals] = useState(true)
  const [tmaAllowCages, setTmaAllowCages] = useState(true)
  const [tmaAllowSchedule, setTmaAllowSchedule] = useState(true)
  const [tmaNotifications, setTmaNotifications] = useState(true)
  const [tmaToken, setTmaToken] = useState('')
  const [tmaUsers, setTmaUsers] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        if(Object.keys(data).length > 0 && data.user?.email) {
          setSession(data)
          const settings = await getUserSettings(data.user.email)
          if (settings) {
            setName(settings.name || '')
            setNotifyO2(settings.notifyO2 ?? true)
            setAllowAiVideo(settings.allowAiVideo ?? true)
            setAutoWeeklyReport(settings.autoWeeklyReport ?? false)
            
            setEcoTargetRelease(settings.ecoTargetRelease ?? 50000)
            setEcoReleasedCount(settings.ecoReleasedCount ?? 0)
            setIsEcoPublic(settings.isEcoPublic ?? false)
            setUserId(settings.id || '')
            setMinO2Threshold(settings.minO2Threshold ?? 6.0)
            setMinTempThreshold(settings.minTempThreshold ?? 8.0)
            setMaxTempThreshold(settings.maxTempThreshold ?? 15.0)
            setIsTmaEnabled(settings.isTmaEnabled ?? false)
            setTmaAllowJournals(settings.tmaAllowJournals ?? true)
            setTmaAllowCages(settings.tmaAllowCages ?? true)
            setTmaAllowSchedule(settings.tmaAllowSchedule ?? true)
            setTmaNotifications(settings.tmaNotifications ?? true)
            setTmaToken(settings.tmaToken || '')
          } else {
            setName(data.user.name || '')
          }
        }
        
        // Читаем локальную настройку видео
        setDisableIntroVideo(localStorage.getItem('disableIntroVideo') === 'true')
        
        const users = await getTmaUsers();
        setTmaUsers(users);

      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.email) return alert('Ошибка: нет email в сессии')
    
    setSaving(true)
    setSuccess(false)
    try {
      await updateUserSettings(session.user.email, {
        name,
        notifyO2,
        allowAiVideo,
        autoWeeklyReport,
        ecoTargetRelease: Number(ecoTargetRelease),
        ecoReleasedCount: Number(ecoReleasedCount),
        isEcoPublic,
        minO2Threshold: Number(minO2Threshold),
        minTempThreshold: Number(minTempThreshold),
        maxTempThreshold: Number(maxTempThreshold),
        isTmaEnabled,
        tmaAllowJournals,
        tmaAllowCages,
        tmaAllowSchedule,
        tmaNotifications
      })
      window.dispatchEvent(new Event('user-settings-updated'))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      alert('Ошибка при сохранении: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateToken = async () => {
    if (!session?.user?.email) return;
    try {
      const newToken = await generateTmaToken(session.user.email);
      setTmaToken(newToken);
    } catch(e) {
      alert('Ошибка при генерации токена');
    }
  }

  const handleDeleteTmaUser = async (id: string) => {
    if(confirm('Точно удалить доступ для этого устройства?')) {
      await deleteTmaUser(id);
      setTmaUsers(tmaUsers.filter(u => u.id !== id));
    }
  }

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)'}}>Загрузка настроек...</div>

  return (
    <div style={{maxWidth: '900px', margin: '0 auto', paddingBottom: '100px'}}>
      <h1 style={{fontSize:'2rem', fontWeight:800, color:'var(--color-text-main)', marginBottom:'24px'}}>Настройки системы</h1>

      <form onSubmit={handleSaveSettings} style={{display:'flex', flexDirection:'column', gap:'24px', marginBottom: '40px'}}>
        
        {/* PROFILE BLOCK */}
        <div className="card" style={{background:'var(--glass-bg, var(--color-card-bg))', padding:'32px', borderRadius:'20px', border:'1px solid var(--glass-border, var(--color-border))'}}>
          <h2 style={{fontSize:'1.3rem', fontWeight:800, color:'var(--color-primary)', marginBottom:'24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <UserCircle size={22} /> Профиль
          </h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'20px'}}>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Название хозяйства</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required
                style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} 
              />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Email аккаунта</label>
              <input 
                type="email" value={session?.user?.email || ''} disabled 
                style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-muted)', cursor: 'not-allowed', opacity: 0.7}} 
              />
            </div>
          </div>
          
          <label style={{display:'flex', alignItems:'flex-start', gap:'12px', cursor:'pointer', marginTop: '20px'}}>
            <input 
              type="checkbox" 
              checked={!disableIntroVideo} 
              onChange={e => {
                const disabled = !e.target.checked;
                setDisableIntroVideo(disabled);
                if (disabled) localStorage.setItem('disableIntroVideo', 'true');
                else localStorage.removeItem('disableIntroVideo');
              }} 
              style={{width:'20px', height:'20px'}} 
            />
            <div>
              <span style={{fontWeight:600, color:'var(--color-text-main)'}}>Показывать приветственное видео</span>
              <p style={{margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>Красивое видео при входе в личный кабинет.</p>
            </div>
          </label>
        </div>

        {/* ECO-MISSION BLOCK */}
        <div className="card" style={{background:'var(--glass-bg, var(--color-card-bg))', padding:'32px', borderRadius:'20px', border:'1px solid var(--glass-border, var(--color-border))'}}>
          <h2 style={{fontSize:'1.3rem', fontWeight:800, color:'var(--color-primary)', marginBottom:'24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Leaf size={22} /> Эко-Миссия
          </h2>
          
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px', marginBottom: '24px'}}>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Цель по выпуску в дикую природу (шт)</label>
              <input 
                type="number" value={ecoTargetRelease} onChange={e => setEcoTargetRelease(Number(e.target.value))} 
                style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} 
              />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Уже выпущено рыб (шт)</label>
              <input 
                type="number" value={ecoReleasedCount} onChange={e => setEcoReleasedCount(Number(e.target.value))} 
                style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} 
              />
            </div>
          </div>

          <label style={{display:'flex', alignItems:'flex-start', gap:'12px', cursor:'pointer', marginTop: '10px'}}>
            <input type="checkbox" checked={isEcoPublic} onChange={e => setIsEcoPublic(e.target.checked)} style={{width:'20px', height:'20px'}} />
            <div>
              <span style={{fontWeight:600, color:'var(--color-text-main)'}}>Публичный Эко-виджет</span>
              <p style={{margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>Сделать статистику выпуска публичной (генерация ссылки для сайта).</p>
            </div>
          </label>

          {isEcoPublic && userId && (
            <div style={{marginTop: '20px', padding: '20px', background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.3)', borderRadius: '16px'}}>
              <h4 style={{fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px'}}>Код для вставки на ваш сайт</h4>
              <p style={{fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px'}}>Скопируйте этот HTML-код и вставьте его на свой сайт, чтобы показать посетителям ваш вклад в экологию:</p>
              <div style={{position: 'relative'}}>
                <pre style={{background: 'var(--color-bg-dark)', padding: '16px', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--color-text-main)', overflowX: 'auto', border: '1px solid var(--color-border)'}}>
                  {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/${userId}" width="100%" height="220" style="border:none; border-radius:12px; overflow:hidden;" title="AquaVisio Eco Widget"></iframe>`}
                </pre>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(`<iframe src="${window.location.origin}/widget/${userId}" width="100%" height="220" style="border:none; border-radius:12px; overflow:hidden;" title="AquaVisio Eco Widget"></iframe>`);
                    alert('Код скопирован!');
                  }}
                  style={{position: 'absolute', top: '10px', right: '10px', background: 'var(--color-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer'}}
                >
                  Копировать
                </button>
              </div>
              <div style={{marginTop: '12px'}}>
                <a href={`/widget/${userId}`} target="_blank" style={{color: 'var(--color-primary)', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'}}>
                  <Leaf size={16} /> Предпросмотр виджета
                </a>
              </div>
            </div>
          )}
        </div>

        {/* IOT THRESHOLDS BLOCK */}
        <div className="card" style={{background:'var(--glass-bg, var(--color-card-bg))', padding:'32px', borderRadius:'20px', border:'1px solid var(--glass-border, var(--color-border))'}}>
          <h2 style={{fontSize:'1.3rem', fontWeight:800, color:'var(--color-primary)', marginBottom:'24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Activity size={22} /> Пороги датчиков (Тревоги)
          </h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Мин. Кислород (O2 мг/л)</label>
              <input 
                type="number" step="0.1" value={minO2Threshold} onChange={e => setMinO2Threshold(Number(e.target.value))} 
                style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid var(--color-danger)', background:'rgba(231,76,60,0.05)', color:'var(--color-text-main)'}} 
              />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Мин. Температура (°C)</label>
              <input 
                type="number" step="0.1" value={minTempThreshold} onChange={e => setMinTempThreshold(Number(e.target.value))} 
                style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid var(--color-secondary)', background:'rgba(52,152,219,0.05)', color:'var(--color-text-main)'}} 
              />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Макс. Температура (°C)</label>
              <input 
                type="number" step="0.1" value={maxTempThreshold} onChange={e => setMaxTempThreshold(Number(e.target.value))} 
                style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid var(--color-warning)', background:'rgba(241,196,15,0.05)', color:'var(--color-text-main)'}} 
              />
            </div>
          </div>
        </div>

        {/* Form will now wrap TMA management too */}

      {/* TEAM MANAGEMENT (TMA CONSTRUCTOR) */}
      <div className="card" style={{background:'var(--glass-bg, var(--color-card-bg))', padding:'32px', borderRadius:'20px', border:'1px solid var(--glass-border, var(--color-border))'}}>
        <h2 style={{fontSize:'1.5rem', fontWeight:800, color:'var(--color-text-main)', marginBottom:'8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
          <Bot size={24} /> Настройки Mini App (TMA)
          <span style={{fontSize: '0.8rem', background: 'linear-gradient(135deg, #FF6B6B, #C52026)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginLeft: 'auto'}}>Скоро в MAX</span>
        </h2>
        <p style={{color:'var(--color-text-muted)', marginBottom:'24px', lineHeight: 1.5}}>
          Управляйте доступом сотрудников к Telegram Mini App. Включите доступ и передайте сотрудникам единый токен. При входе через бота <a href="https://t.me/Bulcrusbot" target="_blank" rel="noopener noreferrer" style={{color: 'var(--color-primary)', textDecoration: 'underline'}}><b>@Bulcrusbot</b></a> они смогут зарегистрироваться под своими именами.
        </p>

        <div style={{marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--color-bg-light)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)'}}>
          <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer'}}>
            <div style={{position:'relative', width:'48px', height:'26px', borderRadius:'13px', background: isTmaEnabled ? 'var(--color-primary)' : 'var(--color-border)', transition:'background 0.3s'}}>
              <div style={{position:'absolute', top:'3px', left: isTmaEnabled ? '25px' : '3px', width:'20px', height:'20px', borderRadius:'10px', background:'#fff', transition:'left 0.3s'}}/>
            </div>
            <input type="checkbox" checked={isTmaEnabled} onChange={e => setIsTmaEnabled(e.target.checked)} style={{display:'none'}} />
            <div>
              <span style={{fontWeight:600, color:'var(--color-text-main)', fontSize: '1.1rem'}}>Включить доступ к Mini App</span>
            </div>
          </label>

          <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', marginTop: '16px'}}>
            <div style={{position:'relative', width:'48px', height:'26px', borderRadius:'13px', background: tmaNotifications ? 'var(--color-primary)' : 'var(--color-border)', transition:'background 0.3s'}}>
              <div style={{position:'absolute', top:'3px', left: tmaNotifications ? '25px' : '3px', width:'20px', height:'20px', borderRadius:'10px', background:'#fff', transition:'left 0.3s'}}/>
            </div>
            <input type="checkbox" checked={tmaNotifications} onChange={e => setTmaNotifications(e.target.checked)} style={{display:'none'}} />
            <div>
              <span style={{fontWeight:600, color:'var(--color-text-main)', fontSize: '1.1rem'}}>Отправлять уведомления (всем сотрудникам)</span>
            </div>
          </label>

            {isTmaEnabled && (
              <div style={{display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap'}}>
                <div style={{flex: 1, minWidth: '250px'}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Персональный Токен Доступа</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-bg-dark)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px 16px'}}>
                    <Key size={20} color="var(--color-accent)" />
                    <span style={{fontFamily: 'monospace', fontSize: '1.3rem', color: tmaToken ? 'var(--color-text-main)' : 'var(--color-text-muted)', letterSpacing: '2px', fontWeight: 700}}>
                      {tmaToken || 'НЕ СГЕНЕРИРОВАН'}
                    </span>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: '28px'}}>
                  <button type="button" onClick={handleGenerateToken} className="btn-outline" style={{padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px'}}>
                    <RefreshCw size={18} /> {tmaToken ? 'Сбросить и сгенерировать новый' : 'Сгенерировать токен'}
                  </button>
                </div>
              </div>
            )}

            {isTmaEnabled && (
              <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)'}}>
                <h4 style={{fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '16px'}}>Доступные разделы в Mini App:</h4>
                <div style={{display: 'flex', gap: '24px', flexWrap: 'wrap'}}>
                  <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer'}}>
                    <input type="checkbox" checked={tmaAllowCages} onChange={e => setTmaAllowCages(e.target.checked)} style={{width: '20px', height: '20px', accentColor: 'var(--color-secondary)'}} />
                    <span style={{color: 'var(--color-text-main)'}}>Садки</span>
                  </label>
                  <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer'}}>
                    <input type="checkbox" checked={tmaAllowJournals} onChange={e => setTmaAllowJournals(e.target.checked)} style={{width: '20px', height: '20px', accentColor: 'var(--color-secondary)'}} />
                    <span style={{color: 'var(--color-text-main)'}}>Журналы</span>
                  </label>
                  <label style={{display:'flex', alignItems:'center', gap:'12px', cursor:'pointer'}}>
                    <input type="checkbox" checked={tmaAllowSchedule} onChange={e => setTmaAllowSchedule(e.target.checked)} style={{width: '20px', height: '20px', accentColor: 'var(--color-secondary)'}} />
                    <span style={{color: 'var(--color-text-main)'}}>План / Расписание</span>
                  </label>
                </div>
              </div>
            )}
          </div>

        {/* Connected Users List */}
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          <h3 style={{fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px'}}>Подключенные устройства</h3>
          {tmaUsers.length === 0 && <div style={{color:'var(--color-text-muted)', fontStyle:'italic'}}>Нет подключенных сотрудников.</div>}
          
          {tmaUsers.map(emp => (
            <div key={emp.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--color-bg-light)', border:'1px solid var(--color-border)', borderRadius:'12px', padding:'16px 20px'}}>
              <div>
                <h3 style={{margin:'0 0 4px 0', color:'var(--color-text-main)', fontSize:'1.1rem'}}>{emp.name}</h3>
                <div style={{display:'inline-flex', alignItems:'center', gap:'8px', fontSize:'0.9rem', color:'var(--color-text-muted)'}}>
                  <Shield size={14} color="var(--color-success)" /> Telegram ID: {emp.telegramId}
                </div>
              </div>
              <button onClick={() => handleDeleteTmaUser(emp.id)} style={{background:'rgba(231,76,60,0.1)', color:'var(--color-danger)', border:'none', padding:'10px', borderRadius:'10px', cursor:'pointer', transition: 'background 0.2s'}} title="Отключить доступ">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

      </div>
      
      {/* SAVE BUTTON (Moved to bottom) */}
      <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '32px'}}>
        <button type="submit" disabled={isSaving} className={isSaving ? "btn-outline" : "btn-primary"} style={{padding:'14px 32px', fontSize:'1.05rem', display:'flex', alignItems:'center', gap:'10px', borderRadius: '12px', fontWeight: 700}}>
          {isSaving ? 'Сохранение...' : success ? <><CheckCircle2 size={20}/> Сохранено!</> : <><Save size={20}/> Сохранить настройки</>}
        </button>
      </div>

      </form>

    </div>
  )
}
