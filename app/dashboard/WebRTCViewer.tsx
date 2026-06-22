'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function WebRTCViewer({ cageName, onClose }: { cageName: string, onClose: () => void }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Генерация кода...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionRef = useRef<any>(null);
  const startMotionDetectionRef = useRef<(() => void) | null>(null);

  // IP Camera states
  const [showIpForm, setShowIpForm] = useState(false);
  const [ipCameraUrl, setIpCameraUrl] = useState('');

  useEffect(() => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setCode(newCode);

    let pollingInterval: any;
    let animationFrameId: number;

    const initViewer = async () => {
      setStatus(`Ожидание телефона. Откройте сайт на телефоне, нажмите "Транслировать" и введите код выше.`);
      
      await fetch('/api/webrtc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', code: newCode })
      });

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('Подключено! Прямой эфир.');
          startMotionDetection();
        }
      };

      pc.onicecandidate = async (e) => {
        if (!e.candidate) {
          await fetch('/api/webrtc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'answer', code: newCode, answer: JSON.stringify(pc.localDescription) })
          });
        }
      };

      pollingInterval = setInterval(async () => {
        const res = await fetch(`/api/webrtc?code=${newCode}`);
        const data = await res.json();
        
        if (data.offer && pc.signalingState === 'stable') {
          clearInterval(pollingInterval);
          setStatus('Получен сигнал от телефона. Установка WebRTC P2P соединения...');
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.offer)));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
        }
      }, 2000);
    };

    const startMotionDetection = () => {
      startMotionDetectionRef.current = startMotionDetection;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create an offscreen canvas for 320x320 YOLOv8 input
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 320; 
      offCanvas.height = 320; 
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      let boxes: {x: number, y: number, w: number, h: number, life: number, conf: number}[] = [];
      let lastProcessTime = 0;
      let isProcessing = false;

      const processFrame = async (timestamp: number) => {
        if (video.videoWidth === 0) {
          animationFrameId = requestAnimationFrame(processFrame);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Run Neural Network at max 3-4 FPS to prevent browser lag, while drawing at 60 FPS
        if (timestamp - lastProcessTime > 300 && !isProcessing && sessionRef.current) {
          isProcessing = true;
          lastProcessTime = timestamp;
          
          try {
              offCtx.drawImage(video, 0, 0, 320, 320);
              const imgData = offCtx.getImageData(0, 0, 320, 320).data;
              const float32Data = new Float32Array(3 * 320 * 320);
              
              // Normalize and transpose to CHW
              for (let i = 0; i < 320 * 320; i++) {
                float32Data[i] = imgData[i * 4] / 255.0; // R
                float32Data[320 * 320 + i] = imgData[i * 4 + 1] / 255.0; // G
                float32Data[2 * 320 * 320 + i] = imgData[i * 4 + 2] / 255.0; // B
              }
              
              // @ts-ignore
              const inputTensor = new window.ort.Tensor('float32', float32Data, [1, 3, 320, 320]);
              const results = await sessionRef.current.run({ images: inputTensor });
              const output = results[sessionRef.current.outputNames[0]].data;
              
              let detections = [];
              for (let a = 0; a < 2100; a++) {
                const xc = output[0 * 2100 + a];
                const yc = output[1 * 2100 + a];
                const w = output[2 * 2100 + a];
                const h = output[3 * 2100 + a];
                const conf = output[4 * 2100 + a];
                
                if (conf > 0.35) {
                   detections.push({ x: xc - w/2, y: yc - h/2, w, h, conf });
                }
              }
              
              // Non-Maximum Suppression (NMS)
              detections.sort((a,b) => b.conf - a.conf);
              const finalBoxes = [];
              for(let d of detections) {
                let overlap = false;
                for(let f of finalBoxes) {
                   const ix = Math.max(d.x, f.x);
                   const iy = Math.max(d.y, f.y);
                   const iw = Math.min(d.x+d.w, f.x+f.w) - ix;
                   const ih = Math.min(d.y+d.h, f.y+f.h) - iy;
                   if(iw > 0 && ih > 0) {
                      const intersection = iw * ih;
                      const union = d.w*d.h + f.w*f.h - intersection;
                      if(intersection / union > 0.45) { overlap = true; break; }
                   }
                }
                if(!overlap) finalBoxes.push(d);
              }
              
              boxes = finalBoxes.map(b => ({
                x: (b.x / 320) * canvas.width,
                y: (b.y / 320) * canvas.height,
                w: (b.w / 320) * canvas.width,
                h: (b.h / 320) * canvas.height,
                conf: Math.round(b.conf * 100),
                life: 1.0
              }));
          } catch(e) { console.error(e); }
          
          isProcessing = false;
        }

        // Draw boxes smoothly
        boxes = boxes.filter(b => b.life > 0);
        boxes.forEach(box => {
            box.life -= 0.03; 
            
            ctx.globalAlpha = Math.max(0, box.life);
            ctx.strokeStyle = '#2ECC71';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.w, box.h);
            
            ctx.fillStyle = '#2ECC71';
            ctx.fillRect(box.x, box.y - 25, 120, 25);
            ctx.fillStyle = '#000';
            ctx.font = '14px bold sans-serif';
            ctx.fillText(`Нерка: ${box.conf}%`, box.x + 5, box.y - 8);
            
            ctx.beginPath();
            ctx.moveTo(box.x + box.w/2 - 10, box.y + box.h/2);
            ctx.lineTo(box.x + box.w/2 + 10, box.y + box.h/2);
            ctx.moveTo(box.x + box.w/2, box.y + box.h/2 - 10);
            ctx.lineTo(box.x + box.w/2, box.y + box.h/2 + 10);
            ctx.stroke();
        });
        
        ctx.globalAlpha = 1.0;

        animationFrameId = requestAnimationFrame(processFrame);
      };

      processFrame();
    };

    initViewer();

    return () => {
      clearInterval(pollingInterval);
      cancelAnimationFrame(animationFrameId);
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  const useLocalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720} } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('Подключено! Прямой эфир.');
        if (startMotionDetectionRef.current) {
          startMotionDetectionRef.current();
        }
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка доступа к камере. Убедитесь, что разрешили доступ в браузере.');
    }
  };

  const connectIpCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipCameraUrl) return;

    setStatus('Подключение к ' + ipCameraUrl + '...');
    
    setTimeout(() => {
      if (ipCameraUrl.includes('.m3u8')) {
        // Use HLS.js
        // @ts-ignore
        if (window.Hls && window.Hls.isSupported()) {
          // @ts-ignore
          const hls = new window.Hls();
          hls.loadSource(ipCameraUrl);
          if (videoRef.current) {
            hls.attachMedia(videoRef.current);
            hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
              videoRef.current?.play();
              setStatus('Подключено! Прямой эфир (HLS IP-Камера).');
              if (startMotionDetectionRef.current) startMotionDetectionRef.current();
            });
          }
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = ipCameraUrl;
          videoRef.current.addEventListener('loadedmetadata', () => {
            videoRef.current?.play();
            setStatus('Подключено! Прямой эфир (Native HLS).');
            if (startMotionDetectionRef.current) startMotionDetectionRef.current();
          });
        } else {
          alert('Ваш браузер не поддерживает HLS потоки.');
        }
      } else if (ipCameraUrl.startsWith('rtsp://')) {
        setStatus('Для RTSP требуется активный Edge Media Server (Транскодер). Запускаем резервный P2P поток...');
        setTimeout(() => {
          useLocalCamera();
        }, 2000);
      } else {
        // Direct MP4 or WebM stream
        if (videoRef.current) {
          videoRef.current.src = ipCameraUrl;
          videoRef.current.crossOrigin = "anonymous";
          videoRef.current.play().then(() => {
            setStatus('Подключено! Прямой эфир (HTTP Stream).');
            if (startMotionDetectionRef.current) startMotionDetectionRef.current();
          }).catch(err => {
            alert('Не удалось загрузить поток. Ошибка CORS или неверный формат.');
            setStatus('Ошибка подключения. Проверьте ссылку.');
          });
        }
      }
    }, 1000);
  };

  return (
    <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      {/* ONNX and HLS Scripts */}
      <Script src="https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js" strategy="lazyOnload" onLoad={() => {
        // @ts-ignore
        window.ort.InferenceSession.create('/models/sockeye.onnx', { executionProviders: ['wasm'] })
          .then((s:any) => { sessionRef.current = s; console.log("YOLOv8 ONNX Model loaded!"); })
          .catch((e:any) => console.error("Failed to load ONNX model:", e));
      }} />
      <Script src="https://cdn.jsdelivr.net/npm/hls.js@latest" strategy="lazyOnload" />
      <div style={{width: '100%', maxWidth: '800px', background: 'var(--color-bg-dark)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)'}}>
        <div style={{padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)'}}>
          <h3 style={{fontSize: '1.2rem', color: '#fff', margin: 0}}>IP-Камера (P2P): {cageName}</h3>
          <button onClick={onClose} style={{background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
        </div>
        <div style={{width: '100%', height: '450px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexDirection: 'column', position: 'relative'}}>
          
          <video ref={videoRef} autoPlay playsInline muted style={{width: '100%', height: '100%', objectFit: 'cover', display: status.includes('Подключено! Прямой эфир') ? 'block' : 'none'}}></video>
          <canvas ref={canvasRef} style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: status.includes('Подключено! Прямой эфир') ? 'block' : 'none'}}></canvas>
          
          {status !== 'Подключено! Прямой эфир.' && !status.includes('Подключено! Прямой эфир') && (
            <div style={{textAlign: 'center', padding: '20px', width: '100%'}}>
              
              {!showIpForm ? (
                <>
                  <h1 style={{fontSize: '5rem', color: 'var(--color-accent)', margin: '0 0 20px 0', letterSpacing: '8px'}}>{code}</h1>
                  <p style={{fontSize: '1.2rem', color: '#fff', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5, marginBottom: '30px'}}>{status}</p>
                  <div style={{display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap'}}>
                    <button onClick={useLocalCamera} className="btn-primary" style={{padding: '12px 24px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                      Подключить локальную веб-камеру
                    </button>
                    <button onClick={() => setShowIpForm(true)} className="btn-outline" style={{padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                      Подключить промышленную IP-камеру
                    </button>
                  </div>
                </>
              ) : (
                <div style={{maxWidth: '500px', margin: '0 auto'}}>
                  <h2 style={{color: '#fff', marginBottom: '10px'}}>Подключение IP-Камеры</h2>
                  <p style={{color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: '0.9rem'}}>Введите RTSP, HLS (.m3u8) или прямую HTTP ссылку на поток с вашей камеры.</p>
                  <form onSubmit={connectIpCamera}>
                    <input 
                      type="text" 
                      placeholder="Например: http://camera-ip/stream.m3u8 или rtsp://..." 
                      value={ipCameraUrl}
                      onChange={(e) => setIpCameraUrl(e.target.value)}
                      required
                      style={{width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.1)', color: '#fff', marginBottom: '15px'}}
                    />
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'space-between'}}>
                      <button type="button" onClick={() => setShowIpForm(false)} style={{padding: '12px 24px', background: 'transparent', color: '#fff', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer'}}>
                        Назад
                      </button>
                      <button type="submit" className="btn-primary" style={{padding: '12px 24px', border: 'none', cursor: 'pointer', flex: 1}}>
                        Установить соединение
                      </button>
                    </div>
                  </form>
                  <p style={{fontSize: '1rem', color: 'var(--color-accent)', marginTop: '20px', lineHeight: 1.5}}>{status}</p>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
