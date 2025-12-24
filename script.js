import { TonConnectUI } from '@tonconnect/ui';
const tg = Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe?.user;

if (!user) {
    alert("❌ Нет данных пользователя Telegram");
} else {
    const userId = user.id;
    const username = user.username || "guest";
    console.log("User:", userId, username);
}
if (!window.Telegram || !Telegram.WebApp) {
    alert("❌ Открой Mini App через Telegram!");
} else {
    console.log("✅ Telegram Mini App OK");
}const tg = window.Telegram.WebApp;
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

// Получаем ID Telegram пользователя
const userId = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'guest' + Math.random().toString(36).substr(2, 9);

// Кликер с бустом
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;
let boost = 1;
document.getElementById('score').textContent = `Очки: ${score}`;
document.getElementById('clicker').onclick = () => {
    score += boost;
    document.getElementById('score').textContent = `Очки: ${score}`;
    localStorage.setItem('score', score);
    updateLeaderBoard();
};

// Буст
document.getElementById('boost').onclick = () => {
    boost = 2;
    setTimeout(() => boost = 1, 10000); // 10 сек
};

// Лидерборд (локальный, с ID Telegram)
const leaderTable = document.getElementById('leader-table');
function updateLeaderBoard() {
    let leaders = localStorage.getItem('leaders') ? JSON.parse(localStorage.getItem('leaders')) : [];
    let userIndex = leaders.findIndex(l => l.id === userId);
    if (userIndex !== -1) {
        leaders[userIndex].score = score;
    } else {
        leaders.push({ id: userId, score: score });
    }
    leaders.sort((a, b) => b.score - a.score);
    localStorage.setItem('leaders', JSON.stringify(leaders));
    leaderTable.innerHTML = leaders.map(l => `<tr><td>\( {l.id}</td><td> \){l.score}</td></tr>`).join('');
}
updateLeaderBoard();

// Онлайн (фейк, для реального нужен сервер с websocket)
document.getElementById('online').textContent = `Онлайн: ${Math.floor(Math.random() * 10 + 1)}`; // Фейк онлайн 1-10

// Платёж TON
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

// Платёж Stars (с твоим токеном)
document.getElementById('pay-stars').onclick = () => {
    const botToken = '8359777141:AAH9OntSa1yv52OGCntaKUrszTvAcHp1tnA';
    tg.sendInvoice(
        botToken,
        'Премиум в Mr. Scam',
        'Получи премиум за 50 Stars',
        'payload_50_stars',
        'XTR',
        [{ label: '50 Stars', amount: 5000 }]
    );
};
 
