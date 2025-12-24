import { TonConnectUI } from './tonconnect-ui.min.js';

const tg = window.Telegram.WebApp;
tg.ready();

const user = tg.initDataUnsafe?.user;
let userId = 'guest';
let username = 'guest';

if (user) {
    userId = user.id;
    username = user.username || `guest${Math.floor(Math.random()*1000)}`;
    const firstName = user.first_name || '';
    document.getElementById('profile').textContent = `Профиль: ${firstName} (@${username})`;
} else {
    document.getElementById('profile').textContent = 'Профиль: Гость';
}

// TonConnect
const tonConnectUI = new TonConnectUI({
    manifestUrl: './tonconnect-manifest.json',
    buttonRootId: 'ton-connect-button'
});

const balanceEl = document.getElementById('balance');
let balance = parseInt(localStorage.getItem('balance')) || 0;
balanceEl.textContent = `Баланс: ${balance} TON`;

function updateBalance(amount) {
    balance += amount;
    localStorage.setItem('balance', balance);
    balanceEl.textContent = `Баланс: ${balance} TON`;
}

// TON Payment
document.getElementById('pay-ton').onclick = async () => {
    if (!tonConnectUI.connected) {
        return alert('⚠ Сначала подключи кошелёк!');
    }

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
            address: "ВАШ_ТОН_АДРЕС",
            amount: "1000000" // 0.01 TON
        }]
    };

    try {
        await tonConnectUI.sendTransaction(transaction);
        updateBalance(1); // увеличиваем баланс для примера
        alert('✅ Платёж прошёл!');
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
};

// Лидерборд
const leaderTable = document.getElementById('leader-table');
function updateLeaderBoard() {
    let leaders = localStorage.getItem('leaders') ? JSON.parse(localStorage.getItem('leaders')) : [];
    let userIndex = leaders.findIndex(l => l.id === userId);
    if (userIndex !== -1) {
        leaders[userIndex].balance = balance;
    } else {
        leaders.push({ id: userId, username: username, balance: balance });
    }
    leaders.sort((a,b) => b.balance - a.balance);
    localStorage.setItem('leaders', JSON.stringify(leaders));
    leaderTable.innerHTML = leaders.map(l => `<tr><td>${l.username}</td><td>${l.balance}</td></tr>`).join('');
}
updateLeaderBoard();
