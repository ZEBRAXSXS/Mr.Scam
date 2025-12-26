window.addEventListener('load', () => {
  const tg = window.Telegram.WebApp;

  if (!tg.initDataUnsafe || !tg.initData) {
    document.getElementById('app').style.display = 'none';
    document.getElementById('blocked').style.display = 'block';
    return;
  }

  tg.expand();
  tg.ready();

  const usernameEl = document.getElementById('username');
  let username = 'Guest';
  if (tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    username = user.username ? '@' + user.username : user.first_name || 'User';
  }
  usernameEl.textContent = 'Профиль: ' + username;

  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
    buttonRootId: 'connect-container',
    actionsConfiguration: {
      twaReturnUrl: 'https://t.me/mrscam_test_bot'
    }
  });

  let connectedWallet = null;
  tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
      connectedWallet = wallet.account.address;
      document.getElementById('payment-section').style.display = 'block';
    } else {
      connectedWallet = null;
      document.getElementById('payment-section').style.display = 'none';
    }
  });

  document.getElementById('payment-btn').onclick = async () => {
    if (!connectedWallet) {
      alert('⚠️ Подключите кошелёк сначала!');
      return;
    }

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: 'UQBxxQgA8-hj4UqV-UGNyg8AqOcLYWPsJ4c_3ybg8dyH7jiD',
        amount: '300000000'
      }]
    };

    try {
      await tonConnectUI.sendTransaction(transaction);
      alert('✅ 0.3 TON успешно внесено!');
    } catch (e) {
      alert('❌ Транзакция отменена или ошибка');
    }
  };

  // Новая оплата Stars — напрямую через WebApp (без backend, без промо-страниц)
  document.getElementById('pay-stars-btn').onclick = () => {
    tg.sendInvoice(
      'support_1_star',                          // payload (уникальный)
      'Поддержка разработчику',                  // title
      'Спасибо за 1 Telegram Star! ❤️',          // description
      'XTR',                                     // currency
      [{ label: 'Поддержка', amount: 1 }],       // цена: 1 Star
      {                                      // опции
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        is_flexible: false
      },
      (invoiceStatus) => {
        if (invoiceStatus === 'paid') {
          alert('✅ Спасибо огромное за поддержку! ❤️');
        } else if (invoiceStatus === 'cancelled') {
          alert('Оплата отменена');
        }
      }
    );
  };
});
