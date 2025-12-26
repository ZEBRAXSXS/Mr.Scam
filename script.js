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
    username = user.username ? user.username : (user.first_name || 'User'); // Без @
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

  tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
      const addr = wallet.account.address;
      document.getElementById('wallet-address').textContent = addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
    } else {
      document.getElementById('wallet-address').textContent = 'Not connected';
    }
  });

  // Оплаты (как раньше)
  // ... (оставляем код оплаты TON и Stars из предыдущей версии)

  // Навигация по разделам
  const sections = {
    'profile-btn': 'profile-section',
    'market-btn': 'play-section',
    'events-btn': 'staking-section',
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

  // Меню и рефералка (как раньше)
  // ...
});
