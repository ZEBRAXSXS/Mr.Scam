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

// Глобальная переменная TON_CONNECT_UI (non-module)
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
  buttonRootId: 'connect-container',
  actionsConfiguration: {
    twaReturnUrl: 'https://t.me/ТВОЙ_БОТ_ЮЗЕРНЕЙМ'  // ← Замени на юзернейм бота!
  }
});

let connectedWallet = null;
tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    connectedWallet = wallet.account.address;
    document.getElementById('wallet-status').innerHTML = `Кошелёк подключён:<br><strong>\( {connectedWallet.slice(0,8)}... \){connectedWallet.slice(-6)}</strong>`;
    document.getElementById('payment-section').style.display = 'block';
  } else {
    connectedWallet = null;
    document.getElementById('wallet-status').textContent = 'Кошелёк: не подключён';
    document.getElementById('payment-section').style.display = 'none';
  }
});

document.getElementById('payment-btn').onclick = async () => {
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [{
      address: 'UQBpBH_apAYKPChl7V1wfEeZ1JovWFIr2VXfzTVUVQfDXHrZ',
      amount: '50000000'
    }]
  };

  try {
    await tonConnectUI.sendTransaction(transaction);
    alert('✅ 0.05 TON внесено! Деньги у тебя 😈');
  } catch (e) {
    alert('❌ Ошибка или отменено');
  }
};
