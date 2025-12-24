import { TonConnectUI } from '@tonconnect/ui';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
    buttonRootId: 'ton-connect-button'
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

// Платёж TON (работает без токена)
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

// Платёж Stars — теперь с токеном бота
document.getElementById('pay-stars').onclick = () => {
    const botToken = '8359777141:AAH9OntSa1yv52OGCntaKUrszTvAcHp1tnA'; // Твой токен

    tg.sendInvoice(
        botToken,
        'Премиум в Mr. Scam', // title
        'Получи премиум-функции за 50 Stars', // description
        'payload_50_stars', // payload
        'XTR', // currency = Telegram Stars
        [{ label: '50 Stars', amount: 5000 }] // 50 Stars = 5000 cents
    );
};
