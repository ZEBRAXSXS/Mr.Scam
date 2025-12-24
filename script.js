import { TonConnectUI } from '@tonconnect/ui';

// --- Проверка Mini App ---
if (!window.Telegram || !Telegram.WebApp) {
    alert("❌ Открой Mini App через Telegram!");
}

const tg = Telegram.WebApp;
tg.ready();

// --- Telegram пользователь ---
const user = tg.initDataUnsafe?.user;
if (!user) {
    alert("❌ Нет данных пользователя Telegram");
}
const userId = user.id;
const username = user.username || "guest";

// --- Отображаем профиль ---
document.getElementById('username').textContent = `Username: ${username}`;
document.getElementById('userId').textContent = `User ID: ${userId}`;

// --- TON Connect ---
const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
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

// --- Кликер и буст ---
let score = localStorage.getItem(`score_${userId}`) ? parseInt(localStorage.getItem(`score_${userId}`)) : 0;
let boost = 1;
document.getElementById('score').textContent = `Очки: ${score}`;

document.getElementById('clicker').onclick = () => {
    score += boost;
    document.getElementById('score').textContent = `Очки: ${score}`;
    localStorage.setItem(`score_${userId}`, score);
    updateLeaderBoard();
};

document.getElementById('boost').onclick = () => {
    boost = 2;
    setTimeout(() => boost = 1, 10000);
};

// --- Лидерборд ---
const leaderTable = document.getElementById('leader-table');
function updateLeaderBoard() {
    let leaders = localStorage.getItem('leaders') ? JSON.parse(localStorage.getItem('leaders')) : [];
    const index = leaders.findIndex(l => l.id === userId);
    if (index >= 0) leaders[index].score = score;
    else leaders.push({ id: userId, username, score });
    leaders.sort((a,b)=>b.score-b.score);
    localStorage.setItem('leaders', JSON.stringify(leaders));
    leaderTable.innerHTML = leaders.map(l => `<tr><td>${l.username}</td><td>${l.score}</td></tr>`).join('');
}
updateLeaderBoard();

// --- Платёж TON ---
document.getElementById('pay-ton').onclick = async () => {
    if (!tonConnectUI.connected) return alert('⚠ Сначала подключи кошелёк!');
    const transaction = {
        validUntil: Math.floor(Date.now()/1000)+300,
        messages:[{address:"UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD", amount:"50000000"}]
    };
    try {
        await tonConnectUI.sendTransaction(transaction);
        alert('✅ Платёж прошёл!');
    } catch(e) {
        alert('❌ Ошибка: ' + e.message);
    }
};

// --- Stars через backend ---
document.getElementById('pay-stars').onclick = () => {
    fetch('/api/stars', {
        method:'POST',
        body: JSON.stringify({ userId })
    })
    .then(res=>res.json())
    .then(r=>alert(r.message))
    .catch(e=>alert("❌ Ошибка: "+e.message));
};
