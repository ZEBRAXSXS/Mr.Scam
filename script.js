window.addEventListener('load', () => {
  const tg = window.Telegram.WebApp;

  if (!tg.initDataUnsafe || !tg.initData) {
    document.getElementById('app').style.display = 'none';
    document.getElementById('blocked').style.display = 'block';
    return;
  }

  tg.expand();
  tg.ready();

  const mainContent = document.getElementById('main-content');

  // HTML шаблоны разделов
  const sections = {
    profile: `
      <div class="profile-card">
        <div class="profile-info">
          <img id="user-avatar" src="" class="avatar">
          <div class="user-details">
            <div id="username" class="username">Загрузка...</div>
            <div id="wallet-address" class="wallet-address">Not connected</div>
          </div>
        </div>
        <div id="connect-container">Connect</div>
      </div>

      <div class="payments">
        <button id="payment-btn" class="green-btn">💸 Внести TON</button>
        <button id="pay-stars-btn" class="green-btn">⭐ Поддержать Stars</button>
      </div>

      <div class="profile-tabs">
        <div class="profile-tab active" data-tab="stickers-tab">Стикеры</div>
        <div class="profile-tab" data-tab="gifts-tab">Подарки</div>
      </div>

      <div id="stickers-tab" class="profile-tab-content active">
        <lottie-player src="/stickers/2_5361597813799030874.tgs" background="transparent" speed="1" style="width:180px; height:180px; margin:20px auto;" loop autoplay></lottie-player>
        <p>Ваши стикеры 😈</p>
      </div>

      <div id="gifts-tab" class="profile-tab-content">
        <lottie-player src="/stickers/2_5361597813799030875.tgs" background="transparent" speed="1" style="width:180px; height:180px; margin:20px auto;" loop autoplay></lottie-player>
        <p>Ваши подарки 😈</p>
      </div>

      <div class="transactions">
        <div class="transactions-title">История транзакций</div>
        <div class="transaction-item"><span>+0.3 TON</span><span>27.12.2025</span></div>
        <div class="transaction-item"><span>+1 Star</span><span>27.12.2025</span></div>
        <div class="transaction-item"><span>Нет транзакций</span><span>-</span></div>
      </div>
    `,

    play: `
      <lottie-player src="/stickers/2_5361597813799030878.tgs" background="transparent" speed="1" class="section-sticker" loop autoplay></lottie-player>
      <p class="section-text">Здесь идёт разработка 😈</p>
    `,

    staking: `
      <lottie-player src="/stickers/2_5361597813799030884.tgs" background="transparent" speed="1" class="section-sticker" loop autoplay></lottie-player>
      <p class="section-text">Здесь идёт разработка 😈</p>
    `,

    tasks: `
      <lottie-player src="/stickers/2_5361597813799030886.tgs" background="transparent" speed="1" class="section-sticker" loop autoplay></lottie-player>
      <p class="section-text">Здесь идёт разработка 😈</p>
    `
  };

  // Загрузка профиля по умолчанию
  mainContent.innerHTML = sections.profile;

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

  // TonConnect (остаётся как есть)
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
    buttonRootId: 'connect-container',
    actionsConfiguration: { twaReturnUrl: 'https://t.me/mrscam_test_bot' }
  });

  let connectedWallet = null;
  tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
      connectedWallet = wallet.account.address;
      const cleanAddr = connectedWallet.replace(/[^a-zA-Z0-9]/g, '');
      document.getElementById('wallet-address').textContent = cleanAddr.substring(0, 6) + '...' + cleanAddr.substring(cleanAddr.length - 4);
    } else {
      connectedWallet = null;
      document.getElementById('wallet-address').textContent = 'Not connected';
    }
  });

  // Переключение разделов
  const navMap = {
    'market-btn': 'play',
    'events-btn': 'staking',
    'profile-btn': 'profile',
    'giveaway-btn': 'tasks'
  };

  Object.keys(navMap).forEach(id => {
    document.getElementById(id).onclick = () => {
      mainContent.innerHTML = sections[navMap[id]];
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById(id).classList.add('active');

      // Если перешли в профиль — инициализируем табы
      if (navMap[id] === 'profile') {
        setTimeout(() => {
          document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.onclick = () => {
              document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
              tab.classList.add('active');
              document.getElementById(tab.dataset.tab).classList.add('active');
            };
          });
        }, 100);
      }
    };
  });

  // Модальные окна и оплаты (как раньше)
  // ... (вставь сюда код модальных и оплаты из предыдущей версии)

});
