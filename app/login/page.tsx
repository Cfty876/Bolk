'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import Link from 'next/link';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('demo@vetlog.aqua');
  const [password, setPassword] = useState('demo123');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    if (res?.ok) {
      router.push('/dashboard');
    } else {
      alert('Ошибка входа. Проверьте данные.');
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
        <h1 className={styles.title}>Вход в систему</h1>
        <p className={styles.subtitle}>Войдите для доступа к панели управления фермой</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className={styles.inputGroup}>
            <label>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '10px'}}>Войти</button>
        </form>
        <div style={{textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--color-text-muted)'}}>
          Нет аккаунта? <Link href="/register" style={{color: 'var(--color-secondary)', fontWeight: 500}}>Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}
