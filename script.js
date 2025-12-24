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

// TonConnect UI
const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
  buttonRootId: 'connect-wallet'
});

let connectedWallet = null;
tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    connectedWallet = wallet.account.address;
    document.getElementById('wallet-status').textContent = connectedWallet.slice(0,6) + '...' + connectedWallet.slice(-4);
  } else {
    connectedWallet = null;
    document.getElementById('wallet-status').textContent = 'не подключён';
  }
});

// Отправка 0.05 TON НА ТВОЙ АДРЕС
document.getElementById('send-ton').onclick = async () => {
  if (!connectedWallet) return alert('⚠️ Сначала подключите кошелёк!');

  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 360,
    messages: [{
      address: 'UQBpBH_apAYKPChl7V1wfEeZ1JovWFIr2VXfzTVUVQfDXHrZ',  // ← Твой адрес, всё ок!
      amount: '50000000'  // 0.05 TON в нанотонах
    }]
  };

  try {
    await tonConnectUI.sendTransaction(transaction);
    alert('✅ Успешно внесено 0.05 TON в Mr.Scam!\nДеньги пришли на твой кошелёк 😈');
    // Позже добавим начисление бонусов в игру
  } catch (e) {
    alert('❌ Ошибка или отменено: ' + (e.message || ''));
  }
};
