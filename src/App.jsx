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
  const [nickname, setNickname] = useState('');
  const [userId, setUserId] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendIdInput, setFriendIdInput] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendChoice, setFriendChoice] = useState(null);

  useEffect(() => {
    console.log('App component mounted');

    // Проверяем, есть ли сохраненные данные в localStorage
    const savedNickname = localStorage.getItem('nickname');
    const savedUserId = localStorage.getItem('userId');

    if (savedNickname && savedUserId) {
      setNickname(savedNickname);
      setUserId(savedUserId);
    }

    // Проверяем, запущено ли приложение в Telegram
    if (window.Telegram?.WebApp) {
      console.log('Running inside Telegram');
      try {
        const tg = init();
        tg.ready();
        tg.expand();
        setIsTelegram(true);

        const initData = tg.initDataUnsafe;
        console.log('Telegram initData:', initData);

        if (!savedNickname || !savedUserId) {
          // Если ник и ID не сохранены, используем данные Telegram
          const telegramUser = initData.user;
          const generatedId = `id_${telegramUser.id}_${Math.random().toString(36).substr(2, 9)}`;
          setNickname(telegramUser.first_name);
          setUserId(generatedId);
          localStorage.setItem('nickname', telegramUser.first_name);
          localStorage.setItem('userId', generatedId);
        }

        setUser(initData.user);
      } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
        setError('Ошибка инициализации Telegram');
        if (!savedNickname || !savedUserId) {
          const generatedId = `id_guest_${Math.random().toString(36).substr(2, 9)}`;
          setNickname('Гость');
          setUserId(generatedId);
          localStorage.setItem('nickname', 'Гость');
          localStorage.setItem('userId', generatedId);
        }
        setUser({ first_name: 'Гость' });
      }
    } else {
      console.log('Running outside Telegram');
      if (!savedNickname || !savedUserId) {
        const generatedId = `id_guest_${Math.random().toString(36).substr(2, 9)}`;
        setNickname('Гость');
        setUserId(generatedId);
        localStorage.setItem('nickname', 'Гость');
        localStorage.setItem('userId', generatedId);
      }
      setUser({ first_name: 'Гость' });
    }
  }, []);

  const handlePlay = () => {
    setGameState('playing');
    setResult(null);
    setSelectedFriend(null);
  };

  const handleFriends = () => {
    setGameState('friends');
    setResult(null);
  };

  const handleChoice = (choice, isFriend = false) => {
    if (isFriend) {
      setFriendChoice(choice);
      if (playerChoice) {
        determineWinner(playerChoice, choice);
      }
    } else {
      setPlayerChoice(choice);
      if (selectedFriend) {
        // Если играем против друга, ждем его выбор
        if (friendChoice) {
          determineWinner(choice, friendChoice);
        }
      } else {
        // Игра против компьютера
        const choices = ['камень', 'ножницы', 'бумага'];
        const computer = choices[Math.floor(Math.random() * 3)];
        setComputerChoice(computer);
        determineWinner(choice, computer);
      }
    }
  };

  const determineWinner = (player, opponent) => {
    if (player === opponent) {
      setResult('Ничья!');
    } else if (
      (player === 'камень' && opponent === 'ножницы') ||
      (player === 'ножницы' && opponent === 'бумага') ||
      (player === 'бумага' && opponent === 'камень')
    ) {
      setResult('Ты победил!');
    } else {
      setResult(selectedFriend ? `${selectedFriend.nickname} победил!` : 'Компьютер победил!');
    }
  };

  const handleBack = () => {
    setGameState(null);
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setFriendChoice(null);
    setSelectedFriend(null);
  };

  const handleAddFriend = () => {
    if (friendIdInput && friendIdInput !== userId) {
      // Для простоты будем хранить друзей в localStorage
      const newFriend = {
        id: friendIdInput,
        nickname: `Friend_${friendIdInput.slice(-4)}`, // Для примера, в реальном приложении нужно получать ник по ID
      };
      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);
      localStorage.setItem('friends', JSON.stringify(updatedFriends));
      setFriendIdInput('');
    } else {
      alert('Введите корректный ID друга (не свой собственный)!');
    }
  };

  const handlePlayWithFriend = (friend) => {
    setSelectedFriend(friend);
    setGameState('playing');
    setPlayerChoice(null);
    setFriendChoice(null);
    setResult(null);
  };

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>ZapBit</h1>
        <div className="profile" onClick={() => setShowProfileModal(!showProfileModal)}>
          <span>{nickname || 'Гость'}</span>
        </div>
      </div>

      {showProfileModal && (
        <div className="profile-modal">
          <h3>Профиль</h3>
          <p>Ник: {nickname}</p>
          <p>ID: {userId}</p>
          <button onClick={() => setShowProfileModal(false)}>Закрыть</button>
        </div>
      )}

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
          {selectedFriend ? (
            <div>
              <p>Игра против {selectedFriend.nickname}</p>
              <div className="choices">
                <button onClick={() => handleChoice('камень')}>Камень</button>
                <button onClick={() => handleChoice('ножницы')}>Ножницы</button>
                <button onClick={() => handleChoice('бумага')}>Бумага</button>
              </div>
              {friendChoice ? (
                <p>{selectedFriend.nickname} выбрал: {friendChoice}</p>
              ) : (
                <p>Ожидаем выбор {selectedFriend.nickname}...</p>
              )}
              {playerChoice && !friendChoice && (
                <div className="friend-choices">
                  <p>Выберите за {selectedFriend.nickname}:</p>
                  <button onClick={() => handleChoice('камень', true)}>Камень</button>
                  <button onClick={() => handleChoice('ножницы', true)}>Ножницы</button>
                  <button onClick={() => handleChoice('бумага', true)}>Бумага</button>
                </div>
              )}
            </div>
          ) : (
            <div className="choices">
              <button onClick={() => handleChoice('камень')}>Камень</button>
              <button onClick={() => handleChoice('ножницы')}>Ножницы</button>
              <button onClick={() => handleChoice('бумага')}>Бумага</button>
            </div>
          )}
          {playerChoice && computerChoice && !selectedFriend && (
            <div className="result">
              <p>Твой выбор: {playerChoice}</p>
              <p>Выбор компьютера: {computerChoice}</p>
              <p>{result}</p>
              <button onClick={handleBack}>Назад</button>
            </div>
          )}
          {playerChoice && friendChoice && selectedFriend && (
            <div className="result">
              <p>Твой выбор: {playerChoice}</p>
              <p>Выбор {selectedFriend.nickname}: {friendChoice}</p>
              <p>{result}</p>
              <button onClick={handleBack}>Назад</button>
            </div>
          )}
        </div>
      ) : gameState === 'friends' ? (
        <div className="friends">
          <h2>Друзья</h2>
          <div className="add-friend">
            <input
              type="text"
              placeholder="Введите ID друга"
              value={friendIdInput}
              onChange={(e) => setFriendIdInput(e.target.value)}
            />
            <button onClick={handleAddFriend}>Добавить</button>
          </div>
          <div className="friends-list">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div key={friend.id} className="friend-item">
                  <span>{friend.nickname} (ID: {friend.id})</span>
                  <button onClick={() => handlePlayWithFriend(friend)}>Играть</button>
                </div>
              ))
            ) : (
              <p>У вас пока нет друзей.</p>
            )}
          </div>
          <button onClick={handleBack}>Назад</button>
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