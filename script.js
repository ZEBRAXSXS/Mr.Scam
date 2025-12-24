window.addEventListener('load', () => {
  // Ждём 1 секунду, чтобы Telegram.WebApp точно загрузился
  setTimeout(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg || !tg.initDataUnsafe || tg.initDataUnsafe === {}) {
      // Не в Telegram — редирект на бота
      window.location.href = "https://t.me/MrScam_bot";
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
          twaReturnUrl: 'https://t.me/MrScam_bot'  // ← Твой бот
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
  }, 1000); // 1 секунда задержки
});
