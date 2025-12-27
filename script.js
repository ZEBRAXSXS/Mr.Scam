window.addEventListener('load', () => {
  const tg = window.Telegram.WebApp;

  if (!tg.initDataUnsafe || !tg.initData) {
    const app = document.getElementById('app');
    const blocked = document.getElementById('blocked');
    if (app && blocked) {
      app.style.display = 'none';
      blocked.style.display = 'block';
    }
    return;
  }

  tg.expand();
  tg.ready();

  // Аватар и имя пользователя
  let username = 'Guest';
  let avatarUrl = '';
  if (tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    username = user.username ? user.username : (user.first_name || 'User');
    if (user.photo_url) avatarUrl = user.photo_url;
  }
  const usernameEl = document.getElementById('username');
  const avatarEl = document.getElementById('user-avatar');
  if (usernameEl) usernameEl.textContent = username;
  if (avatarEl && avatarUrl) avatarEl.src = avatarUrl;

  // TonConnect
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
    buttonRootId: 'connect-container',
    actionsConfiguration: {
      twaReturnUrl: 'https://t.me/mrscam_test_bot'
    }
  });

  let connectedWallet = null;
  tonConnectUI.onStatusChange(wallet => {
    const walletAddressEl = document.getElementById('wallet-address');
    if (!walletAddressEl) return;

    if (wallet) {
      connectedWallet = wallet.account.address;
      const cleanAddr = connectedWallet.replace(/[^a-zA-Z0-9]/g, '');
      const shortAddr = cleanAddr.substring(0, 6) + '...' + cleanAddr.substring(cleanAddr.length - 4);
      walletAddressEl.textContent = shortAddr;
    } else {
      connectedWallet = null;
      walletAddressEl.textContent = 'Not connected';
    }
  });

  // Оплата TON
  const paymentBtn = document.getElementById('payment-btn');
  if (paymentBtn) {
    paymentBtn.onclick = async () => {
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
        const tonBalanceEl = document.getElementById('ton-balance');
        const mrscamBalanceEl = document.getElementById('mrscam-balance');
        if (tonBalanceEl) tonBalanceEl.textContent = (parseFloat(tonBalanceEl.textContent) + 0.3).toFixed(2);
        if (mrscamBalanceEl) mrscamBalanceEl.textContent = (parseFloat(mrscamBalanceEl.textContent) + 10).toFixed(2); // +10 Mr.Scam Token
      } catch (e) {
        alert('❌ Транзакция отменена или ошибка');
      }
    };
  }

  // Оплата Stars
  const payStarsBtn = document.getElementById('pay-stars-btn');
  if (payStarsBtn) {
    payStarsBtn.onclick = () => {
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
              const starsBalanceEl = document.getElementById('stars-balance');
              const mrscamBalanceEl = document.getElementById('mrscam-balance');
              if (starsBalanceEl) starsBalanceEl.textContent = parseInt(starsBalanceEl.textContent) + 1;
              if (mrscamBalanceEl) mrscamBalanceEl.textContent = (parseFloat(mrscamBalanceEl.textContent) + 5).toFixed(2); // +5 Mr.Scam Token
            }
          });
        } else {
          alert('❌ Ошибка создания инвойса');
        }
      })
      .catch(e => alert('❌ Ошибка: ' + e.message));
    };
  }

  // Переключение табов в профиле
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById(tab.dataset.tab);
      if (content) content.classList.add('active');
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
    const btn = document.getElementById(id);
    if (btn) {
      btn.onclick = () => {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const section = document.getElementById(sections[id]);
        if (section) section.classList.add('active');
        btn.classList.add('active');
      };
    }
  });

  tg.onEvent('invoiceClosed', (event) => {
    if (event.status === 'paid') {
      alert('✅ Спасибо огромное за поддержку! ❤️');
      const starsBalanceEl = document.getElementById('stars-balance');
      const mrscamBalanceEl = document.getElementById('mrscam-balance');
      if (starsBalanceEl) starsBalanceEl.textContent = parseInt(starsBalanceEl.textContent) + 1;
      if (mrscamBalanceEl) mrscamBalanceEl.textContent = (parseFloat(mrscamBalanceEl.textContent) + 5).toFixed(2);
    }
  });
});
