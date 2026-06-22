'use client';
import { useRef, useState, useEffect } from 'react';
import { Camera, StopCircle } from 'lucide-react';

export default function WebRTCBroadcaster({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Введите 4-значный код с экрана компьютера');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startBroadcast = async () => {
    if (code.length !== 4) {
      alert('Пожалуйста, введите 4-значный код');
      return;
    }

    try {
      setStatus('Подключение к камере (HD 60fps)...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60, min: 30 }
        }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setStatus('Генерация P2P ключей...');
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      pc.onicecandidate = async (e) => {
        if (!e.candidate) {
          setStatus('Отправка видеопотока на компьютер...');
          await fetch('/api/webrtc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'offer', code, offer: JSON.stringify(pc.localDescription) })
          });
        }
      };

      // Poll for answer
      const pollingInterval = setInterval(async () => {
        const res = await fetch(`/api/webrtc?code=${code}`);
        const data = await res.json();
        
        if (data.answer && pc.signalingState === 'have-local-offer') {
          clearInterval(pollingInterval);
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.answer)));
          setStatus('В ЭФИРЕ! Прямая P2P трансляция активна.');
          setIsBroadcasting(true);
        }
      }, 2000);

    } catch (e) {
      console.error(e);
      setStatus('Ошибка доступа к камере. Убедитесь, что разрешили доступ в браузере.');
    }
  };

  const stopBroadcast = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    onClose();
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-dark)', zIndex: 300, display: 'flex', flexDirection: 'column'}}>
      <div style={{padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)'}}>
        <h3 style={{fontSize: '1.2rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}><Camera /> Телефон как IP-Камера</h3>
        <button onClick={stopBroadcast} style={{background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
      </div>

      <div style={{flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <video ref={videoRef} autoPlay playsInline muted style={{width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, opacity: isBroadcasting ? 1 : 0.3}}></video>
        
        <div style={{position: 'relative', zIndex: 10, textAlign: 'center', padding: '20px'}}>
          <p style={{color: '#fff', fontSize: '1.1rem', marginBottom: '16px', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '20px'}}>{status}</p>
          
          {!isBroadcasting && (
            <div style={{background: 'var(--color-card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)'}}>
              <input 
                type="text" 
                placeholder="0000" 
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                style={{width: '100%', padding: '16px', fontSize: '2rem', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-bg-light)', color: 'var(--color-text-main)', marginBottom: '16px', letterSpacing: '8px'}}
              />
              <button onClick={startBroadcast} className="btn-primary" style={{width: '100%', padding: '16px', fontSize: '1.1rem', border: 'none'}}>Транслировать видео</button>
            </div>
          )}

          {isBroadcasting && (
            <div style={{position: 'absolute', top: '40vh', left: '50%', transform: 'translateX(-50%)'}}>
              <button onClick={stopBroadcast} style={{background: 'var(--color-danger)', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: '30px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(231,76,60,0.4)'}}>
                <StopCircle /> Остановить эфир
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
