import { TonConnectUI } from './tonconnect-ui.min.js';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let userId = tg.initDataUnsafe.user.id;
let username = tg.initDataUnsafe.user.username || "guest";

const profileEl = document.getElementById('profile');
const leaderTable = document.getElementById('leader-table');
let tonConnectUI = null;
let wallet = null;

// Инициализация TonConnect
document.getElementById('connect-ton').onclick = async () => {
  if(!tonConnectUI) {
    tonConnectUI = new TonConnectUI({ manifestUrl: './tonconnect-manifest.json', buttonRootId: 'connect-ton' });
    tonConnectUI.onStatusChange(w => {
      wallet = w;
      if(wallet) profileEl.textContent = `Подключён: ${username} (${wallet.account.address.slice(0,6)}...${wallet.account.address.slice(-4)})`;
      else profileEl.textContent = 'Статус: кошелёк не подключён';
    });
  }
  await tonConnectUI.connect();
};

// Отправка TON
document.getElementById('pay-ton').onclick = async () => {
  if(!wallet) return alert('⚠ Подключите кошелёк!');
  try {
    const tx = {
      validUntil: Math.floor(Date.now()/1000) + 300,
      messages: [{ address: "UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD", amount: "50000000" }]
    };
    await tonConnectUI.sendTransaction(tx);
    alert('✅ Платёж отправлен!');
  } catch(e) {
    alert('❌ Ошибка: ' + e.message);
  }
};

// Лидерборд
async function updateLeaderBoard() {
  try {
    const res = await fetch('/api/leaderboard.js');
    const data = await res.json();
    leaderTable.innerHTML = data.map(u => `<tr><td>${u.username}</td><td>${u.balance}</td></tr>`).join('');
  } catch(e) {
    console.log('Ошибка лидерборда', e);
  }
}

updateLeaderBoard();
