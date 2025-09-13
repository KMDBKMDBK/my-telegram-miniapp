import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import './App.css';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyALSnrAmwh_n7AUVBHb6dXn2IxTr6KIdOA",
  authDomain: "emmabotminiapp.firebaseapp.com",
  projectId: "emmabotminiapp",
  storageBucket: "emmabotminiapp.firebasestorage.app",
  messagingSenderId: "137631803878",
  appId: "1:137631803878:web:c3a26ca067b23bdd7c4e27"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const App: React.FC = () => {
  const [messageText, setMessageText] = useState<string>('Загрузка...');
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'light');

  // Переключение темы
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Копирование текста в буфер обмена
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      WebApp.showAlert('Текст скопирован в буфер обмена!');
    } catch (err) {
      WebApp.showAlert('Ошибка при копировании текста.');
      console.error('Ошибка копирования:', err);
    }
  };

  // Закрытие мини-аппки
  const closeApp = () => {
    WebApp.close();
  };

  // Загрузка сообщения из Firestore
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get('message_id');
    const urlTelegramUserId = urlParams.get('user_id');

    if (!messageId || !urlTelegramUserId) {
      setError('ID сообщения или пользователя не указан.');
      return;
    }

    const fetchMessage = async () => {
      try {
        const userCredential = await signInAnonymously(auth);
        const firebaseUid = userCredential.user.uid;

        const user = WebApp.initDataUnsafe.user;
        const telegramUserId = user ? String(user.id) : null;

        if (!telegramUserId || telegramUserId !== urlTelegramUserId) {
          setError('Доступ к сообщению запрещён.');
          return;
        }

        const userDocRef = doc(db, 'users', firebaseUid);
        await setDoc(userDocRef, {
          telegram_id: telegramUserId,
          firebase_uid: firebaseUid
        }, { merge: true });

        const docRef = doc(db, 'messages', messageId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.user_id !== telegramUserId) {
            setError('Доступ к сообщению запрещён.');
            return;
          }
          setMessageText(data.text);
        } else {
          setError('Сообщение не найдено.');
        }
      } catch (e) {
        setError('Ошибка загрузки сообщения.');
        console.error('Ошибка:', e);
      }
    };

    fetchMessage();
  }, []);

  // Рендеринг сообщения в карточках
  const renderMessage = (text: string) => {
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    return paragraphs.map((para, index) => (
      <div key={index} className="message-card">
        <div dangerouslySetInnerHTML={{ __html: para }} />
      </div>
    ));
  };

  return (
    <div className={`app-container ${theme}`}>
      {/* Хедер */}
      <header className="header">
        <h1 className="logo">Эмма</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      {/* Основной контент */}
      <main className="main-content">
        <h2 className="main-title">Сообщение от Эммы</h2>
        {error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="message-container">
            {renderMessage(messageText)}
          </div>
        )}
      </main>

      {/* Футер с кнопками */}
      <footer className="footer">
        <button className="footer-button copy-button" onClick={copyToClipboard}>
          Копировать
        </button>
        <button className="footer-button close-button" onClick={closeApp}>
          Закрыть
        </button>
      </footer>
    </div>
  );
};

export default App;