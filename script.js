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

  // Модальное для TON
  const tonModal = document.getElementById('ton-modal');
  const tonAmount = document.getElementById('ton-amount');
  const tonSubmit = document.getElementById('ton-submit');

  document.getElementById('payment-btn').onclick = () => {
    tonModal.classList.add('active');
  };

  tonSubmit.onclick = () => {
    const amount = tonAmount.value;
    if (!amount || parseFloat(amount) < 0.1) {
      alert('⚠️ Минимальная сумма 0.1 TON');
      return;
    }
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
        document.getElementById('ton-balance').textContent = (parseFloat(document.getElementById('ton-balance').textContent) + parseFloat(amount)).toFixed(2);
        document.getElementById('mrscam-balance').textContent = (parseFloat(document.getElementById('mrscam-balance').textContent) + parseFloat(amount) * 30).toFixed(2);
      })
      .catch(() => alert('❌ Транзакция отменена или ошибка'));
    tonModal.classList.remove('active');
  };

  // Модальное для Stars
  const starsModal = document.getElementById('stars-modal');
  const starsAmount = document.getElementById('stars-amount');
  const starsSubmit = document.getElementById('stars-submit');

  document.getElementById('pay-stars-btn').onclick = () => {
    starsModal.classList.add('active');
  };

  starsSubmit.onclick = () => {
    const amount = starsAmount.value;
    if (!amount || parseInt(amount) < 1) {
      alert('⚠️ Минимально 1 Star');
      return;
    }

    fetch('https://mr-scam.vercel.app/api/create-stars-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Поддержка Mr. Scam',
        description: `${amount} Telegram Stars для Mr. Scam 😈`,
        payload: `stars_support_${amount}`,
        amount: parseInt(amount)
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.invoice_link) {
        tg.openInvoice(data.invoice_link, (status) => {
          if (status === 'paid') {
            alert(`✅ Спасибо за ${amount} Stars! ❤️`);
            document.getElementById('stars-balance').textContent = parseInt(document.getElementById('stars-balance').textContent) + parseInt(amount);
            document.getElementById('mrscam-balance').textContent = (parseFloat(document.getElementById('mrscam-balance').textContent) + parseInt(amount) * 5).toFixed(2);
          }
        });
      } else {
        alert('❌ Ошибка создания инвойса');
      }
    })
    .catch(e => alert('❌ Ошибка: ' + e.message));
    starsModal.classList.remove('active');
  };

  // Закрытие модальных
  document.querySelectorAll('.modal-close').forEach(close => {
    close.onclick = () => {
      tonModal.classList.remove('active');
      starsModal.classList.remove('active');
    };
  });

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
      const starsBalanceEl = document.getElementById('stars-balance');
      const mrscamBalanceEl = document.getElementById('mrscam-balance');
      if (starsBalanceEl) starsBalanceEl.textContent = parseInt(starsBalanceEl.textContent) + amount; // amount from modal
      if (mrscamBalanceEl) mrscamBalanceEl.textContent = (parseFloat(mrscamBalanceEl.textContent) + amount * 5).toFixed(2);
    }
  });
});
