'use client'
import { useState, useEffect } from 'react'
import { getJournalEntries, getCages, createJournalEntry, createTaskSchedule, deleteJournalEntry } from '../../actions'
import { Plus, BookOpen, Syringe, Eye, Fish, CalendarClock, Trash2, CalendarDays, Download } from 'lucide-react'
import Link from 'next/link'

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [cages, setCages] = useState<any[]>([])
  const [isModalOpen, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [cageId, setCageId] = useState('')
  const [type, setType] = useState('INSPECTION')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [foodType, setFoodType] = useState('Пеллетсы форелевые 6мм')
  const [amountKg, setAmountKg] = useState('')
  const [mortalityQty, setMortalityQty] = useState('')

  // Schedule state
  const [isScheduleModalOpen, setScheduleModal] = useState(false)
  const [schedCageId, setSchedCageId] = useState('')
  const [schedType, setSchedType] = useState('FEEDING')
  const [schedFreq, setSchedFreq] = useState('DAILY')
  const [schedTime, setSchedTime] = useState('08:00')
  
  const [schedDate, setSchedDate] = useState('')
  const [schedDayOfWeek, setSchedDayOfWeek] = useState('1')
  
  const [schedTitle, setSchedTitle] = useState('')
  const [schedDesc, setSchedDesc] = useState('')
  const [schedFoodType, setSchedFoodType] = useState('Пеллетсы форелевые 6мм')
  const [schedAmountKg, setSchedAmountKg] = useState('10')

  const load = async () => {
    try {
      const eData = await getJournalEntries()
      const cData = await getCages()
      setEntries(eData)
      setCages(cData)
      if (cData.length > 0 && !cageId) {
        setCageId(cData[0].id)
        setSchedCageId(cData[0].id)
      }
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
    await createJournalEntry(
      cageId || null, type, title, description,
      type === 'FEEDING' ? foodType : undefined,
      type === 'FEEDING' && amountKg ? parseFloat(amountKg) : undefined,
      mortalityQty ? parseInt(mortalityQty) : undefined
    )
    setModal(false)
    setTitle('')
    setDescription('')
    setAmountKg('')
    setMortalityQty('')
    load()
  }

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const dayOfWeek = schedFreq === 'WEEKLY' ? parseInt(schedDayOfWeek) : null
    const date = schedFreq === 'ONCE' ? schedDate : null
    
    await createTaskSchedule(
      schedCageId, schedType, schedFreq, schedTime,
      date, dayOfWeek,
      schedTitle, schedDesc, schedFoodType, parseFloat(schedAmountKg)
    )
    setScheduleModal(false)
    load()
    alert('✅ Расписание успешно создано!\n\nКарточка появилась на главной странице (Дашборд).')
  }

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Вы уверены, что хотите безвозвратно удалить эту запись из журнала?')) {
      setLoading(true)
      await deleteJournalEntry(id)
      load()
    }
  }

  const getTypeIcon = (t: string) => {
    switch(t) {
      case 'FEEDING': return <Fish size={20} color="#3498db" />
      case 'VET': return <Syringe size={20} color="#e74c3c" />
      default: return <Eye size={20} color="#2ecc71" />
    }
  }

  const getTypeName = (t: string) => {
    switch(t) {
      case 'FEEDING': return 'Кормление'
      case 'VET': return 'Ветеринария'
      default: return 'Осмотр'
    }
  }

  const todayDateStr = new Date().toISOString().split('T')[0];
  const endOfYearStr = `${new Date().getFullYear()}-12-31`;

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)'}}>Загрузка данных...</div>

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap: 'wrap', gap: '10px'}}>
        <h1 style={{fontSize:'2rem', fontWeight:800, color:'var(--color-text-main)'}}>Журнал событий</h1>
        <div className="hide-on-print" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <button onClick={() => window.print()} className="btn-outline" style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <Download size={18}/> Скачать PDF
          </button>
          <Link href="/dashboard/calendar" className="btn-outline" style={{display:'flex', gap:'8px', alignItems:'center', textDecoration: 'none'}}>
            <CalendarDays size={18}/> Открыть календарь
          </Link>
          <button onClick={() => setScheduleModal(true)} className="btn-outline" style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <CalendarClock size={18}/> Запланировать задачу
          </button>
          <button onClick={() => setModal(true)} className="btn-primary" style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <Plus size={18}/> Добавить запись
          </button>
        </div>
      </div>

      <div style={{background:'var(--color-card-bg)', borderRadius:'16px', border:'1px solid var(--color-border)', overflow:'hidden', padding:'20px'}}>
        {entries.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px 20px'}}>
            <BookOpen size={48} color="var(--color-text-muted)" style={{marginBottom:'16px', opacity: 0.5}} />
            <h3 style={{fontSize:'1.2rem', color:'var(--color-text-main)', marginBottom:'8px'}}>Журнал пуст</h3>
            <p style={{color:'var(--color-text-muted)'}}>События, кормления и ветеринарные мероприятия будут отображаться здесь.</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            {entries.map(entry => (
              <div key={entry.id} style={{display:'flex', gap:'20px', padding:'20px', background:'var(--color-bg-light)', borderRadius:'12px', borderLeft:`4px solid ${entry.type === 'VET' ? '#e74c3c' : entry.type === 'FEEDING' ? '#3498db' : '#2ecc71'}`}}>
                <div style={{width:'48px', height:'48px', borderRadius:'12px', background:'var(--color-card-bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  {getTypeIcon(entry.type)}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                    <h4 style={{fontSize:'1.1rem', fontWeight:700, color:'var(--color-text-main)'}}>{entry.title}</h4>
                    <span style={{fontSize:'0.9rem', color:'var(--color-text-muted)'}}>{new Date(entry.createdAt).toLocaleString('ru-RU')}</span>
                  </div>
                  <div style={{fontSize:'0.9rem', color:'var(--color-secondary)', fontWeight:600, marginBottom:'8px'}}>
                    {getTypeName(entry.type)} {entry.cage ? `• ${entry.cage.name}` : ''}
                  </div>
                  <p style={{color:'var(--color-text-muted)', lineHeight:1.5}}>{entry.description}</p>
                </div>
                <div style={{flexShrink: 0}}>
                  <button 
                    onClick={() => handleDeleteEntry(entry.id)} 
                    className="hide-on-print"
                    style={{background:'transparent', border:'none', color:'var(--color-danger)', cursor:'pointer', padding:'8px'}}
                    title="Удалить запись"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <div style={{background:'var(--color-card-bg)', padding:'32px', borderRadius:'20px', width:'500px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginBottom:'24px', color:'var(--color-text-main)'}}>Новая запись</h2>
            
            <form onSubmit={handleAdd}>
              <div style={{display:'flex', gap:'16px', marginBottom:'16px'}}>
                <div style={{flex:1}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Тип события</label>
                  <select value={type} onChange={e=>setType(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    <option value="INSPECTION">Осмотр</option>
                    <option value="FEEDING">Кормление</option>
                    <option value="VET">Ветеринария</option>
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Садок (Опционально)</label>
                  <select value={cageId} onChange={e=>setCageId(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    <option value="">Все садки</option>
                    {cages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {type === 'FEEDING' ? (
                <>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Тип корма</label>
                    <input required value={foodType} onChange={e=>setFoodType(e.target.value)} placeholder="Например: Пеллетсы форелевые 6мм" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Объем (кг)</label>
                    <input type="number" step="0.1" required value={amountKg} onChange={e=>setAmountKg(e.target.value)} placeholder="Например: 15.5" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                  <div style={{marginBottom:'32px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Комментарий (Опционально)</label>
                    <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Дополнительная информация..." style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)', resize:'vertical'}} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Заголовок</label>
                    <input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Например: Плановый осмотр, выдача корма..." style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Описание и результаты</label>
                    <textarea required value={description} onChange={e=>setDescription(e.target.value)} rows={4} placeholder="Подробности события..." style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)', resize:'vertical'}} />
                  </div>
                  <div style={{marginBottom:'32px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Падеж (шт) - Опционально</label>
                    <input type="number" value={mortalityQty} onChange={e=>setMortalityQty(e.target.value)} placeholder="Если обнаружена мертвая рыба..." style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                </>
              )}

              <div style={{display:'flex', gap:'12px'}}>
                <button type="button" onClick={()=>setModal(false)} style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'transparent', color:'var(--color-text-main)', cursor:'pointer', fontWeight:600}}>Отмена</button>
                <button type="submit" className="btn-primary" style={{flex:1, padding:'12px', borderRadius:'10px'}}>Сохранить запись</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <div style={{background:'var(--color-card-bg)', padding:'32px', borderRadius:'20px', width:'600px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginBottom:'24px', color:'var(--color-text-main)'}}>Новая задача / расписание</h2>
            
            <form onSubmit={handleAddSchedule}>
              <div style={{display:'flex', gap:'16px', marginBottom:'16px'}}>
                <div style={{flex:1}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Тип задачи</label>
                  <select required value={schedType} onChange={e=>setSchedType(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    <option value="FEEDING">Кормление</option>
                    <option value="INSPECTION">Осмотр</option>
                    <option value="VET">Визит ветеринара</option>
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Садок</label>
                  <select required value={schedCageId} onChange={e=>setSchedCageId(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    {cages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{display:'flex', gap:'16px', marginBottom:'16px'}}>
                <div style={{flex:1}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Частота</label>
                  <select required value={schedFreq} onChange={e=>setSchedFreq(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    <option value="DAILY">Ежедневно</option>
                    <option value="WEEKLY">Еженедельно</option>
                    <option value="ONCE">Единоразово</option>
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Время</label>
                  <input type="time" required value={schedTime} onChange={e=>setSchedTime(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                </div>
              </div>

              {schedFreq === 'WEEKLY' && (
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>День недели</label>
                  <select required value={schedDayOfWeek} onChange={e=>setSchedDayOfWeek(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    <option value="1">Понедельник</option>
                    <option value="2">Вторник</option>
                    <option value="3">Среда</option>
                    <option value="4">Четверг</option>
                    <option value="5">Пятница</option>
                    <option value="6">Суббота</option>
                    <option value="0">Воскресенье</option>
                  </select>
                </div>
              )}

              {schedFreq === 'ONCE' && (
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Дата</label>
                  <input type="date" required min={todayDateStr} max={endOfYearStr} value={schedDate} onChange={e=>setSchedDate(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                </div>
              )}

              {schedType === 'FEEDING' ? (
                <>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Тип корма</label>
                    <input required value={schedFoodType} onChange={e=>setSchedFoodType(e.target.value)} placeholder="Например: Пеллетсы форелевые 6мм" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                  <div style={{marginBottom:'32px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Объем на кормление (кг)</label>
                    <input type="number" step="0.1" required value={schedAmountKg} onChange={e=>setSchedAmountKg(e.target.value)} placeholder="Например: 15.5" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Название / Инструкция</label>
                    <input required value={schedTitle} onChange={e=>setSchedTitle(e.target.value)} placeholder="Например: Плановый осмотр жабр" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                  <div style={{marginBottom:'32px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Дополнительное описание (Опционально)</label>
                    <input value={schedDesc} onChange={e=>setSchedDesc(e.target.value)} placeholder="Например: Обратить внимание на активность рыбы" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                </>
              )}
              
              <div style={{display:'flex', gap:'12px'}}>
                <button type="button" onClick={()=>setScheduleModal(false)} className="btn-ghost" style={{flex:1}}>Отмена</button>
                <button type="submit" className="btn-primary" style={{flex:1}}>Создать задачу</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
