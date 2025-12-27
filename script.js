/*
  script.js — восстановленный: убраны кастомные статусы, восстановлен чистый TonConnect UI,
  баланс обновляется по onStatusChange, транзакции и модалки работают.
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

  // UI basic
  try {
    if (user) {
      const usernameEl = document.getElementById('username');
      if (usernameEl) usernameEl.textContent = user.username ? ('@' + user.username) : (user.first_name || 'User');
      const avatarEl = document.getElementById('user-avatar');
      if (avatarEl) avatarEl.src = user.photo_url || '/stickers/default.jpg';
    }
  } catch(e){}

  // --- ensure connect container is in place and remove custom status/button text ---
  (function prepareConnectContainer(){
    const walletBtn = document.getElementById('wallet-btn');
    const connectStatus = document.getElementById('connect-status');
    const walletAddress = document.getElementById('wallet-address');

    // hide custom elements if present (we'll use TonConnect UI)
    if (connectStatus) connectStatus.style.display = 'none';
    if (walletAddress) walletAddress.style.display = 'none';
    if (walletBtn) {
      // create container right before walletBtn and hide walletBtn
      const parent = walletBtn.parentElement;
      if (parent && !document.getElementById('connect-container')) {
        const container = document.createElement('div');
        container.id = 'connect-container';
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        parent.insertBefore(container, walletBtn);
      }
      walletBtn.style.display = 'none';
    } else {
      // if walletBtn missing, ensure there's a container somewhere sensible
      if (!document.getElementById('connect-container')) {
        const headBalances = document.querySelector('.balances');
        if (headBalances && headBalances.parentElement) {
          const container = document.createElement('div');
          container.id = 'connect-container';
          container.style.display = 'inline-flex';
          container.style.alignItems = 'center';
          headBalances.parentElement.appendChild(container);
        }
      }
    }
  })();

  // Upstash KV config (unchanged)
  const KV_URL = 'https://humorous-urchin-10758.upstash.io';
  const KV_TOKEN = 'ASoGAAIncDEwOGZiYjRiZjJlNzc0NTE1OTRmMDRjZGIxODY1YTE1NHAxMTA3NTg';

  // helpers for KV
  async function getKV(key){
    try{
      const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` }});
      const j = await r.json();
      return j.result ? JSON.parse(j.result) : null;
    }catch(e){ return null; }
  }
  async function setKV(key, value){
    try{
      await fetch(`${KV_URL}/set/${key}`, { method:'POST', headers:{ Authorization:`Bearer ${KV_TOKEN}`, 'Content-Type':'text/plain'}, body:JSON.stringify(value) });
    }catch(e){}
  }

  // transactions + balance display
  async function loadData(){
    try{
      const bal = (await getKV(`user:${userId}:balance`)) || 0;
      const tx = (await getKV(`user:${userId}:tx`)) || [];
      const balEl = document.getElementById('mrscam-balance');
      if (balEl) balEl.textContent = parseFloat(bal).toFixed(2);

      const container = document.querySelector('.transactions');
      if (container) {
        container.innerHTML = '<div class="transactions-title">История транзакций</div>';
        if (!tx.length) container.innerHTML += '<div class="transaction-item"><span>Нет транзакций</span><span>-</span></div>';
        else tx.slice().reverse().forEach(t => {
          const el = document.createElement('div'); el.className = 'transaction-item';
          el.innerHTML = `<span>${t.text}</span><span>${t.date}</span>`;
          container.appendChild(el);
        });
      }
    }catch(e){ console.error('loadData err', e); }
  }
  async function addTransaction(text){
    const tx = (await getKV(`user:${userId}:tx`)) || [];
    tx.push({ text, date: new Date().toLocaleString('ru-RU') });
    if (tx.length > 50) tx.shift();
    await setKV(`user:${userId}:tx`, tx);
  }

  // --- TonConnect UI init (pure) ---
  let tonConnectUI = null;
  let connectedWallet = null;
  try{
    // Use global TON_CONNECT_UI that page loads via <script src="...tonconnect-ui.min.js">
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
      buttonRootId: 'connect-container',
      actionsConfiguration: { twaReturnUrl: 'https://t.me/mrscam_test_bot' }
    });

    tonConnectUI.onStatusChange(async (wallet) => {
      if (wallet && wallet.account && wallet.account.address) {
        connectedWallet = wallet.account.address;
        try{ localStorage.setItem('mrscam_wallet', connectedWallet); }catch{}
        // update TON balance display (no manual wallet text)
        await updateWalletTonBalance(connectedWallet);
      } else {
        connectedWallet = null;
        try{ localStorage.removeItem('mrscam_wallet'); }catch{}
        // clear balance shown
        const tonEl = document.getElementById('wallet-ton-balance'); if (tonEl) tonEl.textContent = '--';
      }
      // refresh profile data each status change
      await loadData();
    });
  }catch(e){
    console.error('TonConnectUI init failed', e);
  }

  // in case wallet stored locally (fallback), try update balance silently
  try{
    const saved = localStorage.getItem('mrscam_wallet');
    if (saved) {
      connectedWallet = saved;
      await updateWalletTonBalance(saved);
    }
  }catch(e){}

  async function updateWalletTonBalance(addr){
    if (!addr) {
      const el = document.getElementById('wallet-ton-balance'); if(el) el.textContent='--';
      return;
    }
    try{
      const r = await fetch('https://toncenter.com/api/v2/getAddressBalance?address=' + encodeURIComponent(addr));
      const j = await r.json();
      if (j && j.ok) {
        const el = document.getElementById('wallet-ton-balance');
        if (el) el.textContent = (j.result / 1e9).toFixed(3);
      }
    }catch(e){
      console.error('updateWalletTonBalance error', e);
      const el = document.getElementById('wallet-ton-balance'); if(el) el.textContent='--';
    }
  }

  // UI: nav, tabs, modals, payments (keeps previous safe behavior)
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      item.classList.add('active');
      const target = item.dataset.section || item.id.replace('-btn','-section');
      const sec = document.getElementById(target); if(sec) sec.classList.add('active');
      if (target === 'profile-section') loadData();
    });
  });

  document.querySelectorAll('.profile-tab').forEach(tab=>tab.addEventListener('click', ()=>{
    document.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c=>c.classList.remove('active'));
    tab.classList.add('active'); document.getElementById(tab.dataset.tab)?.classList.add('active');
  }));

  const openModal = id => document.getElementById(id)?.classList.add('active');
  const closeAll = () => document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'));
  document.querySelectorAll('.modal-close').forEach(b=>b.addEventListener('click', closeAll));
  document.getElementById('payment-btn')?.addEventListener('click', ()=>openModal('ton-modal'));
  document.getElementById('pay-stars-btn')?.addEventListener('click', ()=>openModal('stars-modal'));

  // TON pay handler
  document.getElementById('ton-submit')?.addEventListener('click', async ()=>{
    const amount = parseFloat(document.getElementById('ton-amount')?.value || '0');
    if (!amount || amount < 0.1) return tg.showAlert ? tg.showAlert('Минимум 0.1 TON') : alert('Минимум 0.1 TON');
    if (!tonConnectUI || !connectedWallet) return tg.showAlert ? tg.showAlert('Подключите кошелёк') : alert('Подключите кошелёк');
    try{
      const tx = { validUntil: Math.floor(Date.now()/1000)+600, messages:[{ address:'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD', amount:(amount*1e9).toString() }]};
      await tonConnectUI.sendTransaction(tx);
      // optimistic update
      const curr = parseFloat(document.getElementById('mrscam-balance')?.textContent || '0') || 0;
      const newb = curr + amount * 30;
      await setKV(`user:${userId}:balance`, newb);
      await addTransaction(`+${amount.toFixed(2)} TON`);
      await loadData();
      closeAll();
      tg.showAlert ? tg.showAlert('Успешно') : alert('Успешно');
    }catch(e){ console.error(e); tg.showAlert ? tg.showAlert('Отмена') : alert('Отмена'); }
  });

  // Stars handler (safe fallback)
  document.getElementById('stars-submit')?.addEventListener('click', async ()=>{
    const amount = parseInt(document.getElementById('stars-amount')?.value || '0');
    if (!amount || amount < 1) return tg.showAlert ? tg.showAlert('Введите корректное количество Stars') : alert('Введите корректное количество Stars');
    try{
      tg.sendData(JSON.stringify({ type:'stars', amount }));
      await addTransaction(`+${amount} Stars (заявка)`);
      await loadData();
      closeAll();
      tg.showAlert ? tg.showAlert('Запрос отправлен боту') : alert('Запрос отправлен боту');
    }catch(e){ console.error(e); tg.showAlert ? tg.showAlert('Ошибка отправки') : alert('Ошибка отправки'); }
  });

  // initial load
  await loadData();
});
