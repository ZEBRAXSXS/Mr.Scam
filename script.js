/*
  script.js — восстановление TonConnect UI в месте wallet-btn,
  управление подключением/отключением, баланс TON, транзакции, Stars fallback.
*/
window.addEventListener('load', async () => {
  const tg = window.Telegram.WebApp;
  if (!tg.initDataUnsafe || !tg.initData) {
    document.getElementById('app')?.style.setProperty('display','none');
    document.getElementById('blocked')?.style.setProperty('display','block');
    return;
  }
  tg.expand && tg.expand();
  tg.ready && tg.ready();

  const user = tg.initDataUnsafe.user;
  const userId = user ? user.id.toString() : 'guest';
  document.getElementById('username').textContent = user?.username ? '@'+user.username : user?.first_name || 'User';
  document.getElementById('user-avatar').src = user?.photo_url || '/stickers/default.jpg';

  // Upstash KV
  const KV_URL = 'https://humorous-urchin-10758.upstash.io';
  const KV_TOKEN = 'ASoGAAIncDEwOGZiYjRiZjJlNzc0NTE1OTRmMDRjZGIxODY1YTE1NHAxMTA3NTg';

  // Telegram provider token (если используешь Invoice) - заменить при необходимости
  const TELEGRAM_PROVIDER_TOKEN = 'REPLACE_WITH_PROVIDER_TOKEN';

  // --- Ensure a connect container exists where wallet-btn is (restore TonConnect UI) ---
  (function ensureConnectContainer() {
    const walletBtn = document.getElementById('wallet-btn');
    // if there is a custom walletBtn, replace it with connect-container (but keep it hidden)
    if (walletBtn) {
      const parent = walletBtn.parentElement;
      const container = document.createElement('div');
      container.id = 'connect-container';
      container.style.display = 'inline-flex';
      container.style.alignItems = 'center';
      // insert container before walletBtn, then hide walletBtn
      parent.insertBefore(container, walletBtn);
      walletBtn.style.display = 'none';
    } else {
      // if no wallet-btn, but no container either, try to append to header balances area
      if (!document.getElementById('connect-container')) {
        const balances = document.querySelector('.balances');
        if (balances) {
          const container = document.createElement('div');
          container.id = 'connect-container';
          container.style.display = 'inline-flex';
          container.style.alignItems = 'center';
          balances.parentElement.appendChild(container);
        }
      }
    }
  })();

  // TonConnect UI init
  let tonConnectUI = null;
  let connectedWallet = null;

  // helper: update wallet UI (address & mrscam ton balance via toncenter)
  async function updateWalletTonBalance(addr) {
    if (!addr) {
      document.getElementById('wallet-address').textContent = '--';
      document.getElementById('wallet-ton-balance').textContent = '--';
      return;
    }
    document.getElementById('wallet-address').textContent = addr.slice(0,6) + '...' + addr.slice(-4);
    try {
      const res = await fetch('https://toncenter.com/api/v2/getAddressBalance?address=' + encodeURIComponent(addr));
      const j = await res.json();
      if (j && j.ok) {
        document.getElementById('wallet-ton-balance').textContent = (j.result / 1e9).toFixed(3);
      } else {
        document.getElementById('wallet-ton-balance').textContent = '--';
      }
    } catch (e) {
      console.error('ton balance error', e);
      document.getElementById('wallet-ton-balance').textContent = '--';
    }
  }

  // KV helpers
  async function getKV(key) {
    try {
      const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` }});
      const j = await r.json();
      return j.result ? JSON.parse(j.result) : null;
    } catch (e) {
      return null;
    }
  }
  async function setKV(key, value) {
    try {
      await fetch(`${KV_URL}/set/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
        body: JSON.stringify(value)
      });
    } catch (e) { /* ignore */ }
  }

  // transactions + balance display
  async function loadData() {
    const balance = (await getKV(`user:${userId}:balance`)) || 0;
    const tx = (await getKV(`user:${userId}:tx`)) || [];
    document.getElementById('mrscam-balance').textContent = parseFloat(balance).toFixed(2);

    const container = document.querySelector('.transactions');
    if (!container) return;
    container.innerHTML = '<div class="transactions-title">История транзакций</div>';
    if (!tx.length) {
      container.innerHTML += '<div class="transaction-item"><span>Нет транзакций</span><span>-</span></div>';
    } else {
      tx.slice().reverse().forEach(t => {
        const el = document.createElement('div');
        el.className = 'transaction-item';
        el.innerHTML = `<span>${t.text}</span><span>${t.date}</span>`;
        container.appendChild(el);
      });
    }
  }
  async function addTransaction(text) {
    const tx = (await getKV(`user:${userId}:tx`)) || [];
    tx.push({ text, date: new Date().toLocaleString('ru-RU') });
    if (tx.length > 50) tx.shift();
    await setKV(`user:${userId}:tx`, tx);
  }

  // Initialize TonConnectUI and attach onStatusChange
  try {
    // create TonConnectUI; it will render its button inside #connect-container
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
      buttonRootId: 'connect-container',
      actionsConfiguration: { twaReturnUrl: 'https://t.me/mrscam_test_bot' }
    });

    tonConnectUI.onStatusChange(async (wallet) => {
      if (wallet) {
        connectedWallet = wallet.account.address;
        // store local copy so balance can be fetched if page reloads
        try { localStorage.setItem('mrscam_wallet', connectedWallet); } catch {}
        await updateWalletTonBalance(connectedWallet);
      } else {
        connectedWallet = null;
        try { localStorage.removeItem('mrscam_wallet'); } catch {}
        document.getElementById('wallet-address').textContent = '--';
        document.getElementById('wallet-ton-balance').textContent = '--';
      }
      // load app data every time wallet status changes (keeps profile in sync)
      await loadData();
    });
  } catch (e) {
    console.error('TonConnectUI init failed', e);
  }

  // If user had wallet saved locally (fallback), try to show address and balance immediately
  try {
    const saved = localStorage.getItem('mrscam_wallet');
    if (saved) {
      connectedWallet = saved;
      document.getElementById('wallet-address').textContent = saved.slice(0,6) + '...' + saved.slice(-4);
      updateWalletTonBalance(saved);
    }
  } catch {}

  // Navigation: ensure sections toggle reliably (support data-section or id mapping)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      // first try data-section
      const target = item.dataset.section || item.id.replace('-btn','-section');
      const sec = document.getElementById(target);
      if (sec) sec.classList.add('active');
      // if user returns to profile, refresh data
      if (target === 'profile-section') loadData();
    });
  });

  // Profile tabs (stickers/gifts)
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab)?.classList.add('active');
    });
  });

  // Modals open/close
  const openModal = id => document.getElementById(id)?.classList.add('active');
  const closeAllModals = () => document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', closeAllModals));
  document.getElementById('payment-btn')?.addEventListener('click', () => openModal('ton-modal'));
  document.getElementById('pay-stars-btn')?.addEventListener('click', () => openModal('stars-modal'));

  // TON payment handler (uses TonConnectUI)
  document.getElementById('ton-submit')?.addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('ton-amount')?.value || '0');
    if (!amount || amount < 0.1) return tg.showAlert ? tg.showAlert('Минимум 0.1 TON') : alert('Минимум 0.1 TON');
    if (!tonConnectUI || !connectedWallet) return tg.showAlert ? tg.showAlert('Подключите кошелёк') : alert('Подключите кошелёк');

    try {
      // build transaction in TonConnect format (SDK accepts object)
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: 'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD', // твой адрес приёма
          amount: (amount * 1e9).toString()
        }]
      };
      await tonConnectUI.sendTransaction(tx);

      // optimistic: update MRSCAM balance and history on success
      const current = parseFloat(document.getElementById('mrscam-balance')?.textContent || '0') || 0;
      const newBalance = current + amount * 30;
      await setKV(`user:${userId}:balance`, newBalance);
      await addTransaction(`+${amount.toFixed(2)} TON (внесено)`);
      await loadData();
      closeAllModals();
      tg.showAlert ? tg.showAlert('Успешно') : alert('Успешно');
    } catch (e) {
      console.error('ton send error', e);
      tg.showAlert ? tg.showAlert('Ошибка транзакции') : alert('Ошибка транзакции');
    }
  });

  // Stars handler: try showInvoice, else sendData fallback (doesn't close)
  document.getElementById('stars-submit')?.addEventListener('click', async () => {
    const amount = parseInt(document.getElementById('stars-amount')?.value || '0');
    if (!amount || amount < 1) return tg.showAlert ? tg.showAlert('Введите количество Stars') : alert('Введите количество Stars');

    // try showInvoice if available and provider token set
    if (typeof tg.showInvoice === 'function' && TELEGRAM_PROVIDER_TOKEN && TELEGRAM_PROVIDER_TOKEN !== 'REPLACE_WITH_PROVIDER_TOKEN') {
      try {
        await tg.showInvoice({
          title: 'Поддержка Stars',
          description: `Пожертвовать ${amount} Stars`,
          payload: `stars-${userId}-${Date.now()}`,
          provider_token: TELEGRAM_PROVIDER_TOKEN,
          currency: 'USD',
          prices: [{ label: 'Stars', amount: amount * 100 }],
          max_tip_amount: 0
        });
        await addTransaction(`+${amount} Stars`);
        await loadData();
        closeAllModals();
        return;
      } catch (e) {
        console.warn('showInvoice failed', e);
        // fallback below
      }
    }

    // fallback: notify bot via sendData, don't close app
    try {
      tg.sendData(JSON.stringify({ type: 'stars_request', userId, amount }));
      await addTransaction(`+${amount} Stars (заявка)`);
      await loadData();
      closeAllModals();
      tg.showAlert ? tg.showAlert('Запрос отправлен боту') : alert('Запрос отправлен боту');
    } catch (e) {
      console.error('stars fallback error', e);
      tg.showAlert ? tg.showAlert('Ошибка отправки') : alert('Ошибка отправки');
    }
  });

  // helper: initial load
  await loadData();
  // update balance if wallet was saved in localStorage (fallback)
  try {
    const saved = localStorage.getItem('mrscam_wallet');
    if (saved) {
      connectedWallet = saved;
      document.getElementById('wallet-address').textContent = saved.slice(0,6) + '...' + saved.slice(-4);
      await updateWalletTonBalance(saved);
    }
  } catch (e) { /* ignore */ }
});
