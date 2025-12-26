window.addEventListener('load', () => {
  const tg = window.Telegram.WebApp;

  if (!tg.initDataUnsafe || !tg.initData) {
    document.getElementById('app').style.display = 'none';
    document.getElementById('blocked').style.display = 'block';
    return;
  }

  tg.expand();
  tg.ready();

  // Аватар и имя
  let username = 'Guest';
  let avatarUrl = '';
  if (tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    username = user.username ? user.username : (user.first_name || 'User');
    if (user.photo_url) avatarUrl = user.photo_url;
  }
  document.getElementById('username').textContent = username;
  if (avatarUrl) document.getElementById('user-avatar').src = avatarUrl;

  // TonConnect
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
    buttonRootId: 'connect-container',
    actionsConfiguration: { twaReturnUrl: 'https://t.me/mrscam_test_bot' }
  });

  // Рендерим кнопку без лишнего текста
  tonConnectUI.renderButton({
    containerId: 'connect-container'
  });

  let connectedWallet = null;
  tonConnectUI.onStatusChange(wallet => {
    const dot = document.getElementById('status-dot');
    const lottie = document.getElementById('wallet-lottie');
    const container = document.getElementById('connect-container');

    if (wallet) {
      connectedWallet = wallet.account.address;
      if (dot) {
        dot.classList.remove('status-off');
        dot.classList.add('status-on');
      }
      if (lottie) {
        lottie.classList.add('connected');
      }
      if (container) {
        container.classList.add('connected');
      }
    } else {
      connectedWallet = null;
      if (dot) {
        dot.classList.remove('status-on');
        dot.classList.add('status-off');
      }
      if (lottie) {
        lottie.classList.remove('connected');
      }
      if (container) {
        container.classList.remove('connected');
      }
    }
  });

  // Оплата TON
  document.getElementById('payment-btn').onclick = async () => {
    if (!connectedWallet) {
      alert('⚠️ Подключите кошелёк сначала!');
      return;
    }

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: 'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD',
        amount: '300000000'
      }]
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      alert('✅ 0.3 TON успешно внесено!');
      document.getElementById('ton-balance').textContent = (parseFloat(document.getElementById('ton-balance').textContent) + 0.3).toFixed(2);
    } catch (e) {
      alert('❌ Транзакция отменена или ошибка');
    }
  };

  // Оплата Stars
  document.getElementById('pay-stars-btn').onclick = () => {
    fetch('https://mr-scam.vercel.app/api/create-stars-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Поддержка разработчику',
        description: '1 Telegram Star для Mr. Scam Game',
        payload: 'stars_support_1',
        amount: 1
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.invoice_link) {
        tg.openInvoice(data.invoice_link, (status) => {
          if (status === 'paid') {
            alert('✅ Спасибо огромное за поддержку! ❤️');
            document.getElementById('stars-balance').textContent = parseInt(document.getElementById('stars-balance').textContent) + 1;
          }
        });
      } else {
        alert('❌ Ошибка создания инвойса');
      }
    })
    .catch(e => alert('❌ Ошибка: ' + e.message));
  };

  // Переключение табов в профиле (Стикеры / Подарки)
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    };
  });

  // Навигация по разделам
  const sections = {
    'market-btn': 'play-section',
    'events-btn': 'staking-section',
    'profile-btn': 'profile-section',
    'giveaway-btn': 'tasks-section'
  };

  Object.keys(sections).forEach(id => {
    document.getElementById(id).onclick = () => {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById(sections[id]).classList.add('active');
      document.getElementById(id).classList.add('active');
    };
  });

  tg.onEvent('invoiceClosed', (event) => {
    if (event.status === 'paid') {
      alert('✅ Спасибо огромное за поддержку! ❤️');
      document.getElementById('stars-balance').textContent = parseInt(document.getElementById('stars-balance').textContent) + 1;
    }
  });
});
