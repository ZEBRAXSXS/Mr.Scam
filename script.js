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

  // Модальные окна
  const tonModal = document.getElementById('ton-modal');
  const starsModal = document.getElementById('stars-modal');

  const closeModals = () => {
    tonModal.classList.remove('active');
    starsModal.classList.remove('active');
  };

  document.getElementById('payment-btn').onclick = () => {
    closeModals();
    tonModal.classList.add('active');
  };

  document.getElementById('pay-stars-btn').onclick = () => {
    closeModals();
    starsModal.classList.add('active');
  };

  document.querySelectorAll('.modal-close').forEach(close => {
    close.onclick = closeModals;
  });

  // Оплата TON
  document.getElementById('ton-submit').onclick = () => {
    const amount = document.getElementById('ton-amount').value;
    if (!amount || parseFloat(amount) < 0.1) {
      alert('⚠️ Минимальная сумма 0.1 TON');
      return;
    }
    if (!connectedWallet) {
      alert('⚠️ Подключите кошелёк сначала!');
      closeModals();
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
    closeModals();
  };

  // Оплата Stars
  document.getElementById('stars-submit').onclick = () => {
    const amount = document.getElementById('stars-amount').value;
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
            document.getElementById('mrscam-balance').textContent = (parseFloat(document.getElementById('mrscam-balance').textContent) + parseInt(amount) * 5).toFixed(2);
          }
        });
      } else {
        alert('❌ Ошибка создания инвойса');
      }
    })
    .catch(e => alert('❌ Ошибка: ' + e.message));
    closeModals();
  };

  // Переключение табов в профиле
  const initProfileTabs = () => {
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      };
    });
  };

  // Навигация по разделам
  const navButtons = ['market-btn', 'events-btn', 'profile-btn', 'giveaway-btn'];
  navButtons.forEach(id => {
    document.getElementById(id).onclick = () => {
      closeModals(); // Закрываем модалки при переключении раздела
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const sectionId = id === 'market-btn' ? 'play-section' : id === 'events-btn' ? 'staking-section' : id === 'profile-btn' ? 'profile-section' : 'tasks-section';
      document.getElementById(sectionId).classList.add('active');
      document.getElementById(id).classList.add('active');

      if (sectionId === 'profile-section') {
        initProfileTabs();
      }
    };
  });

  // Инициализация табов при загрузке (профиль по умолчанию)
  initProfileTabs();
});
