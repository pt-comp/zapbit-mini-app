import { useEffect, useState } from 'react';
import { init } from '@telegram-apps/sdk';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [error, setError] = useState(null);
  const [tonConnectUI, setTonConnectUI] = useState(null);

  useEffect(() => {
    console.log('App component mounted');

    // Проверяем, запущено ли приложение в Telegram
    if (window.Telegram?.WebApp) {
      console.log('Running inside Telegram');
      try {
        const tg = init();
        tg.ready();
        tg.expand();
        setIsTelegram(true);

        // Получаем данные пользователя
        const initData = tg.initDataUnsafe;
        console.log('Telegram initData:', initData);
        setUser(initData.user);
      } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
        setError('Ошибка инициализации Telegram');
        setUser({ first_name: 'Гость' });
      }
    } else {
      console.log('Running outside Telegram');
      setUser({ first_name: 'Гость' });
    }

    // Проверяем TON Connect
    try {
      const ui = useTonConnectUI();
      setTonConnectUI(ui[0]);
    } catch (error) {
      console.error('Ошибка инициализации TON Connect:', error);
      setError('Ошибка инициализации TON Connect');
    }
  }, []);

  const handlePlay = () => {
    alert('Переход к игре...');
  };

  const handleFriends = () => {
    alert('Переход к списку друзей...');
  };

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="container">
      <h1>ZapBit</h1>
      {user ? (
        <div>
          <div className="welcome">Привет, {user.first_name}!</div>
          <div className="welcome">Запускай...</div>
        </div>
      ) : (
        <div className="welcome">Загрузка...</div>
      )}
      <div className="ton-connect-button">
        {tonConnectUI ? <TonConnectButton /> : <p>TON Connect недоступен</p>}
      </div>
      <div className="button-group">
        <button onClick={handlePlay}>Играть</button>
        <button onClick={handleFriends}>Друзья</button>
      </div>
    </div>
  );
}

export default App;