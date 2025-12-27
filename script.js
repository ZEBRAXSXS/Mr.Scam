// ========== script.js for Mr.Scam ==========
// Robust, restores TonConnect UI in #connect-container,
// shows wallet TON balance, local tx history fallback,
// clean modals and nav behavior.

window.addEventListener('load', async () => {
  const tg = window.Telegram?.WebApp;
  if (!tg || (!tg.initData && !tg.initDataUnsafe)) {
    // show blocked view if not in Telegram
    document.getElementById('app').style.display = 'none';
    const blocked = document.createElement('div');
    blocked.style.padding = '40px';
    blocked.style.color = '#fff';
    blocked.innerHTML = '<h2>Откройте в Telegram</h2><p>Приложение работает только внутри Telegram.</p>';
    document.body.appendChild(blocked);
    return;
  }

  tg.ready?.();

  // user UI
  const user = tg.initDataUnsafe?.user;
  if (user) {
    document.getElementById('username').textContent = user.username ? '@' + user.username : (user.first_name || 'User');
    if (user.photo_url) document.getElementById('user-avatar').src = user.photo_url;
  }

  // NAV handling
  function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const section = document.getElementById(id);
    if (section) section.classList.add('active');
    const nav = document.querySelector(`[data-section="${id}"]`);
    if (nav) nav.classList.add('active');
    // If profile opened - refresh tx/balance
    if (id === 'profile-section') {
      loadBalanceAndTx();
    }
  }
  document.getElementById('profile-btn').addEventListener('click', ()=> showSection('profile-section'));
  document.getElementById('market-btn').addEventListener('click', ()=> showSection('play-section'));
  document.getElementById('events-btn').addEventListener('click', ()=> showSection('staking-section'));
  document.getElementById('giveaway-btn').addEventListener('click', ()=> showSection('tasks-section'));

  // Profile subtabs
  document.querySelectorAll('.profile-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.profile-tab-content').forEach(c=>c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // LocalStorage helpers for fallback persistence
  function getLocal(key, fallback) {
    try { const v = localStorage.getItem(key); return v?JSON.parse(v):fallback; } catch(e){ return fallback; }
  }
  function setLocal(key, val) { try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }

  // Transactions and balance (local fallback)
  function loadBalanceAndTx() {
    const bal = getLocal('mrscam_balance', 0);
    const txs = getLocal('mrscam_tx', []);
    document.getElementById('mrscam-balance').textContent = (Number(bal)||0).toFixed(2);
    const txList = document.getElementById('tx-list');
    txList.innerHTML = '';
    if (!txs.length) {
      const el = document.createElement('div'); el.className='transaction-item'; el.innerHTML = '<span>Пока нет транзакций</span>';
      txList.appendChild(el);
    } else {
      txs.slice().reverse().forEach(t=>{
        const el = document.createElement('div'); el.className='transaction-item';
        el.innerHTML = `<span>${t.text}</span><span style="color:var(--muted)">${t.date}</span>`;
        txList.appendChild(el);
      });
    }
  }

  function pushTx(text){
    const txs = getLocal('mrscam_tx', []);
    txs.push({ text, date: new Date().toLocaleString('ru-RU') });
    if (txs.length>200) txs.shift();
    setLocal('mrscam_tx', txs);
    loadBalanceAndTx();
  }

  // TonConnect UI init — renders button inside #connect-container
  let connectedAddress = null;
  let tonConnectUI = null;
  try {
    if (window.TON_CONNECT_UI) {
      tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
        buttonRootId: 'connect-container',
        actionsConfiguration: { twaReturnUrl: 'https://t.me/mrscam_test_bot' }
      });

      tonConnectUI.onStatusChange(async wallet => {
        // wallet may be null when disconnected
        if (wallet && wallet.account && wallet.account.address) {
          connectedAddress = wallet.account.address;
        } else {
          connectedAddress = null;
        }
        // Update UI
        document.getElementById('wallet-address').textContent = connectedAddress ? connectedAddress : '';
        if (connectedAddress) {
          await updateWalletTonBalance(connectedAddress);
        } else {
          document.getElementById('wallet-ton-balance')?.textContent = '--';
        }
        loadBalanceAndTx();
      });
    }
  } catch(e){
    console.error('TonConnect UI init error', e);
  }

  // Update TON balance from toncenter
  async function updateWalletTonBalance(address){
    if (!address) return;
    try {
      const r = await fetch('https://toncenter.com/api/v2/getAddressBalance?address=' + encodeURIComponent(address));
      const j = await r.json();
      if (j && j.ok) {
        const val = Number(j.result) / 1e9;
        document.getElementById('wallet-ton-balance').textContent = val.toFixed(3);
      } else {
        document.getElementById('wallet-ton-balance').textContent = '--';
      }
    } catch(e){
      console.error('updateWalletTonBalance error', e);
      document.getElementById('wallet-ton-balance').textContent = '--';
    }
  }

  // TON modal handling
  const tonModal = document.getElementById('ton-modal');
  document.getElementById('add-ton-btn').addEventListener('click', ()=> tonModal.classList.add('active'));
  document.getElementById('ton-cancel').addEventListener('click', ()=> tonModal.classList.remove('active'));
  document.getElementById('ton-submit').addEventListener('click', async ()=>{
    const v = parseFloat(document.getElementById('ton-amount').value);
    if (!tonConnectUI) return alert('TonConnect UI недоступен');
    if (!tonConnectUI.account) return alert('Подключите кошелёк');
    if (isNaN(v) || v <= 0) return alert('Введите корректную сумму');
    const nano = Math.floor(v * 1e9).toString();
    const tx = { validUntil: Math.floor(Date.now()/1000) + 600, messages: [{ address: 'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD', amount: nano }]};
    try {
      await tonConnectUI.sendTransaction(tx);
      // update local mrscam balance (example conversion 1 TON -> 30 MrScam)
      const cur = Number(getLocal('mrscam_balance', 0));
      const nb = cur + (v * 30);
      setLocal('mrscam_balance', nb);
      pushTx('+' + v.toFixed(2) + ' TON (внесено)');
      loadBalanceAndTx();
      alert('Успешно!');
    } catch(e){
      console.error('sendTransaction err', e);
      alert('Ошибка транзакции');
    }
    tonModal.classList.remove('active');
    // refresh remote wallet balance
    if (tonConnectUI && tonConnectUI.account) await updateWalletTonBalance(tonConnectUI.account.address || tonConnectUI.account);
  });

  // Stars modal handling
  const starsModal = document.getElementById('stars-modal');
  document.getElementById('pay-stars-btn').addEventListener('click', ()=> starsModal.classList.add('active'));
  document.getElementById('stars-cancel').addEventListener('click', ()=> starsModal.classList.remove('active'));
  document.getElementById('stars-submit').addEventListener('click', () => {
    const amt = parseInt(document.getElementById('stars-amount').value || '0');
    if (!amt || amt < 1) { alert('Введите количество Stars'); return; }
    // prefer native showPopupForPayment if available
    if (typeof tg.showPopupForPayment === 'function') {
      try { tg.showPopupForPayment({title:'Поддержка', text:`${amt} Stars`}); } catch(e){ console.warn(e); }
    }
    // notify bot via sendData
    try { tg.sendData(JSON.stringify({ type:'stars', amount:amt })); } catch(e){ console.warn(e); }
    pushTx('+' + amt + ' Stars (запрос)');
    starsModal.classList.remove('active');
  });

  // ensure content for sections if empty
  function ensureDefault(id, text, lottie){
    const el = document.getElementById(id);
    if (!el) return;
    // if section has only whitespace -> fill
    if (!el.innerHTML || el.innerText.trim().length < 2) {
      el.innerHTML = `<lottie-player src="${lottie}" background="transparent" speed="1" style="width:180px;height:180px;margin:20px auto" loop autoplay></lottie-player><p>${text}</p>`;
    }
  }
  ensureDefault('play-section','Здесь идёт разработка 😈','/stickers/2_5361597813799030878.tgs');
  ensureDefault('staking-section','Здесь идёт разработка 😈','/stickers/2_5361597813799030884.tgs');
  ensureDefault('tasks-section','Здесь идёт разработка 😈','/stickers/2_5361597813799030886.tgs');

  // initial load
  loadBalanceAndTx();

});
