'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../login/login.module.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Успешная регистрация! Теперь вы можете войти.');
        router.push('/login');
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      alert('Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>← На главную</Link>
      <div className={styles.card}>
        <div style={{textAlign: 'center', marginBottom: '20px', display: 'flex', justifyContent: 'center'}}>
          <Link href="/" style={{textDecoration: 'none', display: 'flex', alignItems: 'center'}}>
            <Image src="/logo-transparent.png" alt="Логотип Бульк!" width={100} height={100} style={{objectFit: 'contain'}} />
          </Link>
        </div>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>Создайте профиль фермы для начала работы</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Имя / Название хозяйства</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="ООО Аквамир" />
          </div>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
          </div>
          <div className={styles.inputGroup}>
            <label>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Минимум 6 символов" minLength={6} />
          </div>
          <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '10px'}} disabled={loading}>
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </form>
        <div style={{textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--color-text-muted)'}}>
          Уже есть аккаунт? <Link href="/login" style={{color: 'var(--color-secondary)', fontWeight: 500}}>Войти</Link>
        </div>
      </div>
    </div>
  );
}
