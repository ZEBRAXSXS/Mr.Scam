/*
  script.js - исправленный: категории, TON баланс, Stars через showInvoice (если есть),
  fallback: localStorage для адреса, кнопка "Обновить баланс" для ручного обновления.
  Обязательно: если используете Telegram Invoice, вставьте provider_token в код ниже.
*/
window.addEventListener('load', async () => {
  const tg = window.Telegram.WebApp;
  tg.expand && tg.expand();
  tg.ready && tg.ready();

  if (!tg.initDataUnsafe || !tg.initData) {
    document.getElementById('app')?.style.setProperty('display','none');
    document.getElementById('blocked')?.style.setProperty('display','block');
    return;
  }

  const user = tg.initDataUnsafe.user;
  const userId = user ? user.id.toString() : 'guest';
  document.getElementById('username').textContent = user?.username ? '@'+user.username : user?.first_name || 'User';
  document.getElementById('user-avatar').src = user?.photo_url || '/stickers/default.jpg';

  const KV_URL = 'https://humorous-urchin-10758.upstash.io';
  const KV_TOKEN = 'ASoGAAIncDEwOGZiYjRiZjJlNzc0NTE1OTRmMDRjZGIxODY1YTE1NHAxMTA3NTg';

  // PROVIDER TOKEN для Telegram Invoice (замените на ваш токен, если используете)
  const TELEGRAM_PROVIDER_TOKEN = 'REPLACE_WITH_PROVIDER_TOKEN';

  // --- TonConnect init ---
  let tonConnectUI = null;
  let connectedWallet = null;

  function saveWalletLocal(addr){
    try{ if(addr) localStorage.setItem('mrscam_wallet', addr); else localStorage.removeItem('mrscam_wallet'); }catch{}
  }
  function loadWalletLocal(){
    try{ return localStorage.getItem('mrscam_wallet') || null }catch{return null}
  }

  try {
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
      buttonRootId: 'connect-container',
      actionsConfiguration: { twaReturnUrl: 'https://t.me/mrscam_test_bot' }
    });

    tonConnectUI.onStatusChange(wallet => {
      connectedWallet = wallet?.account?.address || null;
      if(connectedWallet) saveWalletLocal(connectedWallet);
      else saveWalletLocal(null);
      document.getElementById('wallet-address').textContent = connectedWallet ? (connectedWallet.slice(0,6)+'...'+connectedWallet.slice(-4)) : 'Not connected';
      // сразу обновляем баланс если есть адрес
      if(connectedWallet) updateWalletTonBalance(connectedWallet);
    });

  } catch(e){
    console.error('TonConnect init failed', e);
  }

  // если wallet уже был сохранён локально — используем его и пробуем обновить баланс
  const localAddr = loadWalletLocal();
  if(localAddr){
    connectedWallet = localAddr;
    document.getElementById('wallet-address').textContent = localAddr.slice(0,6)+'...'+localAddr.slice(-4);
    updateWalletTonBalance(localAddr);
  }

  // кнопка ручного обновления баланса
  document.getElementById('refresh-balance')?.addEventListener('click', () => {
    if(connectedWallet) updateWalletTonBalance(connectedWallet);
    else tg.showAlert && tg.showAlert('Кошелёк не подключен');
  });

  async function updateWalletTonBalance(address){
    if(!address){ document.getElementById('wallet-ton-balance').textContent='--'; return; }
    try{
      const res = await fetch('https://toncenter.com/api/v2/getAddressBalance?address='+encodeURIComponent(address));
      const json = await res.json();
      if(json && json.ok){
        const val = (json.result/1e9);
        document.getElementById('wallet-ton-balance').textContent = val.toFixed(3);
      } else {
        document.getElementById('wallet-ton-balance').textContent='--';
      }
    }catch(err){
      console.error('ton balance err', err);
      document.getElementById('wallet-ton-balance').textContent='--';
    }
  }

  // --- KV helpers ---
  async function getKV(key){
    try{
      const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` }});
      const j = await r.json();
      return j.result ? JSON.parse(j.result) : null;
    }catch(e){ return null; }
  }
  async function setKV(key, value){
    try{
      await fetch(`${KV_URL}/set/${key}`, { method:'POST', headers:{ Authorization:`Bearer ${KV_TOKEN}`, 'Content-Type':'text/plain'}, body:JSON.stringify(value)});
    }catch(e){}
  }

  // --- Load data (balance + tx) ---
  async function loadData(){
    const bal = (await getKV(`user:${userId}:balance`)) || 0;
    document.getElementById('mrscam-balance').textContent = parseFloat(bal).toFixed(2);

    const tx = (await getKV(`user:${userId}:tx`)) || [];
    const container = document.querySelector('.transactions');
    container.innerHTML = '<div class="transactions-title">История транзакций</div>';
    if(!tx.length){
      container.innerHTML += '<div class="transaction-item"><span>Нет транзакций</span><span>-</span></div>';
    } else {
      tx.slice().reverse().forEach(t => {
        const el = document.createElement('div');
        el.className='transaction-item';
        el.innerHTML = `<span>${t.text}</span><span>${t.date}</span>`;
        container.appendChild(el);
      });
    }
  }

  async function addTransaction(text){
    const tx = (await getKV(`user:${userId}:tx`)) || [];
    tx.push({ text, date: new Date().toLocaleString('ru-RU')});
    if(tx.length>50) tx.shift();
    await setKV(`user:${userId}:tx`, tx);
  }

  // --- Payments: TON ---
  document.getElementById('ton-submit')?.addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('ton-amount')?.value || '0');
    if(!amount || amount < 0.1) return tg.showAlert ? tg.showAlert('Минимум 0.1 TON') : alert('Минимум 0.1 TON');
    if(!tonConnectUI || !connectedWallet) return tg.showAlert ? tg.showAlert('Подключи кошелёк') : alert('Подключи кошелёк');
    const tx = { validUntil: Math.floor(Date.now()/1000)+600, messages:[{ address:'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD', amount: (amount*1e9).toString() }]};
    try{
      await tonConnectUI.sendTransaction(tx);
      // обновление локального баланса MRSCAM
      const curr = parseFloat(document.getElementById('mrscam-balance')?.textContent || '0') || 0;
      const newBal = curr + amount*30;
      await setKV(`user:${userId}:balance`, newBal);
      await addTransaction(`+${amount} TON`);
      await loadData();
      document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'));
      tg.showAlert ? tg.showAlert('Успешно') : alert('Успешно');
    }catch(err){
      console.error(err);
      tg.showAlert ? tg.showAlert('Отменено') : alert('Отменено');
    }
  });

  // --- Payments: Stars (Telegram Invoice attempted) ---
  document.getElementById('stars-submit')?.addEventListener('click', async () => {
    const amount = parseInt(document.getElementById('stars-amount')?.value || '0');
    if(!amount || amount < 1) return tg.showAlert ? tg.showAlert('Введите корректное количество Stars') : alert('Введите корректное количество Stars');

    // 1) попытка showInvoice (если доступно)
    if(typeof tg.showInvoice === 'function' && TELEGRAM_PROVIDER_TOKEN && TELEGRAM_PROVIDER_TOKEN !== 'REPLACE_WITH_PROVIDER_TOKEN'){
      try{
        await tg.showInvoice({
          title: 'Поддержка Stars',
          description: `Пожертвовать ${amount} Stars`,
          payload: `stars-${userId}-${Date.now()}`,
          provider_token: TELEGRAM_PROVIDER_TOKEN,
          currency: 'USD',
          prices: [{ label: 'Stars', amount: amount * 100 }],
          max_tip_amount: 0
        });
        // если showInvoice возвращает — ждём, затем добавляем запись (бот пришлёт подтверждение; но здесь пусть будет optimistic)
        await addTransaction(`+${amount} Stars`);
        await loadData();
        document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'));
        tg.showAlert ? tg.showAlert('Ок, открылось окно оплаты') : alert('Ок, открылось окно оплаты');
        return;
      }catch(e){
        console.warn('showInvoice failed', e);
        // fallback ниже
      }
    }

    // 2) fallback: послать данные боту — бот должен обработать (не вызывает закрытие MiniApp)
    try{
      tg.sendData(JSON.stringify({ type:'stars_request', userId, amount }));
      // optimistic add (бот может подтвердить потом)
      await addTransaction(`+${amount} Stars (заявка)`);
      await loadData();
      document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'));
      tg.showAlert ? tg.showAlert('Запрос отправлен боту') : alert('Запрос отправлен боту');
    }catch(e){
      console.error('stars fallback failed', e);
      tg.showAlert ? tg.showAlert('Ошибка отправки') : alert('Ошибка отправки');
    }
  });

  // --- UI: modals, tabs, nav ---
  document.querySelectorAll('.modal-close').forEach(b=>b.addEventListener('click', ()=>document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'))));
  document.getElementById('payment-btn')?.addEventListener('click', ()=>document.getElementById('ton-modal')?.classList.add('active'));
  document.getElementById('pay-stars-btn')?.addEventListener('click', ()=>document.getElementById('stars-modal')?.classList.add('active'));

  document.querySelectorAll('.profile-tab').forEach(tab=>tab.addEventListener('click', ()=>{
    document.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c=>c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab)?.classList.add('active');
  }));

  // ensure nav works with data-section
  document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    item.classList.add('active');
    const sec = item.getAttribute('data-section') || item.id.replace('-btn','-section');
    document.getElementById(sec)?.classList.add('active');
    // if returned to profile, reload data:
    if(sec === 'profile-section') loadData();
  }));

  // initial load
  await loadData();
});
