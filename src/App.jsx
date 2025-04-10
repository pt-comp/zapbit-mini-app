import { useEffect, useState } from 'react';
import { init } from '@telegram-apps/sdk';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [error, setError] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState(null);

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
  }, []);

  const handlePlay = () => {
    setGameState('playing');
    setResult(null);
  };

  const handleFriends = () => {
    alert('Переход к списку друзей...');
  };

  const handleChoice = (choice) => {
    setPlayerChoice(choice);
    const choices = ['камень', 'ножницы', 'бумага'];
    const computer = choices[Math.floor(Math.random() * 3)];
    setComputerChoice(computer);

    // Определяем победителя
    if (choice === computer) {
      setResult('Ничья!');
    } else if (
      (choice === 'камень' && computer === 'ножницы') ||
      (choice === 'ножницы' && computer === 'бумага') ||
      (choice === 'бумага' && computer === 'камень')
    ) {
      setResult('Ты победил!');
    } else {
      setResult('Компьютер победил!');
    }
  };

  const handleBack = () => {
    setGameState(null);
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
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

      {gameState === 'playing' ? (
        <div className="game">
          <h2>Камень-Ножницы-Бумага</h2>
          <div className="choices">
            <button onClick={() => handleChoice('камень')}>Камень</button>
            <button onClick={() => handleChoice('ножницы')}>Ножницы</button>
            <button onClick={() => handleChoice('бумага')}>Бумага</button>
          </div>
          {playerChoice && computerChoice && (
            <div className="result">
              <p>Твой выбор: {playerChoice}</p>
              <p>Выбор компьютера: {computerChoice}</p>
              <p>{result}</p>
              <button onClick={handleBack}>Назад</button>
            </div>
          )}
        </div>
      ) : (
        <div className="button-group">
          <button onClick={handlePlay}>Играть</button>
          <button onClick={handleFriends}>Друзья</button>
        </div>
      )}
    </div>
  );
}

export default App;