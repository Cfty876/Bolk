'use client'
import { useState, useEffect } from 'react'
import { getFishes, getCages, createFish, addWeightLog, updateFishBatch, deleteFishBatch, releaseFishBatch } from '../../actions'
import { Plus, Fish as FishIcon, Globe, Edit2, Trash2, Waves } from 'lucide-react'

export default function FishPage() {
  const [fishes, setFishes] = useState<any[]>([])
  const [cages, setCages] = useState<any[]>([])
  const [isModalOpen, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [cageId, setCageId] = useState('')
  const [species, setSpecies] = useState('Нерка')
  const [quantity, setQuantity] = useState<number | string>('')
  const [avgWeight, setAvgWeight] = useState<number | string>('')
  
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [newWeight, setNewWeight] = useState('')

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editBatchId, setEditBatchId] = useState('')
  const [originalQuantity, setOriginalQuantity] = useState(0)
  const [mortalityReason, setMortalityReason] = useState('')
  const [isCorrection, setIsCorrection] = useState(false)

  // Release State
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [releaseBatchId, setReleaseBatchId] = useState('')
  const [releaseRiver, setReleaseRiver] = useState('')
  const [riverTemp, setRiverTemp] = useState('')
  const [tagSequence, setTagSequence] = useState('')

  const load = async () => {
    try {
      const fData = await getFishes()
      const cData = await getCages()
      setFishes(fData)
      setCages(cData)
      if (cData.length > 0 && !cageId) setCageId(cData[0].id)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cageId) return alert('Сначала создайте садок!')
    setLoading(true)
    await createFish(cageId, species, Number(quantity), Number(avgWeight))
    setModal(false)
    setQuantity('')
    setAvgWeight('')
    load()
  }

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatchId || !newWeight) return
    setLoading(true)
    await addWeightLog(selectedBatchId, Number(newWeight))
    setIsWeightModalOpen(false)
    setNewWeight('')
    load()
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBatchId || !cageId) return
    setLoading(true)
    await updateFishBatch(editBatchId, cageId, species, Number(quantity), mortalityReason, isCorrection)
    setIsEditModalOpen(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту партию рыбы?')) {
      setLoading(true)
      await deleteFishBatch(id)
      load()
    }
  }

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!releaseBatchId || !releaseRiver) return
    setLoading(true)
    await releaseFishBatch(releaseBatchId, releaseRiver, Number(riverTemp), tagSequence)
    setIsReleaseModalOpen(false)
    setReleaseRiver('')
    setRiverTemp('')
    setTagSequence('')
    load()
  }

  const openEditModal = (fish: any) => {
    setEditBatchId(fish.id)
    setCageId(fish.cageId)
    setSpecies(fish.species)
    setQuantity(fish.quantity)
    setOriginalQuantity(fish.quantity)
    setMortalityReason('')
    setIsCorrection(false)
    setIsEditModalOpen(true)
  }

  const openReleaseModal = (fish: any) => {
    setReleaseBatchId(fish.id)
    setIsReleaseModalOpen(true)
  }

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)'}}>Загрузка данных...</div>

  const growingFishes = fishes.filter(f => f.status === 'GROWING')
  const releasedFishes = fishes.filter(f => f.status === 'RELEASED')

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
        <h1 style={{fontSize:'2rem', fontWeight:800, color:'var(--color-text-main)'}}>Поголовье рыбы</h1>
        <button onClick={() => { setCageId(cages[0]?.id); setQuantity(''); setAvgWeight(''); setModal(true) }} className="btn-primary" style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <Plus size={18}/> Добавить партию
        </button>
      </div>

      {/* GROWING FISHES */}
      <div style={{background:'var(--color-card-bg)', borderRadius:'16px', border:'1px solid var(--color-border)', overflow:'hidden', marginBottom:'40px'}}>
        <div style={{padding: '16px', background: 'var(--color-bg-light)', borderBottom: '1px solid var(--color-border)'}}>
            <h2 style={{margin: 0, fontSize: '1.2rem', color: 'var(--color-text-main)'}}>Активные садки (Растущие)</h2>
        </div>
        {growingFishes.length === 0 ? (
          <div style={{textAlign:'center', padding:'60px 20px'}}>
            <FishIcon size={48} color="var(--color-text-muted)" style={{marginBottom:'16px', opacity: 0.5}} />
            <h3 style={{fontSize:'1.2rem', color:'var(--color-text-main)', marginBottom:'8px'}}>Нет партий на выращивании</h3>
            <p style={{color:'var(--color-text-muted)'}}>Посадите первую партию рыбы в один из садков.</p>
          </div>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
            <thead style={{background:'var(--color-bg-light)', borderBottom:'1px solid var(--color-border)'}}>
              <tr>
                <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Вид</th>
                <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Локация</th>
                <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Кол-во (шт)</th>
                <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Ср. вес (г)</th>
                <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {growingFishes.map(fish => {
                const currentWeight = fish.weightLogs && fish.weightLogs.length > 0 ? fish.weightLogs[0].avgWeight : fish.avgWeight;
                return (
                <tr key={fish.id} style={{borderBottom:'1px solid var(--color-border)'}}>
                  <td style={{padding:'16px', fontWeight:500, color:'var(--color-text-main)'}}>{fish.species}</td>
                  <td style={{padding:'16px', color:'var(--color-text-muted)'}}>{fish.cage?.name || 'Неизвестно'}</td>
                  <td style={{padding:'16px', color:'var(--color-text-main)'}}>{fish.quantity.toLocaleString()}</td>
                  <td style={{padding:'16px', color:'var(--color-text-main)', cursor:'pointer'}} title="Кликните чтобы обновить вес" onClick={() => { setSelectedBatchId(fish.id); setIsWeightModalOpen(true); }}>
                    {currentWeight} г <span style={{fontSize:'0.8rem', color:'var(--color-primary)', marginLeft:'8px'}}>✏️</span>
                  </td>
                  <td style={{padding:'16px'}}>
                    <div style={{display: 'flex', gap: '8px'}}>
                        <button onClick={() => openEditModal(fish)} style={{padding:'8px', background:'transparent', border:'none', color:'var(--color-text-muted)', cursor:'pointer'}} title="Редактировать">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(fish.id)} style={{padding:'8px', background:'transparent', border:'none', color:'var(--color-danger)', cursor:'pointer'}} title="Удалить">
                            <Trash2 size={16} />
                        </button>
                        {fish.species === 'Нерка' && (
                            <button onClick={() => openReleaseModal(fish)} style={{padding:'6px 12px', background:'rgba(46, 204, 113, 0.1)', border:'1px solid rgba(46, 204, 113, 0.3)', color:'#2ECC71', borderRadius:'8px', cursor:'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600}} title="Выпустить в природу">
                                <Waves size={16} /> Выпустить
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {/* RELEASED FISHES */}
      {releasedFishes.length > 0 && (
          <div style={{background:'var(--color-card-bg)', borderRadius:'16px', border:'1px solid #2ECC7140', overflow:'hidden', marginBottom:'40px'}}>
            <div style={{padding: '16px', background: 'rgba(46, 204, 113, 0.05)', borderBottom: '1px solid #2ECC7140'}}>
                <h2 style={{margin: 0, fontSize: '1.2rem', color: '#2ECC71', display: 'flex', alignItems: 'center', gap: '8px'}}><Globe size={20} /> Выпущенные популяции (Conservation)</h2>
            </div>
            <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
                <thead style={{background:'rgba(46, 204, 113, 0.02)', borderBottom:'1px solid var(--color-border)'}}>
                <tr>
                    <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Вид</th>
                    <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Кол-во (шт)</th>
                    <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Река / Темп.</th>
                    <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Метка</th>
                    <th style={{padding:'16px', color:'var(--color-text-muted)', fontWeight:600}}>Дата выпуска</th>
                </tr>
                </thead>
                <tbody>
                {releasedFishes.map(fish => {
                    const releaseDate = fish.releasedAt ? new Date(fish.releasedAt).toLocaleDateString('ru-RU') : 'Неизвестно';
                    return (
                    <tr key={fish.id} style={{borderBottom:'1px solid var(--color-border)'}}>
                    <td style={{padding:'16px', fontWeight:500, color:'var(--color-text-main)'}}>{fish.species}</td>
                    <td style={{padding:'16px', color:'var(--color-text-main)'}}>{fish.quantity.toLocaleString()}</td>
                    <td style={{padding:'16px', color:'var(--color-text-main)'}}>{fish.releaseRiver || '-'} ({fish.riverTemp ? `${fish.riverTemp}°C` : '-'})</td>
                    <td style={{padding:'16px', color:'var(--color-text-main)'}}>{fish.tagSequence || 'Нет'}</td>
                    <td style={{padding:'16px', color:'var(--color-text-main)'}}>{releaseDate}</td>
                    </tr>
                )})}
                </tbody>
            </table>
          </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <div style={{background:'var(--color-card-bg)', padding:'32px', borderRadius:'20px', width:'400px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginBottom:'24px', color:'var(--color-text-main)'}}>Посадка рыбы</h2>
            
            {cages.length === 0 ? (
              <div style={{color:'var(--color-danger)', marginBottom:'20px'}}>
                У вас нет ни одного садка. Сначала добавьте садок в разделе "Садки".
                <button onClick={() => setModal(false)} style={{marginTop:'10px', width:'100%', padding:'10px', borderRadius:'8px', background:'var(--color-bg-light)', border:'1px solid var(--color-border)', cursor:'pointer'}}>Закрыть</button>
              </div>
            ) : (
              <form onSubmit={handleAdd}>
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Садок / Бассейн</label>
                  <select value={cageId} onChange={e=>setCageId(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    {cages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Вид рыбы</label>
                  <select required value={species} onChange={e=>setSpecies(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    <option value="Нерка">Нерка</option>
                    <option value="Форель">Форель</option>
                    <option value="Осетр">Осетр</option>
                  </select>
                </div>
                <div style={{display:'flex', gap:'12px', marginBottom:'32px'}}>
                  <div style={{flex:1}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Кол-во (шт)</label>
                    <input type="number" required value={quantity} onChange={e=>setQuantity(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                  <div style={{flex:1}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Ср. вес (г)</label>
                    <input type="number" step="0.1" required value={avgWeight} onChange={e=>setAvgWeight(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                  </div>
                </div>
                <div style={{display:'flex', gap:'12px'}}>
                  <button type="button" onClick={()=>setModal(false)} style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'transparent', color:'var(--color-text-main)', cursor:'pointer', fontWeight:600}}>Отмена</button>
                  <button type="submit" className="btn-primary" style={{flex:1, padding:'12px', borderRadius:'10px'}}>Сохранить</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* WEIGHT MODAL */}
      {isWeightModalOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <div style={{background:'var(--color-card-bg)', padding:'32px', borderRadius:'20px', width:'400px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginBottom:'24px', color:'var(--color-text-main)'}}>Контрольное взвешивание</h2>
            <form onSubmit={handleAddWeight}>
              <div style={{marginBottom:'32px'}}>
                <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Новый средний вес (г)</label>
                <input type="number" step="0.1" required value={newWeight} onChange={e=>setNewWeight(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} placeholder="Например: 150.5" />
              </div>
              <div style={{display:'flex', gap:'12px'}}>
                <button type="button" onClick={() => setIsWeightModalOpen(false)} style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'transparent', color:'var(--color-text-main)', cursor:'pointer', fontWeight:600}}>Отмена</button>
                <button type="submit" className="btn-primary" style={{flex:1, padding:'12px', borderRadius:'10px'}}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <div style={{background:'var(--color-card-bg)', padding:'32px', borderRadius:'20px', width:'400px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginBottom:'24px', color:'var(--color-text-main)'}}>Редактирование партии</h2>
            <form onSubmit={handleEdit}>
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Садок / Бассейн</label>
                  <select value={cageId} onChange={e=>setCageId(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    {cages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Вид рыбы</label>
                  <select required value={species} onChange={e=>setSpecies(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}}>
                    <option value="Нерка">Нерка</option>
                    <option value="Форель">Форель</option>
                    <option value="Осетр">Осетр</option>
                  </select>
                </div>
                <div style={{marginBottom:'32px'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Кол-во (шт)</label>
                    <input type="number" required value={quantity} onChange={e=>setQuantity(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} />
                </div>
                
                {Number(quantity) < originalQuantity && (
                  <div style={{marginBottom:'24px', padding: '16px', borderRadius: '10px', background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)'}}>
                    <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-danger)'}}>Зафиксировано уменьшение численности (-{originalQuantity - Number(quantity)} шт)</label>
                    
                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px'}}>
                      <input type="checkbox" id="isCorrection" checked={isCorrection} onChange={e=>setIsCorrection(e.target.checked)} style={{width:'16px', height:'16px'}} />
                      <label htmlFor="isCorrection" style={{color:'var(--color-text-muted)', fontSize:'0.9rem'}}>Это исправление ошибки ввода (не падеж)</label>
                    </div>

                    {!isCorrection && (
                      <div>
                        <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Причина падежа (для ИИ аналитики)</label>
                        <input required type="text" value={mortalityReason} onChange={e=>setMortalityReason(e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} placeholder="Например: Инфекция, Перепады температуры" />
                      </div>
                    )}
                  </div>
                )}
                
              <div style={{display:'flex', gap:'12px'}}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'transparent', color:'var(--color-text-main)', cursor:'pointer', fontWeight:600}}>Отмена</button>
                <button type="submit" className="btn-primary" style={{flex:1, padding:'12px', borderRadius:'10px'}}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RELEASE MODAL */}
      {isReleaseModalOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
          <div style={{background:'var(--color-card-bg)', padding:'32px', borderRadius:'20px', width:'400px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #2ECC71', position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#2ECC71'}}></div>
            <h2 style={{marginBottom:'24px', color:'#2ECC71', display: 'flex', alignItems: 'center', gap: '10px'}}><Waves size={24} /> Выпуск в природу</h2>
            <form onSubmit={handleRelease}>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Река (Место выпуска)</label>
                <input required value={releaseRiver} onChange={e=>setReleaseRiver(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} placeholder="Например: р. Камчатка" />
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Температура воды (°C)</label>
                <input type="number" step="0.1" required value={riverTemp} onChange={e=>setRiverTemp(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} placeholder="Для исключения шока" />
              </div>
              <div style={{marginBottom:'32px'}}>
                <label style={{display:'block', marginBottom:'8px', fontWeight:500, color:'var(--color-text-muted)'}}>Серия меток (PIT/CWT)</label>
                <input value={tagSequence} onChange={e=>setTagSequence(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)'}} placeholder="Например: PIT-2026-X" />
                <p style={{fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px'}}>Заполнение серии меток поможет экологам отследить возврат.</p>
              </div>
              <div style={{display:'flex', gap:'12px'}}>
                <button type="button" onClick={() => setIsReleaseModalOpen(false)} style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid var(--color-border)', background:'transparent', color:'var(--color-text-main)', cursor:'pointer', fontWeight:600}}>Отмена</button>
                <button type="submit" style={{flex:1, padding:'12px', borderRadius:'10px', background: '#2ECC71', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'}}>Подтвердить выпуск</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
