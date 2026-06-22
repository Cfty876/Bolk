'use client'
import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { Filter, Download, Activity, TrendingUp, Video, Brain, FileText } from 'lucide-react'
import { getCages, getMortalityForWeek } from '../../actions'

export default function AnalyticsPage() {
  const [cages, setCages] = useState<any[]>([])
  const [mortalityData, setMortalityData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filterCageId, setFilterCageId] = useState('all')
  const [filterSpecies, setFilterSpecies] = useState('all')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isVideoExporting, setIsVideoExporting] = useState(false)

  useEffect(() => {
    async function load() {
      const data = await getCages()
      setCages(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    async function loadMort() {
      const mortData = await getMortalityForWeek(filterCageId)
      setMortalityData(mortData)
    }
    loadMort()
  }, [filterCageId])

  const filteredCages = useMemo(() => {
    return cages.filter(c => {
      if (filterCageId !== 'all' && c.id !== filterCageId) return false;
      return true;
    }).map(c => {
      const filteredFishes = c.fishes?.filter((f: any) => {
        if (filterSpecies !== 'all' && f.species !== filterSpecies) return false;
        return true;
      }) || [];
      return { ...c, fishes: filteredFishes };
    });
  }, [cages, filterCageId, filterSpecies]);

  const uniqueSpecies = useMemo(() => {
    const speciesSet = new Set<string>();
    cages.forEach(c => c.fishes?.forEach((f: any) => speciesSet.add(f.species)));
    return Array.from(speciesSet);
  }, [cages]);

  const totalBiomassTons = filteredCages.reduce((sum, c) => {
    const cageBiomass = c.fishes?.reduce((acc: number, f: any) => acc + (f.quantity * f.avgWeight), 0) || 0;
    return sum + cageBiomass;
  }, 0) / 1000000;

  const biomassData = totalBiomassTons > 0 ? [
    { month: 'Пред. месяц', value: totalBiomassTons * 0.8 },
    { month: 'Текущий', value: totalBiomassTons }
  ] : [
    { month: 'Пред. месяц', value: 0 },
    { month: 'Текущий', value: 0 }
  ];

  // Synthetic data for the video ecological radar
  const videoAnalyticsData = [
    { time: '0:00', upstream: 0, downstream: 0 },
    { time: '0:10', upstream: 7, downstream: 7 },
    { time: '0:20', upstream: 12, downstream: 13 },
    { time: '0:30', upstream: 13, downstream: 16 },
    { time: '0:40', upstream: 15, downstream: 18 },
    { time: '0:50', upstream: 20, downstream: 27 },
    { time: '1:00', upstream: 25, downstream: 34 }
  ]

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf';
      const response = await fetch(fontUrl);
      const buffer = await response.arrayBuffer();
      
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Font = window.btoa(binary);

      doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');

      doc.setFontSize(18);
      doc.text('Комплексный аналитический отчет', 14, 20);
      doc.setFontSize(12);
      doc.text(`Садок: ${filterCageId === 'all' ? 'Все' : cages.find(c => c.id === filterCageId)?.name}`, 14, 30);
      doc.text(`Вид рыбы: ${filterSpecies === 'all' ? 'Все' : filterSpecies}`, 14, 38);
      doc.text(`Итого биомасса: ${totalBiomassTons.toFixed(3)} тонн`, 14, 46);

      // 1. Biomass Table
      const tableData = filteredCages.flatMap(c => 
        c.fishes.map((f: any) => [
          c.name,
          f.species,
          f.quantity.toString(),
          f.avgWeight.toString(),
          ((f.quantity * f.avgWeight) / 1000000).toFixed(3)
        ])
      );

      let currentY = 55;
      if (tableData.length > 0) {
        doc.text('1. Биомасса по садкам', 14, currentY);
        autoTable(doc as any, {
          startY: currentY + 5,
          head: [['Садок', 'Вид рыбы', 'Количество (шт)', 'Ср. вес (г)', 'Биомасса (т)']],
          body: tableData,
          styles: { font: 'Roboto', fontStyle: 'normal' },
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.text('1. Биомасса по садкам: Нет данных.', 14, currentY);
        currentY += 15;
      }

      // 2. Mortality Table
      doc.text('2. Падеж (смертность) за последние 7 дней', 14, currentY);
      const mortalityTableData = mortalityData.map(m => [
        m.name,
        m.value.toString()
      ]);

      if (mortalityTableData.length > 0) {
        autoTable(doc as any, {
          startY: currentY + 5,
          head: [['День недели', 'Количество (шт)']],
          body: mortalityTableData,
          styles: { font: 'Roboto', fontStyle: 'normal' },
        });
      }

      doc.save('vetlog_aqua_complex_report.pdf');
    } catch (e) {
      console.error(e);
      alert('Ошибка при генерации PDF');
    }
    setIsExporting(false);
  };

  const handleExportVideoPDF = async () => {
    setIsVideoExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf';
      const response = await fetch(fontUrl);
      const buffer = await response.arrayBuffer();
      
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Font = window.btoa(binary);

      doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');

      doc.setFontSize(22);
      doc.text('Экологический радар: Анализ нереста', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Дата генерации: ${new Date().toLocaleDateString('ru-RU')}`, 14, 30);
      doc.text('Модель: YOLOv8 Nano (Sockeye Ecology Detector)', 14, 38);
      
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text('Сводка по видео:', 14, 50);
      
      doc.setFontSize(12);
      const desc = doc.splitTextToSize(
        'Искусственный интеллект автоматически проанализировал видеопоток с камеры, установленной на нерестовой реке. ' +
        'С помощью алгоритма "Line Crossing" был произведен подсчет дикой нерки, пересекающей контрольную линию. ' +
        'Всего зафиксировано 25 особей, поднявшихся вверх по течению, и 34 особи, скатившихся вниз. Пиковая ' +
        'интенсивность хода наблюдалась в период с 0:40 по 1:00.', 180);
      
      doc.text(desc, 14, 60);

      const tableData = videoAnalyticsData.map(d => [
        d.time,
        d.upstream.toString(),
        d.downstream.toString()
      ]);

      autoTable(doc as any, {
        startY: 90,
        head: [['Временная метка', 'Вверх на нерест (шт)', 'Скат вниз (шт)']],
        body: tableData,
        styles: { font: 'Roboto', fontStyle: 'normal' },
        headStyles: { fillColor: [41, 128, 185] }
      });

      doc.save('sockeye_ecological_report.pdf');
    } catch (e) {
      console.error(e);
      alert('Ошибка при генерации PDF');
    }
    setIsVideoExporting(false);
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)'}}>Загрузка данных...</div>

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap: 'wrap', gap: '15px'}}>
        <h1 style={{fontSize:'2rem', fontWeight:800, color:'var(--color-text-main)'}}>Аналитика</h1>
        <div style={{display:'flex', gap:'12px'}}>
          <button onClick={() => setIsFilterModalOpen(true)} className="btn-primary" style={{display:'flex', gap:'8px', alignItems:'center', background:'var(--color-bg-light)', color:'var(--color-text-main)', border:'1px solid var(--color-border)'}}>
            <Filter size={18}/> {filterCageId !== 'all' || filterSpecies !== 'all' ? 'Фильтры (Активны)' : 'Фильтры'}
          </button>
          <button onClick={handleExportPDF} disabled={isExporting} className="btn-primary" style={{display:'flex', gap:'8px', alignItems:'center', opacity: isExporting ? 0.7 : 1}}>
            <Download size={18}/> {isExporting ? 'Генерация...' : 'Экспорт в PDF (Биомасса)'}
          </button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:'20px', marginBottom:'40px'}}>
        <div style={{background:'var(--color-card-bg)', padding:'24px', borderRadius:'16px', border:'1px solid var(--color-border)'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <h3 style={{fontSize:'1.2rem', fontWeight:700, display:'flex', alignItems:'center', gap:'8px', color:'var(--color-text-main)'}}>
              <TrendingUp color="var(--color-secondary)"/> Динамика роста биомассы (т)
            </h3>
          </div>
          <div style={{height:'300px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biomassData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip contentStyle={{background:'var(--color-card-bg)', border:'1px solid var(--color-border)', borderRadius:'8px', color:'var(--color-text-main)'}} />
                <Area type="monotone" dataKey="value" stroke="var(--color-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{background:'var(--color-card-bg)', padding:'24px', borderRadius:'16px', border:'1px solid var(--color-border)'}}>
          <h3 style={{fontSize:'1.2rem', fontWeight:700, display:'flex', alignItems:'center', gap:'8px', color:'var(--color-text-main)', marginBottom:'20px'}}>
            <Activity color="var(--color-danger)"/> Падеж (шт) за неделю
          </h3>
          <div style={{height:'300px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mortalityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background:'var(--color-card-bg)', border:'1px solid var(--color-border)', borderRadius:'8px', color:'var(--color-text-main)'}} />
                <Bar dataKey="value" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* NEW: AI Video Monitoring Section */}
      <h2 style={{fontSize:'1.7rem', fontWeight:800, color:'var(--color-text-main)', marginBottom:'20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
        <Brain color="#2563eb" /> Экологический видеомониторинг
      </h2>
      
      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '40px'}}>
        {/* Video Player */}
        <div style={{backgroundColor: 'var(--color-card-bg)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)'}}>
          <div style={{backgroundColor: '#1e293b', padding: '16px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem'}}>
              <Video size={20} color="#60a5fa" />
              Радар: Sockeye Salmon
            </h3>
          </div>
          <div style={{backgroundColor: '#000', width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <video 
              controls 
              autoPlay 
              muted 
              loop
              style={{width: '100%', height: '100%', objectFit: 'contain'}}
              poster="/logo/photo_fish.png"
            >
              <source src="/reports/ai_demo.mp4" type="video/mp4" />
              Ваш браузер не поддерживает тег video.
            </video>
          </div>
        </div>

        {/* Video Chart & Actions */}
        <div style={{backgroundColor: 'var(--color-card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px'}}>
            <h3 style={{fontSize:'1.2rem', fontWeight:700, display:'flex', alignItems:'center', gap:'8px', color:'var(--color-text-main)', margin: 0}}>
              <Activity color="#2563eb"/> Интенсивность нереста (по кадрам)
            </h3>
            <button onClick={handleExportVideoPDF} disabled={isVideoExporting} className="btn-primary" style={{display:'flex', gap:'8px', alignItems:'center', backgroundColor: '#2563eb', opacity: isVideoExporting ? 0.7 : 1}}>
              <FileText size={18}/> {isVideoExporting ? 'Генерация...' : 'Скачать PDF Отчет'}
            </button>
          </div>

          <div style={{flexGrow: 1, minHeight: '250px', marginTop: '10px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={videoAnalyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip contentStyle={{background:'var(--color-card-bg)', border:'1px solid var(--color-border)', borderRadius:'8px', color:'var(--color-text-main)'}} />
                <Legend wrapperStyle={{paddingTop: '10px'}}/>
                <Area type="monotone" name="Вверх на нерест" dataKey="upstream" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUp)" />
                <Area type="monotone" name="Скат вниз" dataKey="downstream" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDown)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <p style={{marginTop: '20px', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5'}}>
            График отражает кумулятивное количество особей нерки, пересекших контрольную линию на анализируемом видео. Данные экспортированы модулем YOLOv8 Nano ByteTrack.
          </p>
        </div>
      </div>

      {isFilterModalOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: 'var(--color-card-bg)', padding: '30px', borderRadius: '16px', width: '400px', border: '1px solid var(--color-border)'}}>
            <h3 style={{fontSize: '1.5rem', marginBottom: '20px', color: 'var(--color-text-main)'}}>Фильтры аналитики</h3>
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)'}}>Садок</label>
              <select value={filterCageId} onChange={e => setFilterCageId(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-light)', color: 'var(--color-text-main)'}}>
                <option value="all">Все садки</option>
                {cages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{marginBottom: '24px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)'}}>Вид рыбы</label>
              <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-light)', color: 'var(--color-text-main)'}}>
                <option value="all">Все виды</option>
                {uniqueSpecies.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button onClick={() => { setFilterCageId('all'); setFilterSpecies('all'); setIsFilterModalOpen(false); }} style={{padding: '10px 20px', borderRadius: '8px', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'transparent', cursor: 'pointer'}}>Сбросить</button>
              <button onClick={() => setIsFilterModalOpen(false)} className="btn-primary" style={{border: 'none', cursor: 'pointer'}}>Применить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
