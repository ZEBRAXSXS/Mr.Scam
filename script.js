import { TonConnectUI } from './tonconnect-ui.min.js';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// TonConnect UI
const tonConnectUI = new TonConnectUI({
    manifestUrl: './tonconnect-manifest.json',
    buttonRootId: 'ton-connect-button'
});

const statusEl = document.getElementById('status');

tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        const addr = wallet.account.address;
        statusEl.textContent = `Подключён кошелёк: ${addr}`;
    } else {
        statusEl.textContent = 'Статус: кошелёк не подключён';
    }
});

// Telegram профиль
const userId = tg.initDataUnsafe?.user?.id;
const username = tg.initDataUnsafe?.user?.username || 'guest';
const firstName = tg.initDataUnsafe?.user?.first_name || '';
document.getElementById('profile').textContent = `Профиль: ${username} (${firstName})`;

// Кнопка для тестового перевода TON
document.getElementById('pay-ton').onclick = async () => {
    if (!tonConnectUI.connected) {
        alert('⚠ Сначала подключите кошелёк!');
        return;
    }

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
            address: "UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD",
            amount: "1000000" // 0.001 TON
        }]
    };

    try {
        await tonConnectUI.sendTransaction(transaction);
        alert('✅ Платёж прошёл!');
    } catch (err) {
        alert('❌ Ошибка: ' + err.message);
    }
};

// Лидерборд
async function updateLeaderboard() {
    try {
        const res = await fetch('./api/leaderboard.js');
        const data = await res.json();
        const table = document.getElementById('leader-table');
        table.innerHTML = data.leaderboard.map(u => `<tr><td>${u.username}</td><td>${u.balance}</td></tr>`).join('');
    } catch (err) {
        console.error(err);
    }
}
updateLeaderboard();
