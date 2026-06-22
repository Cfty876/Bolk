'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './layout.module.css';
import { useState, useEffect, useRef } from 'react';
import { Home, Droplets, Fish, BarChart3, RadioReceiver, BookOpen, FileText, Settings, Search, Bell, Sun, Moon, Brain, CalendarDays, Loader2 } from 'lucide-react';
import { getAlerts, resolveAlert, getUserSettings, globalSearch } from '../actions';
import VideoIntro from '../components/VideoIntro';

const MENU_ITEMS = [
  { name: 'Главная', path: '/dashboard', icon: <Home size={20} /> },
  { name: 'Садки', path: '/dashboard/cages', icon: <Droplets size={20} /> },
  { name: 'Рыба', path: '/dashboard/fish', icon: <Fish size={20} /> },
  { name: 'Аналитика', path: '/dashboard/analytics', icon: <BarChart3 size={20} /> },
  { name: 'Датчики', path: '/dashboard/sensors', icon: <RadioReceiver size={20} /> },
  { name: 'Журнал', path: '/dashboard/journal', icon: <BookOpen size={20} /> },
  { name: 'Отчёты', path: '/dashboard/reports', icon: <FileText size={20} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState('light');
  const [session, setSession] = useState<{user?: {name?: string, email?: string}} | null>(null);
  const [dbName, setDbName] = useState<string | null>(null);
  const [isTmaEnabled, setIsTmaEnabled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const loadAlerts = async () => {
    const data = await getAlerts();
    setAlerts(data);
  };

  const handleResolveAlert = async (id: string) => {
    await resolveAlert(id);
    await loadAlerts();
  };

  useEffect(() => {
    loadAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/auth/session').then(res => res.json()).then(data => {
      if(Object.keys(data).length > 0) setSession(data);
    });
  }, []);

  useEffect(() => {
    const fetchDbName = async () => {
      if (session?.user?.email) {
        const settings = await getUserSettings(session.user.email);
        if (settings?.name) setDbName(settings.name);
        if (settings?.isTmaEnabled !== undefined) setIsTmaEnabled(settings.isTmaEnabled);
      }
    };
    fetchDbName();

    window.addEventListener('user-settings-updated', fetchDbName);
    return () => window.removeEventListener('user-settings-updated', fetchDbName);
  }, [session?.user?.email]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Search logic
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await globalSearch(searchQuery);
          setSearchResults(results);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults(null);
        setSearchQuery('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchResultClick = (path: string) => {
    setSearchResults(null);
    setSearchQuery('');
    router.push(path);
  };

  const toggleTheme = () => {
    document.body.classList.add('theme-transition');
    setTheme(theme === 'light' ? 'dark' : 'light');
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 400);
  };

  return (
    <div className={styles.container}>
      <VideoIntro />
      <aside className={styles.sidebar}>
        <Link href="/" style={{textDecoration: 'none'}}>
          <div className={styles.logo} style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
            <img src="/logo-transparent.png" alt="Бульк Logo" style={{height: '72px', objectFit: 'contain'}} />
            <span className={styles.brandName}>Бульк!</span>
          </div>
        </Link>
        <nav className={styles.nav}>
          {MENU_ITEMS.map(item => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
            >
              <span className={styles.navIcon} style={{display: 'flex', alignItems: 'center'}}>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
          <div style={{marginTop: 'auto', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--color-border)'}}>
            <span style={{color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center'}}>Заказчик этого кейса:</span>
            <div style={{background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '180px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
              <img src="/ministry.png" alt="Министерство" style={{width: '100%', objectFit: 'contain', filter: 'grayscale(100%) opacity(80%)', transition: 'all 0.3s'}} onMouseOver={e => e.currentTarget.style.filter = 'none'} onMouseOut={e => e.currentTarget.style.filter = 'grayscale(100%) opacity(80%)'} />
            </div>
          </div>
        </aside>
        
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.search} ref={searchRef} style={{position: 'relative'}}>
            {isSearching ? <Loader2 size={18} className="animate-spin" color="var(--color-primary)" style={{marginRight: '10px'}} /> : <Search size={18} color="var(--color-text-muted)" style={{marginRight: '10px'}} />}
            <input 
              type="text" 
              placeholder="Глобальный поиск (садки, рыба, журналы)..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Search Dropdown */}
            {searchResults && (searchQuery.trim().length >= 2) && (
              <div className={styles.searchDropdown}>
                {searchResults.pages.length === 0 && searchResults.cages.length === 0 && searchResults.fishes.length === 0 && searchResults.journals.length === 0 && (
                  <div style={{padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)'}}>Ничего не найдено</div>
                )}
                
                {searchResults.pages.length > 0 && (
                  <>
                    <div className={styles.searchSection}>Страницы</div>
                    {searchResults.pages.map((p: any, i: number) => (
                      <div key={i} className={styles.searchItem} onClick={() => handleSearchResultClick(p.path)}>
                        <Home size={16} color="var(--color-primary)" />
                        <div className={styles.searchItemTitle}>{p.name}</div>
                      </div>
                    ))}
                  </>
                )}

                {searchResults.cages.length > 0 && (
                  <>
                    <div className={styles.searchSection}>Садки</div>
                    {searchResults.cages.map((c: any) => (
                      <div key={c.id} className={styles.searchItem} onClick={() => handleSearchResultClick('/dashboard/cages')}>
                        <Droplets size={16} color="var(--color-secondary)" />
                        <div>
                          <div className={styles.searchItemTitle}>{c.name}</div>
                          <div className={styles.searchItemSubtitle}>Статус: {c.status}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {searchResults.fishes.length > 0 && (
                  <>
                    <div className={styles.searchSection}>Партии рыб</div>
                    {searchResults.fishes.map((f: any) => (
                      <div key={f.id} className={styles.searchItem} onClick={() => handleSearchResultClick('/dashboard/fish')}>
                        <Fish size={16} color="var(--color-accent)" />
                        <div>
                          <div className={styles.searchItemTitle}>{f.species}</div>
                          <div className={styles.searchItemSubtitle}>Кол-во: {f.quantity} шт. | Садок: {f.cage.name}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {searchResults.journals.length > 0 && (
                  <>
                    <div className={styles.searchSection}>Записи в журнале</div>
                    {searchResults.journals.map((j: any) => (
                      <div key={j.id} className={styles.searchItem} onClick={() => handleSearchResultClick('/dashboard/journal')}>
                        <BookOpen size={16} color="var(--color-warning)" />
                        <div>
                          <div className={styles.searchItemTitle}>{j.title}</div>
                          <div className={styles.searchItemSubtitle}>Тип: {j.type}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          <div className={styles.topActions}>
            <button onClick={toggleTheme} title="Переключить тему" style={{display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)'}}>
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            <div style={{position: 'relative'}}>
              <div 
                style={{cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', position: 'relative'}}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={22} />
                {alerts.length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px', 
                    background: 'var(--color-danger)', color: 'white', 
                    fontSize: '10px', width: '16px', height: '16px', 
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {alerts.length}
                  </span>
                )}
              </div>
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '35px', right: '-10px', 
                  background: 'var(--glass-bg, var(--color-card-bg))', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
                  border: '1px solid var(--glass-border, var(--color-border))', padding: '16px', borderRadius: '12px',
                  width: '300px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 50,
                  maxHeight: '400px', overflowY: 'auto'
                }}>
                  <h4 style={{marginBottom: '10px', fontSize: '0.95rem', color: 'var(--color-text-main)', display: 'flex', justifyContent: 'space-between'}}>
                    Уведомления
                    {alerts.length > 0 && <span style={{color: 'var(--color-danger)', fontSize: '0.8rem'}}>{alerts.length} новых</span>}
                  </h4>
                  {alerts.length === 0 ? (
                    <p style={{fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4'}}>
                      У вас пока нет новых уведомлений.
                    </p>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      {alerts.map((alert: any) => (
                        <div key={alert.id} style={{
                          background: alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? 'var(--color-danger)' : 'var(--color-warning, #f59e0b)'}`,
                          padding: '10px', borderRadius: '4px', fontSize: '0.85rem'
                        }}>
                          <p style={{margin: '0 0 5px 0', color: 'var(--color-text-main)'}}>{alert.message}</p>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{fontSize: '0.7rem', color: 'var(--color-text-muted)'}}>{new Date(alert.createdAt).toLocaleString('ru-RU')}</span>
                            <button onClick={() => handleResolveAlert(alert.id)} style={{
                              background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.75rem', padding: 0
                            }}>Отметить</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link href="/dashboard/settings" style={{textDecoration: 'none'}}>
              <div 
                className={styles.avatarWrapper} 
                title={isTmaEnabled ? "Мини-приложение подключено" : "Настройки профиля"}
              >
                {isTmaEnabled && (
                  <div style={{ position: 'absolute', top: '-5px', left: '-5px', right: '-5px', bottom: '-5px', border: '2px solid var(--color-secondary)', borderRadius: '50%' }} />
                )}
                <div className={styles.avatarInner}>
                  <div className={styles.avatarFront}>
                    {dbName ? dbName.charAt(0).toUpperCase() : (session?.user?.name ? session.user.name.charAt(0).toUpperCase() : (session?.user?.email ? session.user.email.charAt(0).toUpperCase() : 'U'))}
                  </div>
                  <div className={styles.avatarBack}>
                    <Settings size={20} color="#ffffff" style={{animation: 'spin 4s linear infinite'}} />
                  </div>
                </div>
                <div className={styles.avatarTooltip}>Настройки профиля</div>
              </div>
            </Link>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
