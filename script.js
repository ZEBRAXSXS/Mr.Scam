import { TonConnectUI } from '@tonconnect/ui';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://raw.githubusercontent.com/ton-community/tonconnect-manifests/main/manifests/template.json'
});

const statusEl = document.getElementById('status');

tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        const addr = wallet.account.address;
        statusEl.textContent = `Подключён: \( {addr.slice(0,6)}... \){addr.slice(-4)}`;
    } else {
        statusEl.textContent = 'Статус: кошелёк не подключён';
    }
});

document.getElementById('connect').onclick = async () => {
    await tonConnectUI.connectWallet();
};

document.getElementById('pay-ton').onclick = async () => {
    if (!tonConnectUI.connected) {
        return alert('⚠ Сначала подключи кошелёк!');
    }

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
            address: "UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD",
            amount: "50000000" // 0.05 TON
        }]
    };

    try {
        await tonConnectUI.sendTransaction(transaction);
        alert('✅ Платёж прошёл! Деньги пришли ко мне 💰');
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
};

document.getElementById('pay-stars').onclick = () => {
    tg.showPopup({
        title: "Оплата Stars",
        message: "Купить премиум за 50 Telegram Stars?",
        buttons: [{ type: "pay", text: "Оплатить 50 ⭐" }]
    });
};
