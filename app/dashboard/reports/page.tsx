'use client'
import { useState, useEffect } from 'react'
import { FileText, Download, CheckCircle2, Trash2, Brain, Activity, AlertTriangle, Fish, Droplets, UserCheck, AlertCircle, TrendingUp, ShieldAlert, ListChecks } from 'lucide-react'
import { getCages, getJournalEntries, saveReportToServer, getSavedReports, deleteReport, generateAIReport } from '../../actions'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ReportsPage() {
  const [isGenerating, setGenerating] = useState(false)
  const [isAIGenerating, setAIGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("Анализ системы...")
  const [success, setSuccess] = useState(false)
  const [reports, setReports] = useState<{name: string, date: string, url: string}[]>([])

  const [reportType, setReportType] = useState('biomass')
  const [cages, setCages] = useState<any[]>([])
  const [journal, setJournal] = useState<any[]>([])
  const [aiTopic, setAiTopic] = useState('general')
  
  // AI State
  const [aiResult, setAiResult] = useState<any>(null)

  const MODELS = [
    "openrouter/free", // Автоматически подбирает лучшую бесплатную и быструю модель
    "google/gemma-4-26b-a4b-it:free", 
    "google/gemma-4-31b-it:free", 
    "nvidia/nemotron-3-nano-30b-a3b:free" 
  ];

  // Helper to map string icon names from AI to actual Lucide components
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity': return <Activity size={24} color="var(--color-primary)" />;
      case 'AlertTriangle': return <AlertTriangle size={24} color="var(--color-warning)" />;
      case 'Fish': return <Fish size={24} color="var(--color-accent)" />;
      case 'Droplets': return <Droplets size={24} color="var(--color-secondary)" />;
      case 'UserCheck': return <UserCheck size={24} color="var(--color-primary)" />;
      case 'TrendingUp': return <TrendingUp size={24} color="var(--color-secondary)" />;
      case 'ShieldAlert': return <ShieldAlert size={24} color="var(--color-danger)" />;
      case 'ListChecks': return <ListChecks size={24} color="var(--color-primary)" />;
      default: return <FileText size={24} color="var(--color-primary)" />;
    }
  };

  useEffect(() => {
    async function load() {
      const c = await getCages();
      const j = await getJournalEntries();
      const r = await getSavedReports();
      setCages(c);
      setJournal(j);
      setReports(r);
    }
    load();
  }, [])

  const handleDelete = async (filename: string) => {
    if (confirm('Вы уверены, что хотите удалить этот отчет?')) {
      await deleteReport(filename);
      setReports(reports.filter(r => r.name !== filename));
    }
  }

  const handleAIGenerate = async () => {
    setAIGenerating(true);
    setProgress(0);
    setAiResult(null);
    setProgressMessage("Анализ системы...");

    let interval = setInterval(() => {
      setProgress(p => {
        if (p === 80) setProgressMessage("Модель пишет объемный текст (это может занять до минуты)...");
        if (p >= 95) return 95;
        const inc = p < 50 ? 5 : p < 80 ? 2 : 1;
        return p + inc;
      });
    }, 500);

    let finalResult = null;
    
    for (let i = 0; i < MODELS.length; i++) {
      const model = MODELS[i];
      try {
        const result = await generateAIReport(aiTopic, model);
        if (result && result.error) {
          throw new Error(result.error);
        }
        finalResult = result;
        break; // Success!
      } catch (e: any) {
        if (i < MODELS.length - 1) {
          console.log(`[AI Fallback] Модель ${model} недоступна, пробуем следующую... (${e.message})`);
          setProgressMessage(`Нейросеть перегружена. Переключаюсь на резервную (${i+2}/${MODELS.length})...`);
          setProgress(0); // Reset timer
        } else {
          clearInterval(interval);
          alert('Все нейросети сейчас недоступны: ' + e.message);
          setAIGenerating(false);
          return;
        }
      }
    }

    clearInterval(interval);
    if (finalResult) {
      setProgress(100);
      setProgressMessage("Готово! Формирование отчета...");
      setTimeout(() => {
        setAiResult(finalResult);
        setAIGenerating(false);
      }, 600);
    }
  }

  const handleExportAIPdf = async () => {
    if (!aiResult) return;
    
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();

      // Загрузка кириллического шрифта
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
      doc.text('Аналитический AI-Отчет Системы', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Сгенерировано нейросетью: ${new Date().toLocaleString('ru-RU')}`, 14, 28);
      
      doc.setTextColor(0);
      doc.setFontSize(12);
      
      let currentY = 40;
      
      const summaryText = aiResult.executiveSummary || aiResult.reportText || "";
      if (summaryText) {
        const splitText = doc.splitTextToSize(summaryText, 180);
        doc.text(splitText, 14, currentY);
        currentY += (splitText.length * 6) + 10;
      }

      if (aiResult.sections && Array.isArray(aiResult.sections)) {
        aiResult.sections.forEach((sec: any) => {
           if (currentY > 270) { doc.addPage(); currentY = 20; }
           doc.setFontSize(14);
           doc.text(sec.title || "Раздел", 14, currentY);
           currentY += 8;
           
           doc.setFontSize(12);
           const splitContent = doc.splitTextToSize(sec.content || "", 180);
           doc.text(splitContent, 14, currentY);
           currentY += (splitContent.length * 6) + 10;
        });
      }
      
      if (aiResult.alerts && aiResult.alerts.length > 0) {
        if (currentY > 260) { doc.addPage(); currentY = 20; }
        doc.setFontSize(14);
        doc.setTextColor(200, 0, 0);
        doc.text("Обнаружены критические проблемы:", 14, currentY);
        currentY += 8;
        doc.setFontSize(12);
        aiResult.alerts.forEach((alert: any) => {
          const alertText = doc.splitTextToSize(`${alert.severity}: ${alert.message}`, 180);
          doc.text(alertText, 14, currentY);
          currentY += (alertText.length * 6) + 4;
        });
        doc.setTextColor(0);
        currentY += 6;
      }

      if (aiResult.chartData && aiResult.chartData.length > 0) {
        currentY += 10;
        doc.setFontSize(14);
        doc.text(`Данные графика: ${aiResult.chartLabel || 'Аналитика'}`, 14, currentY);
        currentY += 5;
        
        const tableBody = aiResult.chartData.map((d: any) => [d.name, d.value.toString()]);
        autoTable(doc as any, {
          startY: currentY,
          head: [['Показатель', 'Значение']],
          body: tableBody,
          styles: { font: 'Roboto', fontStyle: 'normal' },
        });
      }

      const newReportName = `AI_Отчет_${new Date().toLocaleDateString().replace(/\./g, '-')}_${Math.floor(Math.random() * 1000)}.pdf`;
      const base64Pdf = doc.output('datauristring');
      const saveResult = await saveReportToServer(base64Pdf, newReportName);

      if (saveResult.success) {
        const updatedReports = await getSavedReports();
        setReports(updatedReports);

        const link = document.createElement('a');
        link.href = saveResult.url;
        link.download = newReportName;
        link.click();
      }

    } catch (e) {
      console.error(e)
      alert('Ошибка генерации PDF')
    }
  }

  return (
    <div style={{maxWidth: '1000px', margin: '0 auto'}}>
      <h1 style={{fontSize:'2rem', fontWeight:800, color:'var(--color-text-main)', marginBottom:'24px'}}>Глобальная Отчетность</h1>

      {/* AI GENERATOR SECTION */}
      <div style={{background:'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', padding:'32px', borderRadius:'20px', border:'1px solid var(--glass-border)', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'}}>
        
        {/* Decorative elements */}
        <div style={{position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--color-primary)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none'}}></div>
        
        <div style={{display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 2}}>
          <div>
            <h2 style={{fontSize:'1.6rem', fontWeight:800, color:'var(--color-primary)', margin: 0}}>AI-Аналитик</h2>
            <p style={{color: 'var(--color-text-muted)', margin: '6px 0 0 0', fontSize: '1.05rem', lineHeight: '1.5'}}>Нейросеть проанализирует данные со всех датчиков, журналов и садков, построит графики и выявит скрытые проблемы.</p>
          </div>
        </div>

        <div style={{display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', position: 'relative', zIndex: 2}}>
          <div style={{flex: 1, minWidth: '200px'}}>
            <label style={{display:'block', marginBottom:'8px', fontWeight:600, color:'var(--color-text-main)'}}>Сфера анализа</label>
            <select value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} style={{width:'100%', padding:'14px', borderRadius:'12px', border:'1px solid var(--glass-border)', background:'var(--color-bg-light)', color:'var(--color-text-main)', fontSize: '1rem', outline: 'none'}}>
              <option value="general">Общий комплексный отчет</option>
              <option value="Биомасса и Кормление">Биомасса и эффективность кормления</option>
              <option value="Ветеринария и Здоровье">Здоровье рыб и ветеринария</option>
              <option value="Качество воды">Качество воды и показания датчиков</option>
              <option value="Оценка работы персонала">Выполнение расписания и работа персонала</option>
            </select>
          </div>
          <div style={{display: 'flex', alignItems: 'flex-end', flex: '2', minWidth: '300px'}}>
            <button 
              onClick={handleAIGenerate}
              disabled={isAIGenerating}
              className={isAIGenerating ? "btn-outline" : "btn-primary"}
              style={{width:'100%', padding:'14px 24px', fontSize:'1.1rem', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', cursor: isAIGenerating ? 'not-allowed' : 'pointer', fontWeight: 700, borderRadius: '12px'}}
            >
              {isAIGenerating ? (
                <><Activity className="animate-spin" /> {progressMessage} {progress}%</>
              ) : (
                <><Brain /> Сгенерировать AI-отчет</>
              )}
            </button>
          </div>
        </div>

        {isAIGenerating && (
          <div style={{background: 'var(--color-bg-light)', borderRadius: '8px', overflow: 'hidden', height: '8px', position: 'relative', zIndex: 2}}>
            <div style={{height: '100%', width: `${progress}%`, background: 'var(--color-primary)', transition: 'width 0.5s ease', boxShadow: '0 0 10px var(--color-primary)'}}></div>
          </div>
        )}

        {aiResult && (
          <div style={{marginTop: '24px', background: 'var(--color-card-bg)', padding: '32px', borderRadius: '24px', border: '1px solid var(--glass-border)', position: 'relative', zIndex: 2, boxShadow: '0 10px 40px rgba(0,0,0,0.05)'}}>
            
            {/* Executive Summary */}
            <div style={{background: 'linear-gradient(135deg, rgba(0,180,216,0.05), rgba(46,204,113,0.05))', borderLeft: '4px solid var(--color-secondary)', padding: '24px', borderRadius: '0 16px 16px 0', marginBottom: '32px'}}>
              <h3 style={{fontSize: '1.4rem', color: 'var(--color-primary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px'}}><Brain size={24} /> Главные итоги анализа</h3>
              <p style={{fontSize: '1.1rem', color: 'var(--color-text-main)', lineHeight: '1.7', margin: 0}}>{aiResult.executiveSummary || aiResult.reportText}</p>
            </div>

            {/* Sections Grid */}
            {aiResult.sections && aiResult.sections.length > 0 && (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px'}}>
                {aiResult.sections.map((section: any, idx: number) => (
                  <div key={idx} style={{background: 'var(--glass-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)', transition: 'transform 0.2s', cursor: 'default'}} className="hover:scale-[1.02]">
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                      <div style={{padding: '10px', background: 'rgba(0,180,216,0.1)', borderRadius: '12px'}}>
                        {renderIcon(section.icon)}
                      </div>
                      <h4 style={{fontSize: '1.2rem', color: 'var(--color-text-main)', margin: 0}}>{section.title}</h4>
                    </div>
                    <p style={{fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap'}}>{section.content}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Alerts */}
            {aiResult.alerts && aiResult.alerts.length > 0 && (
              <div style={{marginBottom: '32px', background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '24px', borderRadius: '16px'}}>
                <h4 style={{color: 'var(--color-danger)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem'}}><AlertCircle size={24} /> Обнаружены критические проблемы:</h4>
                <ul style={{margin: 0, color: 'var(--color-danger)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1.05rem'}}>
                  {aiResult.alerts.map((a: any, i: number) => (
                    <li key={i}><strong>{a.severity}:</strong> {a.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chart */}
            {aiResult.chartData && aiResult.chartData.length > 0 && (
              <div style={{background: 'var(--glass-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)', height: '350px'}}>
                <h4 style={{color: 'var(--color-text-main)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem'}}><Activity color="var(--color-secondary)" size={24} /> {aiResult.chartLabel || 'График данных'}</h4>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={aiResult.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{backgroundColor: 'var(--color-card-bg)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', color: 'var(--color-text-main)'}} cursor={{fill: 'rgba(0,180,216,0.05)'}} />
                    <Bar dataKey="value" fill="url(#colorUv)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={1}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <button 
              onClick={handleExportAIPdf}
              className="btn-outline" 
              style={{marginTop: '32px', padding:'12px 24px', display:'flex', alignItems:'center', gap:'8px', borderRadius: '12px', fontWeight: 600}}
            >
              <Download size={18} /> Скачать этот отчет в PDF
            </button>
          </div>
        )}
      </div>

      <h2 style={{fontSize:'1.3rem', fontWeight:700, color:'var(--color-text-main)', marginTop:'40px', marginBottom:'16px'}}>Архив сохраненных отчетов</h2>
      <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
        {reports.length === 0 ? (
          <div style={{color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px', background: 'var(--glass-bg)', borderRadius: '12px'}}>
            Вы еще не сохраняли отчеты.
          </div>
        ) : (
          reports.map((report, idx) => (
            <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px', background:'var(--glass-bg, var(--color-card-bg))', borderRadius:'12px', border:'1px solid var(--glass-border, var(--color-border))'}}>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <FileText color="var(--color-secondary)" />
                <div>
                  <div style={{fontWeight:600, color:'var(--color-text-main)'}}>{report.name}</div>
                  <div style={{fontSize:'0.9rem', color:'var(--color-text-muted)'}}>Создан: {report.date}</div>
                </div>
              </div>
              <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                <a href={report.url} download={report.name} style={{padding:'8px 16px', borderRadius:'8px', background:'var(--color-bg-light)', border:'1px solid var(--glass-border)', cursor:'pointer', color:'var(--color-text-main)', textDecoration: 'none'}}>Скачать</a>
                <button onClick={() => handleDelete(report.name)} style={{background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '8px'}} title="Удалить">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
