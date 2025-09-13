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
        // Анонимная аутентификация
        const userCredential = await signInAnonymously(auth);
        const firebaseUid = userCredential.user.uid;

        // Получаем Telegram ID из WebApp
        const user = WebApp.initDataUnsafe.user;
        const telegramUserId = user ? String(user.id) : null;

        if (!telegramUserId || telegramUserId !== urlTelegramUserId) {
          setError('Доступ к сообщению запрещён.');
          return;
        }

        // Создаём/обновляем документ в коллекции users для связи Telegram ID и Firebase UID
        const userDocRef = doc(db, 'users', firebaseUid);
        await setDoc(userDocRef, {
          telegram_id: telegramUserId,
          firebase_uid: firebaseUid
        }, { merge: true });

        // Читаем сообщение
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

  // Разбиваем текст на абзацы
  const renderMessage = (text: string) => {
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    if (paragraphs.length > 1) {
      return paragraphs.map((para, index) => (
        <div key={index} className="message-block" dangerouslySetInnerHTML={{ __html: para }} />
      ));
    }
    const maxLength = 4096;
    const blocks = [];
    for (let i = 0; i < text.length; i += maxLength) {
      blocks.push(text.slice(i, i + maxLength));
    }
    return blocks.map((block, index) => (
      <div key={index} className="message-block" dangerouslySetInnerHTML={{ __html: block }} />
    ));
  };

  return (
    <div className="container">
      <h1>Сообщение от Эммы</h1>
      {error ? (
        <p>{error}</p>
      ) : (
        <div className="message-container">
          {renderMessage(messageText)}
        </div>
      )}
    </div>
  );
};

export default App;