// Инициализация TONConnect
const tonConnect = new TonConnectUI.TonConnectUI({ manifestUrl: "https://yourdomain.com/tonconnect-manifest.json" });
let wallet = null;

const connectBtn = document.getElementById('connect-container');
connectBtn.onclick = async () => {
  try {
    wallet = await tonConnect.connect();
    document.getElementById('wallet-address').innerText = wallet.account;
    updateBalance();
  } catch(e) { console.error(e); }
};

async function updateBalance() {
  if (!wallet) return;
  const bal = await wallet.getBalance();
  document.getElementById('ton-balance').innerText = bal.toFixed(2);
}

// Модалки TON и Stars
const tonModal = document.getElementById('ton-modal');
const starsModal = document.getElementById('stars-modal');
document.getElementById('payment-btn').onclick = () => tonModal.classList.add('active');
document.getElementById('pay-stars-btn').onclick = () => starsModal.classList.add('active');
document.querySelectorAll('.modal-close').forEach(btn => btn.onclick = () => btn.parentElement.parentElement.classList.remove('active'));

// Отправка TON
document.getElementById('ton-submit').onclick = async () => {
  const amount = parseFloat(document.getElementById('ton-amount').value);
  if (!wallet || isNaN(amount) || amount <= 0) return alert('Введите сумму TON');
  await wallet.sendTransaction({ to: 'RECIPIENT_ADDRESS', value: amount });
  tonModal.classList.remove('active');
  updateBalance();
};

// Отправка Stars (через Telegram WebApp)
document.getElementById('stars-submit').onclick = () => {
  const amount = parseInt(document.getElementById('stars-amount').value);
  if (isNaN(amount) || amount <= 0) return alert('Введите количество Stars');
  Telegram.WebApp.sendData(JSON.stringify({ type:'stars', amount }));
  starsModal.classList.remove('active');
};

// Tabs
document.querySelectorAll('.profile-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  };
});
