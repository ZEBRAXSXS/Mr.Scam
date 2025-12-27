window.addEventListener('load', () => {
  const tg = window.Telegram.WebApp;

  if (!tg.initDataUnsafe || !tg.initData) {
    document.getElementById('app').style.display = 'none';
    document.getElementById('blocked').style.display = 'block';
    return;
  }

  tg.expand();
  tg.ready();

  const user = tg.initDataUnsafe.user;
  const userId = user.id;
  const username = user.username ? user.username : (user.first_name || 'User');
  const isPremium = user.is_premium || false;
  const avatarUrl = user.photo_url || '';

  document.getElementById('username').textContent = username;
  const avatarEl = document.getElementById('user-avatar');
  if (avatarUrl) avatarEl.src = avatarUrl;

  // Подсветка премиум
  const avatarContainer = document.querySelector('.avatar-container');
  if (isPremium) {
    avatarEl.classList.add('premium-border');
    avatarContainer.style.boxShadow = 'var(--premium-glow)';
  }

  // TON Connect
  const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
    buttonRootId: 'connect-container'
  });

  let connectedWallet = null;
  tonConnectUI.onStatusChange(async (wallet) => {
    if (wallet) {
      connectedWallet = wallet.account.address;
      // Реальный баланс TON
      const provider = tonConnectUI.provider;
      const balance = await provider.getBalance(wallet.account.address);
      const tonBalance = (balance / 1e9).toFixed(4);
      document.getElementById('ton-balance').textContent = tonBalance;
      document.getElementById('payment-section').style.display = 'block';
    } else {
      connectedWallet = null;
      document.getElementById('ton-balance').textContent = '0.00';
    }
  });

  // История транзакций (локально)
  const transactionsList = document.getElementById('transactions-list');
  let transactions = JSON.parse(localStorage.getItem(`transactions_${userId}`) || '[]');

  function updateTransactions() {
    if (transactions.length === 0) {
      transactionsList.innerHTML = '<div class="transaction-item"><span>Нет транзакций</span><span>-</span></div>';
    } else {
      transactionsList.innerHTML = transactions.map(t => 
        `<div class="transaction-item"><span>${t.amount} \( {t.type}</span><span> \){t.date}</span></div>`
      ).join('');
    }
  }
  updateTransactions();

  // Добавление транзакции
  function addTransaction(amount, type) {
    const date = new Date().toLocaleDateString();
    transactions.unshift({ amount, type, date });
    localStorage.setItem(`transactions_${userId}`, JSON.stringify(transactions));
    updateTransactions();
  }

  // Оплата TON
  document.getElementById('payment-btn').onclick = () => document.getElementById('ton-modal').classList.add('active');

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
        addTransaction(`+${amount}`, 'TON');
        document.getElementById('ton-balance').textContent = (parseFloat(document.getElementById('ton-balance').textContent) + amount).toFixed(4);
        document.getElementById('mrscam-balance').textContent = (parseFloat(document.getElementById('mrscam-balance').textContent) + amount * 30).toFixed(2);
      })
      .catch(() => alert('Транзакция отменена'));
    document.getElementById('ton-modal').classList.remove('active');
  };

  // Оплата Stars
  document.getElementById('pay-stars-btn').onclick = () => document.getElementById('stars-modal').classList.add('active');

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
            addTransaction(`+${amount}`, 'Stars');
            document.getElementById('mrscam-balance').textContent = (parseFloat(document.getElementById('mrscam-balance').textContent) + amount * 5).toFixed(2);
          }
        });
      }
    })
    .catch(() => alert('Ошибка'));
    document.getElementById('stars-modal').classList.remove('active');
  };

  // Закрытие модалей
  document.querySelectorAll('.modal-close').forEach(el => el.onclick = () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  });

  // Навигация и табы (как было)
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

  document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
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

      if (sectionId === 'profile-section') initProfileTabs();
    };
  });

  initProfileTabs();
});
