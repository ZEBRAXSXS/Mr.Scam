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
    actionsConfiguration: { twaReturnUrl: 'https://t.me/mrscam_test_bot' }
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

  // Модальные окна
  const tonModal = document.getElementById('ton-modal');
  const starsModal = document.getElementById('stars-modal');

  document.getElementById('payment-btn').onclick = () => {
    tonModal.classList.add('active');
  };

  document.getElementById('pay-stars-btn').onclick = () => {
    starsModal.classList.add('active');
  };

  document.querySelectorAll('.modal-close').forEach(close => {
    close.onclick = () => {
      tonModal.classList.remove('active');
      starsModal.classList.remove('active');
    };
  });

  // Выбор суммы TON
  document.querySelectorAll('#ton-modal .modal-btn').forEach(btn => {
    btn.onclick = () => {
      const amount = btn.dataset.amount;
      if (!connectedWallet) {
        alert('⚠️ Подключите кошелёк сначала!');
        tonModal.classList.remove('active');
        return;
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: 'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD',
          amount: (parseFloat(amount) * 1000000000).toString()
        }]
      };

      tonConnectUI.sendTransaction(transaction)
        .then(() => {
          alert(`✅ ${amount} TON успешно внесено!`);
          const tonBalanceEl = document.getElementById('ton-balance');
          const mrscamBalanceEl = document.getElementById('mrscam-balance');
          if (tonBalanceEl) tonBalanceEl.textContent = (parseFloat(tonBalanceEl.textContent) + parseFloat(amount)).toFixed(2);
          if (mrscamBalanceEl) mrscamBalanceEl.textContent = (parseFloat(mrscamBalanceEl.textContent) + parseFloat(amount) * 30).toFixed(2); // +30 Mr.Scam за 1 TON
        })
        .catch(() => alert('❌ Транзакция отменена или ошибка'));
      tonModal.classList.remove('active');
    };
  });

  // Выбор количества Stars
  document.querySelectorAll('#stars-modal .modal-btn').forEach(btn => {
    btn.onclick = () => {
      const amount = parseInt(btn.dataset.stars);
      fetch('https://mr-scam.vercel.app/api/create-stars-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Поддержка Mr. Scam',
          description: `${amount} Telegram Stars для Mr. Scam 😈`,
          payload: `stars_support_${amount}`,
          amount: amount
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.invoice_link) {
          tg.openInvoice(data.invoice_link, (status) => {
            if (status === 'paid') {
              alert(`✅ Спасибо за ${amount} Stars! ❤️`);
              const starsBalanceEl = document.getElementById('stars-balance');
              const mrscamBalanceEl = document.getElementById('mrscam-balance');
              if (starsBalanceEl) starsBalanceEl.textContent = parseInt(starsBalanceEl.textContent) + amount;
              if (mrscamBalanceEl) mrscamBalanceEl.textContent = (parseFloat(mrscamBalanceEl.textContent) + amount * 5).toFixed(2); // +5 Mr.Scam за 1 Star
            }
          });
        } else {
          alert('❌ Ошибка создания инвойса');
        }
      })
      .catch(e => alert('❌ Ошибка: ' + e.message));
      starsModal.classList.remove('active');
    };
  });

  // Переключение табов в профиле и навигации (как раньше)
  // ... (код переключения табов и разделов остаётся из предыдущей версии)

  // Навигация по разделам (как раньше)
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
});
