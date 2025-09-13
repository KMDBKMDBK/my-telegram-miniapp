import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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

const App: React.FC = () => {
  const [messageText, setMessageText] = useState<string>('Загрузка...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand(); // Разворачиваем мини-аппку на весь экран
    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get('message_id');

    if (!messageId) {
      setError('ID сообщения не указан.');
      return;
    }

    const fetchMessage = async () => {
      try {
        const docRef = doc(db, 'messages', messageId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMessageText(docSnap.data().text);
        } else {
          setError('Сообщение не найдено.');
        }
      } catch (e) {
        setError('Ошибка загрузки сообщения.');
        console.error(e);
      }
    };

    fetchMessage();
  }, []);

  // Разбиваем текст на абзацы по \n или длине (макс. 4096 символов)
  const renderMessage = (text: string) => {
    // Разбиваем по \n, если есть
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    if (paragraphs.length > 1) {
      return paragraphs.map((para, index) => (
        <div key={index} className="message-block" dangerouslySetInnerHTML={{ __html: para }} />
      ));
    }
    // Если нет \n, разбиваем по длине (имитация Telegram)
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