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
    const walletEl = document.getElementById('wallet-address');
    if (!walletEl) return;
    if (wallet) {
      connectedWallet = wallet.account.address;
      const cleanAddr = connectedWallet.replace(/[^a-zA-Z0-9]/g, '');
      walletEl.textContent = cleanAddr.substring(0, 6) + '...' + cleanAddr.substring(cleanAddr.length - 4);
    } else {
      connectedWallet = null;
      walletEl.textContent = 'Not connected';
    }
  });

  // Модальные окна
  const tonModal = document.getElementById('ton-modal');
  const starsModal = document.getElementById('stars-modal');

  const closeModals = () => {
    tonModal.classList.remove('active');
    starsModal.classList.remove('active');
  };

  document.getElementById('payment-btn').onclick = () => tonModal.classList.add('active');
  document.getElementById('pay-stars-btn').onclick = () => starsModal.classList.add('active');

  document.querySelectorAll('.modal-close').forEach(el => el.onclick = closeModals);

  // Оплата TON
  document.getElementById('ton-submit').onclick = () => {
    const amount = parseFloat(document.getElementById('ton-amount').value);
    if (isNaN(amount) || amount < 0.1) return alert('Минимальная сумма 0.1 TON');
    if (!connectedWallet) return alert('Подключите кошелёк сначала!');

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: 'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD',
        amount: (amount * 1000000000).toString()
      }]
    };

    tonConnectUI.sendTransaction(transaction)
      .then(() => {
        alert(`${amount} TON успешно внесено!`);
        document.getElementById('ton-balance').textContent = (parseFloat(document.getElementById('ton-balance').textContent) + amount).toFixed(2);
        document.getElementById('mrscam-balance').textContent = (parseFloat(document.getElementById('mrscam-balance').textContent) + amount * 30).toFixed(2);
      })
      .catch(() => alert('Транзакция отменена'));
    closeModals();
  };

  // Оплата Stars
  document.getElementById('stars-submit').onclick = () => {
    const amount = parseInt(document.getElementById('stars-amount').value);
    if (isNaN(amount) || amount < 1) return alert('Минимально 1 Star');

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
        tg.openInvoice(data.invoice_link, status => {
          if (status === 'paid') {
            alert(`Спасибо за ${amount} Stars! ❤️`);
            document.getElementById('mrscam-balance').textContent = (parseFloat(document.getElementById('mrscam-balance').textContent) + amount * 5).toFixed(2);
          }
        });
      }
    })
    .catch(() => alert('Ошибка'));
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
  document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
      closeModals();
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

      let sectionId;
      switch (item.id) {
        case 'market-btn': sectionId = 'play-section'; break;
        case 'events-btn': sectionId = 'staking-section'; break;
        case 'profile-btn': sectionId = 'profile-section'; break;
        case 'giveaway-btn': sectionId = 'tasks-section'; break;
      }

      document.getElementById(sectionId).classList.add('active');
      item.classList.add('active');

      if (sectionId === 'profile-section') {
        initProfileTabs();
      }
    };
  });

  initProfileTabs();
});
