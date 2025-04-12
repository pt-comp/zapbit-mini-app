import { useEffect, useState } from 'react';
import { init } from '@telegram-apps/sdk';
import './App.css';
import { db, doc, setDoc, getDoc, updateDoc, arrayUnion, realtimeDb, ref, onValue, set } from './firebase';

import rockImage from './assets/rockimage.png';
import scissorsImage from './assets/scissorsimage.png';
import paperImage from './assets/paperimage.png';

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
  const [showMenu, setShowMenu] = useState(false);
  const [activeWindow, setActiveWindow] = useState(null);
  const [newNickname, setNewNickname] = useState('');
  const [partyId, setPartyId] = useState(null);

  useEffect(() => {
    console.log('App component mounted');

    const initializeUser = async () => {
      let savedNickname = localStorage.getItem('nickname');
      let savedUserId = localStorage.getItem('userId');

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
            const telegramUser = initData.user;
            savedUserId = `id_${telegramUser.id}_${Math.random().toString(36).substr(2, 9)}`;
            savedNickname = telegramUser.first_name.slice(0, 9).replace(/[^a-zA-Z0-9]/g, '') || 'Guest';
            localStorage.setItem('nickname', savedNickname);
            localStorage.setItem('userId', savedUserId);
          }

          setNickname(savedNickname);
          setUserId(savedUserId);
          setUser(initData.user);

          // Регистрируем пользователя в Firestore
          const userRef = doc(db, 'users', savedUserId);
          await setDoc(userRef, {
            nickname: savedNickname,
            friends: [],
          }, { merge: true });

          // Загружаем список друзей из Firestore
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFriends(userData.friends || []);
          }
        } catch (error) {
          console.error('Ошибка инициализации Telegram:', error);
          setError('Ошибка инициализации Telegram');
          if (!savedNickname || !savedUserId) {
            savedUserId = `id_guest_${Math.random().toString(36).substr(2, 9)}`;
            savedNickname = 'Guest';
            localStorage.setItem('nickname', savedNickname);
            localStorage.setItem('userId', savedUserId);
          }
          setNickname(savedNickname);
          setUserId(savedUserId);
          setUser({ first_name: 'Гость' });

          const userRef = doc(db, 'users', savedUserId);
          await setDoc(userRef, {
            nickname: savedNickname,
            friends: [],
          }, { merge: true });
        }
      } else {
        console.log('Running outside Telegram');
        if (!savedNickname || !savedUserId) {
          savedUserId = `id_guest_${Math.random().toString(36).substr(2, 9)}`;
          savedNickname = 'Guest';
          localStorage.setItem('nickname', savedNickname);
          localStorage.setItem('userId', savedUserId);
        }
        setNickname(savedNickname);
        setUserId(savedUserId);
        setUser({ first_name: 'Гость' });

        const userRef = doc(db, 'users', savedUserId);
        await setDoc(userRef, {
          nickname: savedNickname,
          friends: [],
        }, { merge: true });

        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFriends(userData.friends || []);
        }
      }
    };

    initializeUser();
  }, []);

  const handlePlay = () => {
    setGameState('playing');
    setResult(null);
    setSelectedFriend(null);
    setActiveWindow(null);
    setPartyId(null);
  };

  const handleChoice = async (choice, isFriend = false) => {
    if (isFriend) {
      setFriendChoice(choice);
      if (playerChoice) {
        determineWinner(playerChoice, choice);
        // Очищаем пати после завершения игры
        await set(ref(realtimeDb, `parties/${partyId}`), null);
        setPartyId(null);
      }
    } else {
      setPlayerChoice(choice);
      if (selectedFriend && partyId) {
        // Сохраняем выбор игрока в Realtime Database
        await set(ref(realtimeDb, `parties/${partyId}/choices/${userId}`), choice);
      } else {
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

  const handleBack = async () => {
    setGameState(null);
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setFriendChoice(null);
    setSelectedFriend(null);
    if (partyId) {
      // Очищаем пати при выходе
      await set(ref(realtimeDb, `parties/${partyId}`), null);
      setPartyId(null);
    }
  };

  const handleAddFriend = async () => {
    if (friendIdInput && friendIdInput !== userId) {
      // Проверяем, существует ли пользователь с таким ID
      const friendRef = doc(db, 'users', friendIdInput);
      const friendDoc = await getDoc(friendRef);
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        const newFriend = {
          id: friendIdInput,
          nickname: friendData.nickname,
        };
        const updatedFriends = [...friends, newFriend];
        setFriends(updatedFriends);

        // Обновляем список друзей в Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          friends: arrayUnion(newFriend),
        });

        setFriendIdInput('');
      } else {
        alert('Пользователь с таким ID не найден!');
      }
    } else {
      alert('Введите корректный ID друга (не свой собственный)!');
    }
  };

  const handlePlayWithFriend = async (friend) => {
    setSelectedFriend(friend);
    setGameState('playing');
    setPlayerChoice(null);
    setFriendChoice(null);
    setResult(null);
    setActiveWindow(null);

    // Создаём пати в Realtime Database
    const newPartyId = `${userId}_${friend.id}_${Date.now()}`;
    await set(ref(realtimeDb, `parties/${newPartyId}`), {
      players: [userId, friend.id],
      choices: {},
      status: 'waiting',
    });
    setPartyId(newPartyId);

    // Слушаем изменения в пати
    const partyRef = ref(realtimeDb, `parties/${newPartyId}`);
    onValue(partyRef, (snapshot) => {
      const partyData = snapshot.val();
      if (partyData) {
        const choices = partyData.choices || {};
        const opponentId = friend.id;
        if (choices[userId] && choices[opponentId]) {
          setPlayerChoice(choices[userId]);
          setFriendChoice(choices[opponentId]);
          determineWinner(choices[userId], choices[opponentId]);
          // Очищаем пати после завершения игры
          set(ref(realtimeDb, `parties/${newPartyId}`), null);
          setPartyId(null);
        }
      } else {
        // Пати удалена (например, другой игрок вышел)
        setResult('Игра отменена: противник вышел.');
        setGameState(null);
        setPlayerChoice(null);
        setFriendChoice(null);
        setSelectedFriend(null);
        setPartyId(null);
      }
    });
  };

  const handleMenuClick = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuOption = (option) => {
    setActiveWindow(option);
    setShowMenu(false);
    setGameState(null);
  };

  const handleNicknameChange = () => {
    const trimmedNickname = newNickname.trim();
    if (trimmedNickname.length > 9) {
      alert('Никнейм не должен превышать 9 символов!');
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(trimmedNickname)) {
      alert('Никнейм может содержать только буквы и цифры!');
      return;
    }
    if (trimmedNickname) {
      setNickname(trimmedNickname);
      localStorage.setItem('nickname', trimmedNickname);
      // Обновляем никнейм в Firestore
      const userRef = doc(db, 'users', userId);
      setDoc(userRef, { nickname: trimmedNickname }, { merge: true });
      setNewNickname('');
      setActiveWindow(null);
    } else {
      alert('Введите корректный никнейм!');
    }
  };

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="app-wrapper">
      <div className="navbar">
        <div className="menu" onClick={handleMenuClick}>
          <span>☰</span>
        </div>
        <h1 className="logo">ZapBit</h1>
        <div className="profile" onClick={() => setShowProfileModal(!showProfileModal)}>
          <span>{nickname || 'Гость'}</span>
        </div>
      </div>

      {showMenu && (
        <div className="menu-modal">
          <button onClick={() => handleMenuOption('friends')}>Друзья</button>
          <button onClick={() => handleMenuOption('nickname')}>Никнейм</button>
          <button onClick={() => handleMenuOption('settings')}>Настройки</button>
        </div>
      )}

      {showProfileModal && (
        <div className="profile-modal">
          <h3>Профиль</h3>
          <p>Ник: {nickname}</p>
          <p>ID: {userId}</p>
          <button onClick={() => setShowProfileModal(false)}>Закрыть</button>
        </div>
      )}

      <div className="main-content">
        {activeWindow === 'friends' ? (
          <div className="window friends-window">
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
            <button onClick={() => setActiveWindow(null)}>Закрыть</button>
          </div>
        ) : activeWindow === 'nickname' ? (
          <div className="window nickname-window">
            <h2>Изменить никнейм</h2>
            <input
              type="text"
              placeholder="Введите новый никнейм"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
            />
            <button onClick={handleNicknameChange}>Сохранить</button>
            <button onClick={() => setActiveWindow(null)}>Закрыть</button>
          </div>
        ) : activeWindow === 'settings' ? (
          <div className="window settings-window">
            <h2>Настройки</h2>
            <p>Здесь будут настройки (в разработке).</p>
            <button onClick={() => setActiveWindow(null)}>Закрыть</button>
          </div>
        ) : gameState === 'playing' ? (
          <div className="game">
            <h2>Камень-Ножницы-Бумага</h2>
            {selectedFriend ? (
              <div>
                <p>Игра против {selectedFriend.nickname}</p>
                <div className="choices">
                  <button onClick={() => handleChoice('камень')}>
                    <img src={rockImage} alt="Камень" />
                  </button>
                  <button onClick={() => handleChoice('ножницы')}>
                    <img src={scissorsImage} alt="Ножницы" />
                  </button>
                  <button onClick={() => handleChoice('бумага')}>
                    <img src={paperImage} alt="Бумага" />
                  </button>
                </div>
                {friendChoice ? (
                  <p>{selectedFriend.nickname} выбрал: {friendChoice}</p>
                ) : (
                  <p>Ожидаем выбор {selectedFriend.nickname}...</p>
                )}
              </div>
            ) : (
              <div className="choices">
                <button onClick={() => handleChoice('камень')}>
                  <img src={rockImage} alt="Камень" />
                </button>
                <button onClick={() => handleChoice('ножницы')}>
                  <img src={scissorsImage} alt="Ножницы" />
                </button>
                <button onClick={() => handleChoice('бумага')}>
                  <img src={paperImage} alt="Бумага" />
                </button>
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
        ) : (
          <div className="welcome-section">
            {user ? (
              <div>
                <div className="welcome">Привет, {nickname}!</div>
                <div className="welcome">Запускай...</div>
              </div>
            ) : (
              <div className="welcome">Загрузка...</div>
            )}
            <div className="button-group">
              <button onClick={handlePlay}>Играть</button>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <p>Связаться с нами: <a href="mailto:support@zapbit.com">support@zapbit.com</a></p>
        <p>© 2025 ZapBit. Все права защищены.</p>
      </div>
    </div>
  );
}

export default App;