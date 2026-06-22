'use client';

import { useState, useEffect, useRef } from 'react';

export default function VideoIntro() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [userName, setUserName] = useState('');
  const [shouldRender, setShouldRender] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Проверяем, отключено ли видео в настройках
    const disabled = localStorage.getItem('disableIntroVideo');
    
    if (disabled === 'true') {
      setIsVisible(false);
    } else {
      setShouldRender(true);
      // Пытаемся получить имя пользователя
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (data?.user?.name) {
            setUserName(data.user.name);
          } else {
             // Fallback если имени нет
             setUserName('Пользователь');
          }
        })
        .catch(() => setUserName('Пользователь'));
    }
  }, []);

  const handleVideoEnd = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 1000); // время CSS-анимации затухания
  };

  if (!isVisible || !shouldRender) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: '#0b192c',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 1s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <video 
        ref={videoRef}
        autoPlay 
        muted 
        playsInline 
        onEnded={handleVideoEnd}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'translate(-50%, -50%)',
          zIndex: 1
        }}
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>
      
      {/* Затемняющий оверлей для читаемости текста */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(11, 25, 44, 0.4)',
        zIndex: 2
      }} />

      <div style={{
        position: 'absolute',
        bottom: '40px',
        right: '50px',
        zIndex: 3,
        textAlign: 'right',
        animation: 'textFadeIn 2s ease-out forwards',
        textShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        {userName && (
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '1px'
          }}>
            Добрый день, <br /><span style={{ color: '#00b4d8' }}>{userName}</span>!
          </h1>
        )}
      </div>

      <style jsx global>{`
        @keyframes textFadeIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
