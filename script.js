const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

if (!tg.initDataUnsafe.user) {
    document.getElementById('app').style.display = 'none';
    document.getElementById('blocked').style.display = 'block';
    return;
}

// Пользователь Telegram
const user = tg.initDataUnsafe.user;
const userId = user.id;
const username = user.username ? '@' + user.username : user.first_name || 'User';
document.getElementById('username').textContent = 'Профиль: ' + username;

// TON Connect (твой рабочий)
const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
    buttonRootId: 'connect-container'
});

// Тапалка
let score = parseInt(localStorage.getItem(`score_${userId}`)) || 0;
let multiplier = 1;
document.getElementById('score').textContent = score;

document.getElementById('clicker-area').onclick = () => {
    score += multiplier;
    document.getElementById('score').textContent = score;
    localStorage.setItem(`score_${userId}`, score);
    updateLeaderboard();
};

// Буст
document.getElementById('boost').onclick = () => {
    multiplier = 2;
    setTimeout(() => multiplier = 1, 10000);
    alert('Буст x2 активирован на 10 сек!');
};

// Лидерборд (локальный, по userId)
function updateLeaderboard() {
    let leaders = JSON.parse(localStorage.getItem('leaders') || '[]');
    const userEntry = leaders.find(l => l.id === userId);
    if (userEntry) {
        userEntry.score = score;
    } else {
        leaders.push({ id: userId, username, score });
    }
    leaders.sort((a, b) => b.score - a.score);
    localStorage.setItem('leaders', JSON.stringify(leaders));

    const table = document.getElementById('leader-table');
    table.innerHTML = leaders.slice(0, 10).map((l, i) => `<tr><td>\( {i+1}</td><td> \){l.username || l.id}</td><td>${l.score}</td></tr>`).join('');
}
updateLeaderboard();

// Онлайн (фейк)
document.getElementById('online-count').textContent = Math.floor(Math.random() * 50 + 10);

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        document.getElementById(tab.dataset.tab).style.display = 'block';
    };
});

// Стикеры (если папка /stickers с изображениями stickers/1.png, 2.png и т.д.)
const gallery = document.getElementById('stickers-gallery');
for (let i = 1; i <= 10; i++) { // Замени на реальное количество
    const img = document.createElement('img');
    img.src = `stickers/${i}.png`;
    img.alt = `Sticker ${i}`;
    gallery.appendChild(img);
}

// Платёж TON (твой рабочий)
document.getElementById('pay-ton').onclick = async () => {
    if (!tonConnectUI.connected) {
        alert('Подключи кошелёк!');
        return;
    }

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
            address: "UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD",
            amount: "1000000000" // 1 TON
        }]
    };

    try {
        await tonConnectUI.sendTransaction(transaction);
        alert('1 TON внесено!');
    } catch (e) {
        alert('Ошибка: ' + e.message);
    }
};

// Платёж Stars (без токена в коде — работает в Mini App)
document.getElementById('pay-stars').onclick = () => {
    tg.sendInvoice(
        'Премиум в Mr. Scam',
        'Получи буст и стикеры за 50 Stars',
        'payload_stars_50',
        '', // пусто для Stars
        'XTR',
        [{ label: '50 Stars', amount: 5000 }]
    );
};
