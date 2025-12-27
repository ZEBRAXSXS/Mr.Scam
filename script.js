import { TonConnectUI } from '@tonconnect/ui';

window.addEventListener('load', () => {
  const tg = window.Telegram.WebApp;

  if (!tg.initDataUnsafe || !tg.initData) {
    document.getElementById('app').style.display = 'none';
    document.getElementById('blocked').style.display = 'block';
    return;
  }

  tg.expand();
  tg.ready();

  // Аватар и имя (твой код)
  let username = 'Guest';
  let avatarUrl = '';
  if (tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    username = user.username ? user.username : (user.first_name || 'User');
    if (user.photo_url) avatarUrl = user.photo_url;
  }
  document.getElementById('username').textContent = username;
  const avatarEl = document.getElementById('user-avatar');
  if (avatarUrl) avatarEl.src = avatarUrl;

  // TON Connect (актуальный импорт)
  const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://mr-scam.vercel.app/tonconnect-manifest.json',
    buttonRootId: 'connect-container',
    actionsConfiguration: { twaReturnUrl: 'https://t.me/mrscam_test_bot' }
  });

  let connectedWallet = null;
  tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
      connectedWallet = wallet.account.address;
    } else {
      connectedWallet = null;
    }
  });

  // Твой код модалей, оплаты TON, Stars, табов и навигации (оставляю как был)
  // ... (весь твой остальной код из последнего сообщения) ...

  // (не меняю ничего другого)
});
