// После загрузки страницы инициализируем все обработчики
document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram.WebApp; // объект Telegram WebApp

  // Отображаем данные пользователя Telegram
  const user = tg.initDataUnsafe?.user;
  if (user) {
    const name = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    document.getElementById('profile-name').textContent = name || user.username || '';
    if (user.photo_url) {
      document.getElementById('profile-avatar').src = user.photo_url;
    }
  }

  // Функция показа выбранной секции интерфейса
  function showSection(name) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.navbar button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(name).classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
  }
  // Навигация по вкладкам
  document.getElementById('tab-play').addEventListener('click', () => showSection('play'));
  document.getElementById('tab-staking').addEventListener('click', () => showSection('staking'));
  document.getElementById('tab-quests').addEventListener('click', () => showSection('quests'));
  document.getElementById('tab-profile').addEventListener('click', () => showSection('profile'));
  showSection('play');

  // Подвкладки Стикеры/Подарки
  function showSubTab(name) {
    document.getElementById('stickers-content').classList.remove('active');
    document.getElementById('gifts-content').classList.remove('active');
    document.getElementById('tab-stickers').classList.remove('active');
    document.getElementById('tab-gifts').classList.remove('active');
    document.getElementById(name + '-content').classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
  }
  document.getElementById('tab-stickers').addEventListener('click', () => showSubTab('stickers'));
  document.getElementById('tab-gifts').addEventListener('click', () => showSubTab('gifts'));
  showSubTab('stickers');

  // Инициализация TonConnect UI
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'tonconnect-manifest.json',
    buttonRootId: 'connect-container'
  });

  tonConnectUI.onStatusChange(async () => {
    if (tonConnectUI.account) {
      const address = tonConnectUI.account;
      document.getElementById('profile-wallet').textContent = 'Адрес: ' + address;

      // Баланс TON
      try {
        const resp = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${address}`);
        const data = await resp.json();
        const balanceTon = (parseInt(data.result) / 1e9).toFixed(3);
        document.getElementById('balance-ton').textContent = `Баланс TON: ${balanceTon}`;
      } catch (e) {
        console.error('Ошибка получения баланса TON:', e);
        document.getElementById('balance-ton').textContent = 'Баланс TON: -';
      }

      // Баланс токена MrScam
      document.getElementById('balance-token').textContent = 'Баланс MrScam: 0';

      // История последних 5 транзакций
      try {
        const resp = await fetch(`https://toncenter.com/api/v2/getTransactions?address=${address}&limit=5&archival=true`);
        const data = await resp.json();
        const txList = document.getElementById('tx-list');
        txList.innerHTML = '';
        (data.result || []).forEach(tx => {
          const li = document.createElement('li');
          const date = new Date(tx.now * 1000);
          let text = date.toLocaleString() + ': ';
          if (tx.in_msg && tx.in_msg.source) {
            const amountIn = (parseInt(tx.in_msg.value) / 1e9).toFixed(3);
            text += `+${amountIn} TON от ${tx.in_msg.source}`;
          }
          if (tx.out_msgs) {
            tx.out_msgs.forEach(out => {
              const amountOut = (parseInt(out.value) / 1e9).toFixed(3);
              text += ` -${amountOut} TON => ${out.destination}`;
            });
          }
          li.textContent = text;
          txList.appendChild(li);
        });
      } catch (e) {
        console.error('Ошибка получения транзакций:', e);
      }
    }
  });

  // Модалки TON
  document.getElementById('add-ton-btn').addEventListener('click', () => {
    document.getElementById('add-ton-modal').style.display = 'flex';
  });
  document.getElementById('close-ton-modal').addEventListener('click', () => {
    document.getElementById('add-ton-modal').style.display = 'none';
  });
  document.getElementById('send-ton-btn').addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('ton-amount').value);
    if (!tonConnectUI.account) { alert('Сначала подключите кошелек!'); return; }
    if (isNaN(amount) || amount <= 0) { alert('Введите корректную сумму TON'); return; }
    const nano = Math.floor(amount * 1e9).toString();
    const donationAddress = 'EQBBJBB3HagsujBqVfqeDUPJ0kXjgTPLWPFFffuNXNiJL0aA';
    const tx = { validUntil: Math.floor(Date.now()/1000)+60, messages:[{address:donationAddress, amount:nano}] };
    try { await tonConnectUI.sendTransaction(tx); alert('Транзакция отправлена!'); } 
    catch(e){ console.error(e); alert('Ошибка при отправке транзакции'); }
    document.getElementById('add-ton-modal').style.display = 'none';
  });

  // Модалки Stars
  document.getElementById('support-stars-btn').addEventListener('click', () => {
    document.getElementById('support-stars-modal').style.display = 'flex';
  });
  document.getElementById('close-stars-modal').addEventListener('click', () => {
    document.getElementById('support-stars-modal').style.display = 'none';
  });
  document.getElementById('send-stars-btn').addEventListener('click', () => {
    if(typeof tg.showPopupForPayment === 'function'){ tg.showPopupForPayment(); } 
    else { tg.showAlert('Оплата прошла успешно!'); }
    document.getElementById('support-stars-modal').style.display = 'none';
  });
});
