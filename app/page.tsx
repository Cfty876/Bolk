'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import FishSVG from '../components/FishSVG';
import { Leaf, Smartphone, Activity, BarChart3, ChevronRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className={styles.main}>
      {/* Анимация плавающих рыб */}
      <div className={`${styles.fish} ${styles.fish1}`}><FishSVG width="250" height="100" color="#00B4D8" /></div>
      <div className={`${styles.fish} ${styles.fish2}`}><FishSVG width="290" height="120" color="#2ECC71" /></div>
      <div className={`${styles.fish} ${styles.fish3}`}><FishSVG width="150" height="70" color="#00B4D8" /></div>
      <div className={`${styles.fish} ${styles.fish4}`}><FishSVG width="180" height="80" color="#2ECC71" /></div>
      <div className={`${styles.fish} ${styles.fish5}`}><FishSVG width="220" height="90" color="#00B4D8" /></div>
      
      <div className={`${styles.headerWrapper} ${isScrolled ? styles.scrolled : ''}`}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo} style={{textDecoration: 'none'}}>
            <Image src="/logo-transparent.png" alt="Логотип Бульк!" width={65} height={65} style={{objectFit: 'contain'}} />
            <span className={styles.brandName}>Бульк!</span>
          </Link>
          <nav className={styles.nav}>
            <a href="#mission">Миссия</a>
            <a href="#fish">Виды Рыб</a>
            <a href="#eco">Эко-Виджет</a>
            <a href="#tma">Мини-Приложение</a>
          </nav>
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.loginLink}>Войти</Link>
          </div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section className={styles.hero} id="mission">
        <div className={styles.heroContent}>
          <Image src="/logo-transparent.png" alt="Бульк!" width={450} height={160} style={{objectFit: 'contain', margin: '0 auto 30px'}} />
          <h2 className={styles.slogan} style={{fontSize: '2.5rem', textTransform: 'none'}}>
            Отечественные инновации для экологии и аквакультуры.
          </h2>
          <p className={styles.subtitle} style={{fontSize: '1.2rem', maxWidth: '800px', margin: '20px auto 40px'}}>
            Бульк! — это социально-значимый российский проект. Мы создаём единую экосистему управления рыбными хозяйствами: от заботы о каждой икринке до публичных программ по восстановлению диких популяций.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/register" className={styles.btnGlass}>
              Присоединиться к проекту
            </Link>
          </div>
        </div>
      </section>

      {/* FISH TYPES SECTION */}
      <section className={styles.imageSection} id="fish">
        <div style={{textAlign: 'center', maxWidth: '800px', margin: '0 auto'}}>
          <h2 style={{fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-main)', marginBottom: '20px'}}>Поддержка ключевых видов российской аквакультуры</h2>
          <p style={{color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6}}>
            Платформа изначально спроектирована с учетом специфики разведения и восстановления трёх важнейших видов национального достояния России.
          </p>
        </div>

        <div className={styles.fishCardsGrid}>
          <div className={styles.fishCard}>
            <div className={styles.fishCardImage}>
              <Image src="/images/nerka.svg" alt="Нерка" width={220} height={100} style={{objectFit: 'contain'}} />
              <div style={{position: 'absolute', top: 10, right: 10, background: 'rgba(255,107,107,0.2)', color: '#FF6B6B', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'}}>Красная книга / Восстановление</div>
            </div>
            <div className={styles.fishCardContent}>
              <h3>Нерка (Дикий Лосось)</h3>
              <p>Особый фокус на экологические программы. Отслеживание жизненного цикла от икринки до выпуска в дикую природу с жестким контролем температуры и инфекций.</p>
            </div>
          </div>

          <div className={styles.fishCard}>
            <div className={styles.fishCardImage}>
              <Image src="/images/sturgeon.svg" alt="Русский Осётр" width={260} height={120} style={{objectFit: 'contain'}} />
              <div style={{position: 'absolute', top: 10, right: 10, background: 'rgba(156,163,175,0.2)', color: '#6B7280', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'}}>Национальное достояние</div>
            </div>
            <div className={styles.fishCardContent}>
              <h3>Русский Осётр</h3>
              <p>Контроль уникальных условий содержания реликтовых рыб. Учет биомассы, чипирование и строгий мониторинг качества воды для предотвращения потери ценного поголовья.</p>
            </div>
          </div>

          <div className={styles.fishCard}>
            <div className={styles.fishCardImage}>
              <Image src="/images/trout.svg" alt="Радужная Форель" width={200} height={90} style={{objectFit: 'contain'}} />
              <div style={{position: 'absolute', top: 10, right: 10, background: 'rgba(46,204,113,0.2)', color: '#2ECC71', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'}}>Коммерческий успех</div>
            </div>
            <div className={styles.fishCardContent}>
              <h3>Радужная Форель</h3>
              <p>Оптимизация кормления (FCR), прогнозирование роста ИИ-алгоритмами и обеспечение высокой рентабельности фермы без ущерба для экологии региона.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ECO WIDGET SECTION */}
      <section className={`${styles.imageSection} ${styles.ecoSection}`} id="eco">
        <div className={`${styles.imageGrid} ${styles.reverse}`}>
          <div className={styles.textContent}>
            <h2 style={{color: '#fff', fontSize: '2.5rem', marginBottom: '20px'}}>Прозрачность и Социальная Ответственность</h2>
            <p style={{color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '20px'}}>
              Мы верим, что бизнес должен быть открытым. С помощью встроенного <strong>Публичного Эко-Виджета</strong> ваше рыбное хозяйство может транслировать свои успехи прямо на главный сайт компании.
            </p>
            <ul style={{listStyle: 'none', padding: 0, margin: '0 0 30px', color: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <li style={{display: 'flex', alignItems: 'center', gap: '10px'}}><ShieldCheck color="#00B4D8" /> Информируйте общество о выпуске мальков</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Activity color="#00B4D8" /> Повышайте доверие покупателей и инвесторов</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Leaf color="#00B4D8" /> Легкая интеграция виджета за 1 клик</li>
            </ul>
          </div>
          <div className={styles.imageWrapper} style={{background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)'}}>
             <div style={{textAlign: 'center', color: '#fff', marginBottom: '20px', fontWeight: 'bold'}}>Пример виджета на вашем сайте</div>
             <div style={{position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(0,20,30,0.8), rgba(0,40,50,0.9))', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0, 180, 216, 0.3)'}}>
               {/* Grid pattern */}
               <div style={{
                 position: 'absolute',
                 top: 0, left: 0, right: 0, bottom: 0,
                 backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
                 pointerEvents: 'none',
                 zIndex: 0
               }} />
               <div style={{position: 'relative', zIndex: 1}}>
                 <h3 style={{fontSize: '1rem', color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}><Leaf size={16} color="#00b4d8" /> Эко-Миссия: Хозяйство "АкваРесурс"</h3>
                 <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                   <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#fff'}}>15 000 <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>шт</span></div>
                   <div style={{color: '#00b4d8', fontWeight: 'bold'}}>30.0%</div>
                 </div>
                 <div style={{width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px'}}>
                   <div style={{width: '30%', height: '100%', background: '#00b4d8', borderRadius: '10px'}}></div>
                 </div>
                 <div style={{textAlign: 'right', fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px'}}>от цели 50 000</div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* TMA SECTION */}
      <section className={styles.tmaSection} id="tma">
        <div className={styles.tmaContainer}>
          <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', background: 'rgba(42, 171, 238, 0.1)', borderRadius: '24px', marginBottom: '30px'}}>
            <Smartphone size={40} color="#2AABEE" />
          </div>
          <h2 className={styles.tmaTitle} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', flexWrap: 'wrap'}}>
            Управление фермой прямо из мессенджера
            <span style={{fontSize: '0.9rem', background: 'rgba(42, 171, 238, 0.1)', color: '#2AABEE', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid rgba(42, 171, 238, 0.3)'}}>Скоро в MAX</span>
          </h2>
          <p className={styles.tmaDesc} style={{color: 'var(--color-text-muted)'}}>
            Забудьте о необходимости скачивать приложения и обучать персонал сложным интерфейсам. Бульк! интегрируется прямо в ваш мессенджер. Рыбоводы, ихтиологи и инженеры могут отмечать выполнение задач и вносить данные прямо стоя у садка.
          </p>
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '40px'}}>
            <div style={{background: 'var(--color-bg-light)', padding: '20px 30px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontWeight: 500}}>
              <ShieldCheck color="#2AABEE" /> <span>Гибкая настройка прав доступа</span>
            </div>
            <div style={{background: 'var(--color-bg-light)', padding: '20px 30px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontWeight: 500}}>
              <BarChart3 color="#2AABEE" /> <span>Данные датчиков (IoT) в кармане</span>
            </div>
            <div style={{background: 'var(--color-bg-light)', padding: '20px 30px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontWeight: 500}}>
              <Activity color="#2AABEE" /> <span>Тревоги и уведомления 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* ECO-MISSION VIDEO SECTION */}
      <section style={{padding: '80px 20px', background: 'var(--color-bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', position: 'relative', overflow: 'hidden'}}>
        {/* Декоративный свет */}
        <div style={{position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(0, 180, 216, 0.15) 0%, transparent 60%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'}} />
        
        <div style={{maxWidth: '1000px', width: '100%', position: 'relative', zIndex: 1, textAlign: 'center'}}>
          <h2 style={{
            fontSize: '2.5rem', 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #00b4d8, #ffffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '15px'
          }}>
            Наша Экологическая Миссия
          </h2>
          <p style={{fontSize: '1.2rem', color: 'var(--color-text-muted)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: 1.6}}>
            Мы не просто выращиваем рыбу, мы заботимся о будущем наших водоемов. Посмотрите, как это работает в реальности.
          </p>
          
          <div style={{
            position: 'relative', 
            width: '100%', 
            borderRadius: '24px', 
            overflow: 'hidden', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <video 
              autoPlay 
              muted 
              loop 
              playsInline 
              controls
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '70vh',
                objectFit: 'cover'
              }}
            >
              <source src="/eco-mission.mp4" type="video/mp4" />
              Ваш браузер не поддерживает видео тег.
            </video>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'}}>
          <Image src="/logo-transparent.png" alt="Бульк!" width={150} height={50} style={{objectFit: 'contain', opacity: 0.8}} />
          <p style={{color: '#A0AAB2', fontSize: '1rem', textAlign: 'center'}}>
            © 2026 Бульк! Проект создан для развития отечественной аквакультуры.
            <br />Вместе мы делаем мир чище, а рыбоводство — умнее.
          </p>
          <div style={{marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'}}>
            <span style={{color: '#A0AAB2', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Заказчик этого кейса:</span>
            <div style={{background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', padding: '15px 40px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'}}>
              <Image src="/ministry.png" alt="Министерство" width={240} height={100} style={{objectFit: 'contain'}} />
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
