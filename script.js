/*
  script.js — минимальная рабочая версия
  - показывает Telegram профиль (username/id) при запуске внутри Mini App
  - инициализирует TonConnect UI (через глобальную переменную из CDN)
  - отправляет тестовую транзакцию (0.05 TON) через TonConnect
*/

/// Проверка — открыт ли WebApp внутри Telegram
if (!window.Telegram || !Telegram.WebApp) {
  alert("Открой это в Telegram (через бота) — Mini App должен быть запущен внутри Telegram.");
  // дальше не продолжать
}

const tg = Telegram.WebApp;
tg.ready();
tg.expand?.(); // расширить WebApp если доступно

// Получаем профиль
const user = tg.initDataUnsafe?.user;
if (!user) {
  // Защитная мера: если нет user — покажем про это через alert
  alert("Нет данных пользователя: откройте мини-апп через телеграм-бота (https://t.me/your_bot/app).");
}
const userId = user?.id || 'guest_' + Math.random().toString(36).slice(2,8);
const username = user?.username || (user?.first_name ? (user.first_name + (user.last_name ? ' ' + user.last_name : '')) : 'guest');

// Показываем профиль в DOM
document.getElementById('profile').textContent = `Профиль: ${username}`;
document.getElementById('userId').textContent = `ID: ${userId}`;

// --- TON Connect init ---
// Используем UMD-версию, доступную как window.TonConnectUI
const TonConnectUI = (window.TonConnectUI && (window.TonConnectUI.TonConnectUI || window.TonConnectUI)) || null;

if (!TonConnectUI) {
  // На проде обычно работает; если не — покажем ошибку
  alert("Ошибка: TonConnect UI не загружен. Проверьте доступ к https://unpkg.com/@tonconnect/ui.");
}

const manifestUrl = location.origin + '/tonconnect-manifest.json'; // должен быть доступен на Vercel

const tonConnectUI = new TonConnectUI({
  manifestUrl,
  buttonRootId: 'ton-connect-button'
});

const statusEl = document.getElementById('status');

// слушаем изменение статуса кошелька
if (typeof tonConnectUI.onStatusChange === 'function') {
  tonConnectUI.onStatusChange((wallet) => {
    if (wallet) {
      try {
        const addr = wallet.account.address || wallet.account?.address || String(wallet);
        statusEl.textContent = `Подключён: ${String(addr).slice(0,6)}...${String(addr).slice(-4)}`;
      } catch (e) {
        statusEl.textContent = 'Подключён (адрес недоступен)';
      }
    } else {
      statusEl.textContent = 'Статус: кошелёк не подключён';
    }
  });
} else {
  // fallback: покажем текущий статус (если доступен)
  statusEl.textContent = 'TonConnect инициализирован';
}

// --- простой кликер ---
let score = parseInt(localStorage.getItem(`score_${userId}`) || '0', 10);
let boost = 1;
const scoreEl = document.getElementById('score');
scoreEl.textContent = `Очки: ${score}`;

document.getElementById('clicker').addEventListener('click', () => {
  score += boost;
  scoreEl.textContent = `Очки: ${score}`;
  localStorage.setItem(`score_${userId}`, String(score));
  updateLeaderBoard();
});

document.getElementById('boost').addEventListener('click', () => {
  boost = 2;
  setTimeout(() => { boost = 1; }, 10000);
});

// Лидерборд в localStorage (локально)
function updateLeaderBoard() {
  let leaders = JSON.parse(localStorage.getItem('leaders_v1') || '[]');
  const idx = leaders.findIndex(l => l.id === userId);
  if (idx >= 0) leaders[idx].score = score;
  else leaders.push({ id: userId, username, score });
  leaders.sort((a,b) => b.score - a.score);
  localStorage.setItem('leaders_v1', JSON.stringify(leaders));
  document.getElementById('leader-table').innerHTML = leaders.map(l => `<tr><td>${l.username}</td><td>${l.score}</td></tr>`).join('');
}
updateLeaderBoard();

// --- Отправка TON (пример) ---
document.getElementById('pay-ton').addEventListener('click', async () => {
  if (!tonConnectUI) return alert('TonConnect недоступен');

  // Проверим, подключён ли кошелёк
  if (!tonConnectUI.connected) {
    // Попробуем показать кнопку подключения (TonConnectUI рендерит кнопку сам в #ton-connect-button)
    alert('Подключи кошелёк через кнопку выше, затем повтори оплату.');
    return;
  }

  // Пример транзакции: адрес и сумма (0.05 TON = 50_000_000 nanoton)
  const transaction = {
    validUntil: Math.floor(Date.now()/1000) + 300,
    messages: [{
      address: "UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD",
      amount: "50000000"
    }]
  };

  try {
    // Отправляем транзакцию через tonConnectUI
    await tonConnectUI.sendTransaction(transaction);
    alert('✅ Транзакция отправлена (попробуй проверить в кошельке отправителя).');
  } catch (err) {
    alert('Ошибка отправки транзакции: ' + (err?.message || JSON.stringify(err)));
  }
});
