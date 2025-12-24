import { TonConnectUI } from './tonconnect-ui.min.js';

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Telegram user
const user = tg.initDataUnsafe?.user;
const userId = user?.id || 'guest' + Math.random().toString(36).substr(2, 6);
const username = user?.username || 'guest';
const firstName = user?.first_name || 'Игрок';
document.getElementById('welcome').textContent = `Привет, ${firstName}! @${username}`;

// TonConnect
const tonConnectUI = new TonConnectUI({
    manifestUrl: './tonconnect-manifest.json',
    buttonRootId: 'ton-connect-button'
});

const statusEl = document.getElementById('status');
tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        const addr = wallet.account.address;
        statusEl.textContent = `Подключён: ${addr.slice(0,6)}...${addr.slice(-4)}`;
    } else {
        statusEl.textContent = 'Статус: кошелёк не подключён';
    }
});

// Кликер
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
    setTimeout(() => boost = 1, 10000);
};

// Лидерборд
const leaderTable = document.getElementById('leader-table');
function updateLeaderBoard() {
    let leaders = localStorage.getItem('leaders') ? JSON.parse(localStorage.getItem('leaders')) : [];
    let userIndex = leaders.findIndex(l => l.id === userId);
    if (userIndex !== -1) leaders[userIndex].score = score;
    else leaders.push({id: userId, score});
    leaders.sort((a,b) => b.score - a.score);
    localStorage.setItem('leaders', JSON.stringify(leaders));
    leaderTable.innerHTML = leaders.map(l => `<tr><td>${l.id}</td><td>${l.score}</td></tr>`).join('');
}
updateLeaderBoard();

// Онлайн фейковый
document.getElementById('online').textContent = `Онлайн: ${Math.floor(Math.random()*10+1)}`;

// Платёж TON
document.getElementById('pay-ton').onclick = async () => {
    if (!tonConnectUI.connected) return alert('⚠ Сначала подключи кошелёк!');
    const transaction = {
        validUntil: Math.floor(Date.now()/1000) + 300,
        messages: [{
            address: "UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD",
            amount: "50000000" // 0.05 TON
        }]
    };
    try {
        await tonConnectUI.sendTransaction(transaction);
        alert('✅ Платёж прошёл!');
    } catch(e) {
        alert('❌ Ошибка: ' + e.message);
    }
};
