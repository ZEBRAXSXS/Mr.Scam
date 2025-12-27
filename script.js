// TONConnect UI
const tonConnect = new TonConnectUI.TonConnectUI({ manifestUrl: "https://yourdomain.com/tonconnect-manifest.json" });
let wallet = null;

const connectContainer = document.getElementById('connect-container');
connectContainer.onclick = async () => {
  try {
    wallet = await tonConnect.connect();
    document.getElementById('profile-wallet').innerText = wallet.account;
    updateBalance();
  } catch(e){ console.error(e); }
};

async function updateBalance(){
  if(!wallet) return;
  const bal = await wallet.getBalance();
  document.getElementById('balance-ton').innerText = 'TON: ' + bal.toFixed(2);
}

// Модалки TON / Stars
const addTonModal = document.getElementById('add-ton-modal');
const supportStarsModal = document.getElementById('support-stars-modal');

document.getElementById('add-ton-btn').onclick = () => addTonModal.style.display = 'flex';
document.getElementById('support-stars-btn').onclick = () => supportStarsModal.style.display = 'flex';

document.getElementById('close-ton-modal').onclick = () => addTonModal.style.display = 'none';
document.getElementById('close-stars-modal').onclick = () => supportStarsModal.style.display = 'none';

// Отправка TON
document.getElementById('send-ton-btn').onclick = async () => {
  const amount = parseFloat(document.getElementById('ton-amount').value);
  if(!wallet || isNaN(amount) || amount <= 0) return alert('Введите корректную сумму TON');
  await wallet.sendTransaction({to: 'RECIPIENT_ADDRESS', value: amount});
  addTonModal.style.display = 'none';
  updateBalance();
  addTransaction('+'+amount+' TON');
};

// Отправка Stars через Telegram WebApp
document.getElementById('send-stars-btn').onclick = () => {
  const amount = parseInt(document.getElementById('stars-amount').value);
  if(isNaN(amount) || amount<=0) return alert('Введите количество Stars');
  Telegram.WebApp.sendData(JSON.stringify({type:'stars', amount}));
  supportStarsModal.style.display = 'none';
  addTransaction('+'+amount+' Stars');
};

function addTransaction(text){
  const li = document.createElement('li');
  li.textContent = text + ' | ' + new Date().toLocaleString();
  document.getElementById('tx-list').appendChild(li);
}

// Навигация по секциям
const tabs = ['play','staking','quests','profile'];
tabs.forEach(id=>{
  document.getElementById('tab-'+id).onclick = ()=>{
    tabs.forEach(tid=>document.getElementById(tid).classList.remove('active'));
    document.getElementById(id).classList.add('active');
  };
});

// Подвкладки Стикеры / Подарки
document.getElementById('tab-stickers').onclick = ()=>{
  document.getElementById('stickers-content').classList.add('active');
  document.getElementById('gifts-content').classList.remove('active');
};
document.getElementById('tab-gifts').onclick = ()=>{
  document.getElementById('gifts-content').classList.add('active');
  document.getElementById('stickers-content').classList.remove('active');
};
