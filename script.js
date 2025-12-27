const telegram = window.Telegram.WebApp;
telegram.expand();

// TonConnect init
const tonConnectUI = new TonConnectUI.TonConnectUI();
let wallet = null;

// UI elements
const connectContainer = document.getElementById('connect-container');
const tonBalanceEl = document.getElementById('ton-balance');
const mrscamBalanceEl = document.getElementById('mrscam-balance');
const profileWallet = document.getElementById('wallet-address');

const tonModal = document.getElementById('ton-modal');
const tonAmount = document.getElementById('ton-amount');
const tonSubmit = document.getElementById('ton-submit');

const starsModal = document.getElementById('stars-modal');
const starsAmount = document.getElementById('stars-amount');
const starsSubmit = document.getElementById('stars-submit');

connectContainer.addEventListener('click', async () => {
  if (!wallet) {
    wallet = await tonConnectUI.connect();
    profileWallet.textContent = wallet.account.address;
    updateBalances();
  } else {
    await tonConnectUI.disconnect();
    wallet = null;
    profileWallet.textContent = 'Подключить кошелёк';
    tonBalanceEl.textContent = '0.00';
    mrscamBalanceEl.textContent = '0.00';
  }
});

async function updateBalances() {
  if (!wallet) return;
  try {
    // Получение баланса TON
    const provider = new TonConnectUI.TonConnectProvider({wallet});
    const balance = await provider.getBalance();
    tonBalanceEl.textContent = (balance / 1e9).toFixed(2);
    // Здесь можно добавить получение баланса Mr.Scam токена
    mrscamBalanceEl.textContent = '123.45'; // пример
  } catch(e) {
    console.error(e);
  }
}

// Модалки TON
document.getElementById('payment-btn').addEventListener('click', () => {
  tonModal.classList.add('active');
});

tonSubmit.addEventListener('click', async () => {
  const amount = parseFloat(tonAmount.value);
  if (!wallet || isNaN(amount) || amount <= 0) return;
  try {
    const provider = new TonConnectUI.TonConnectProvider({wallet});
    await provider.sendTransaction({to: 'RECEIVER_ADDRESS', value: Math.round(amount*1e9)});
    alert('TON успешно отправлены!');
    tonModal.classList.remove('active');
    updateBalances();
  } catch(e) {
    alert('Ошибка при отправке TON');
    console.error(e);
  }
});

// Модалки Stars
document.getElementById('pay-stars-btn').addEventListener('click', () => {
  starsModal.classList.add('active');
});

starsSubmit.addEventListener('click', async () => {
  const amount = parseInt(starsAmount.value);
  if (!wallet || isNaN(amount) || amount <= 0) return;
  try {
    // Telegram WebApp payment для Stars
    await telegram.sendData(JSON.stringify({stars: amount}));
    alert('Stars успешно отправлены!');
    starsModal.classList.remove('active');
  } catch(e) {
    alert('Ошибка при отправке Stars');
    console.error(e);
  }
});

// Закрытие модалок
document.querySelectorAll('.modal-close').forEach(el => el.addEventListener('click', () => {
  el.closest('.modal').classList.remove('active');
}));

// Профиль вкладки
document.querySelectorAll('.profile-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Bottom nav
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    if(item.id==='profile-btn') document.getElementById('profile-section').classList.add('active');
    if(item.id==='market-btn') document.getElementById('play-section').classList.add('active');
    if(item.id==='events-btn') document.getElementById('staking-section').classList.add('active');
    if(item.id==='giveaway-btn') document.getElementById('tasks-section').classList.add('active');
  });
});
