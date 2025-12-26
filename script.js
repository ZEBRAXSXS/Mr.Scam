window.addEventListener('load', () => {
  let attempts = 0;
  const maxAttempts = 10;

  const checkTelegram = () => {
    const tg = window.Telegram?.WebApp;

    attempts++;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      // В Telegram — запускаем приложение
      document.getElementById('blocked').style.display = 'none';
      document.getElementById('app').style.display = 'block';

      tg.expand();
      tg.ready();

      const usernameEl = document.getElementById('username');
      const user = tg.initDataUnsafe.user;
      const username = user.username ? '@' + user.username : user.first_name || 'User';
      usernameEl.textContent = username;

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
            amount: '1000000000'
          }]
        };

        try {
          await tonConnectUI.sendTransaction(transaction);
          alert('✅ 1 TON успешно внесено!');
        } catch (e) {
          alert('❌ Ошибка или отменено');
        }
      };
    } else if (attempts < maxAttempts) {
      // Ждём и пробуем снова
      setTimeout(checkTelegram, 500);
    } else {
      // Не удалось — показываем блокировку
      document.getElementById('app').style.display = 'none';
      document.getElementById('blocked').style.display = 'block';
    }
  };

  checkTelegram();
});
