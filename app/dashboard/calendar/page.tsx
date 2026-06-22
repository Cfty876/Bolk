'use client'

import { useState, useEffect } from 'react'
import { getTasksForMonth, cancelTaskForDay } from '../../actions'
import { Fish, Syringe, Eye, ChevronLeft, ChevronRight, XCircle, CheckCircle2 } from 'lucide-react'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [days, setDays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMonth = async (date: Date) => {
    setLoading(true)
    try {
      const data = await getTasksForMonth(date.getFullYear(), date.getMonth() + 1)
      setDays(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonth(currentDate)
  }, [currentDate])

  const now = new Date()
  const currentYear = now.getFullYear()

  const prevMonth = () => {
    if (currentDate.getFullYear() === currentYear && currentDate.getMonth() === 0) return
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    if (currentDate.getFullYear() === currentYear && currentDate.getMonth() === 11) return
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const canGoPrev = !(currentDate.getFullYear() === currentYear && currentDate.getMonth() === 0)
  const canGoNext = !(currentDate.getFullYear() === currentYear && currentDate.getMonth() === 11)

  const handleCancelTask = async (scheduleId: string, dateStr: string) => {
    if (confirm('Вы уверены, что хотите отменить эту задачу именно на этот день?')) {
      await cancelTaskForDay(scheduleId, dateStr)
      fetchMonth(currentDate)
    }
  }

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  // Add padding for start of month
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  // Adjust to Monday start
  const paddingDays = startDay === 0 ? 6 : startDay - 1
  const paddingArr = Array(paddingDays).fill(null)

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
        <h1 style={{fontSize:'2rem', fontWeight:800, color:'var(--color-text-main)'}}>Календарь задач</h1>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button onClick={prevMonth} disabled={!canGoPrev} className="btn-outline" style={{padding: '8px', borderRadius: '8px', opacity: canGoPrev ? 1 : 0.3, cursor: canGoPrev ? 'pointer' : 'not-allowed'}}>
            <ChevronLeft size={20} />
          </button>
          <h2 style={{fontSize: '1.2rem', minWidth: '150px', textAlign: 'center', margin: 0, color: 'var(--color-text-main)'}}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} disabled={!canGoNext} className="btn-outline" style={{padding: '8px', borderRadius: '8px', opacity: canGoNext ? 1 : 0.3, cursor: canGoNext ? 'pointer' : 'not-allowed'}}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div style={{
        background: 'var(--color-card-bg)', 
        borderRadius: '16px', 
        border: '1px solid var(--color-border)', 
        padding: '20px',
        overflowX: 'auto'
      }}>
        {loading ? (
          <div style={{textAlign: 'center', padding: '50px', color: 'var(--color-text-muted)'}}>Загрузка календаря...</div>
        ) : (
          <div style={{minWidth: '900px'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '10px'}}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                <div key={d} style={{textAlign: 'center', fontWeight: 'bold', color: 'var(--color-text-muted)', padding: '10px 0'}}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px'}}>
              {paddingArr.map((_, i) => (
                <div key={`empty-${i}`} style={{minHeight: '120px', borderRadius: '12px', background: 'var(--color-bg-light)', opacity: 0.5}}></div>
              ))}
              
              {days.map((dayData, idx) => {
                const now = new Date();
                const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const isToday = todayDateStr === dayData.dateStr;
                
                return (
                  <div key={dayData.day} style={{
                    minHeight: '120px', 
                    borderRadius: '12px', 
                    background: isToday ? 'rgba(52, 152, 219, 0.05)' : 'var(--glass-bg)', 
                    border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{
                        fontSize: '1.1rem', 
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: isToday ? 'var(--color-primary)' : 'var(--color-text-main)',
                        background: isToday ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                        padding: isToday ? '2px 8px' : '2px',
                        borderRadius: '6px'
                      }}>
                        {dayData.day}
                      </span>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '5px', flex: 1}}>
                      {dayData.tasks.map((t: any) => {
                        const isCancelled = t.status === 'CANCELLED'
                        const isCompleted = t.status === 'COMPLETED'
                        const isMissed = t.status === 'MISSED'
                        
                        return (
                          <div key={t.id} style={{
                            fontSize: '0.8rem',
                            padding: '6px',
                            borderRadius: '6px',
                            background: isCancelled ? 'var(--color-bg-light)' : 
                                        isCompleted ? 'rgba(46, 204, 113, 0.1)' :
                                        isMissed ? 'rgba(231, 76, 60, 0.1)' : 'var(--color-card-bg)',
                            border: `1px solid ${isCancelled ? 'transparent' : 
                                                isCompleted ? 'rgba(46, 204, 113, 0.3)' : 
                                                isMissed ? 'rgba(231, 76, 60, 0.3)' : 'var(--color-border)'}`,
                            color: isCancelled ? 'var(--color-text-muted)' : 'var(--color-text-main)',
                            opacity: isCancelled ? 0.6 : 1,
                            textDecoration: isCancelled ? 'line-through' : 'none',
                            position: 'relative'
                          }}>
                            
                            <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px'}}>
                              {t.type === 'FEEDING' ? <Fish size={12} /> : t.type === 'VET' ? <Syringe size={12} /> : <Eye size={12} />}
                              <b style={{color: isCompleted ? '#2ecc71' : isMissed ? '#e74c3c' : 'inherit'}}>{t.time}</b>
                            </div>
                            <div style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                              {t.cageName}
                            </div>
                            
                            {!isCancelled && !isCompleted && !isMissed && (
                              <button 
                                title="Отменить эту задачу на сегодня"
                                onClick={() => handleCancelTask(t.id, dayData.dateStr)}
                                style={{
                                  position: 'absolute', top: '-5px', right: '-5px',
                                  background: 'white', borderRadius: '50%', color: 'var(--color-danger)',
                                  border: 'none', cursor: 'pointer', padding: 0, display: 'flex',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}
                              >
                                <XCircle size={16} />
                              </button>
                            )}

                            {isCompleted && (
                              <div style={{position: 'absolute', top: '-5px', right: '-5px', background: 'white', borderRadius: '50%', color: '#2ecc71', display: 'flex'}}>
                                <CheckCircle2 size={16} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
