window.addEventListener('load', async () => {
    const tg = window.Telegram.WebApp;
    if (!tg.initDataUnsafe || !tg.initData){
        document.getElementById('app').style.display='none';
        document.getElementById('blocked').style.display='block';
        return;
    }
    tg.expand(); tg.ready();

    const user = tg.initDataUnsafe.user;
    const userId = user ? user.id.toString() : 'guest';

    // UI
    document.getElementById('username').textContent = user?.username ? '@'+user.username : user?.first_name || 'User';
    document.getElementById('user-avatar').src = user?.photo_url || '/stickers/default.jpg';

    // TON Connect
    let tonConnectUI, connectedWallet=null;
    const walletBtn=document.getElementById('wallet-btn');
    function setConnectedUI(addr){
        if(addr){
            walletBtn.textContent='Отключить';
            walletBtn.className='disconnect-btn small';
            document.getElementById('connect-status').textContent='Статус: подключено';
            document.getElementById('wallet-address').textContent=addr.slice(0,6)+'...'+addr.slice(-4);
            connectedWallet=addr;
            updateWalletTonBalance(addr);
        } else {
            walletBtn.textContent='Подключить кошелёк';
            walletBtn.className='connect-btn small';
            document.getElementById('connect-status').textContent='Статус: не подключено';
            document.getElementById('wallet-address').textContent='Not connected';
            connectedWallet=null;
            document.getElementById('wallet-ton-balance').textContent='--';
        }
    }

    walletBtn.addEventListener('click', async ()=>{
        if(connectedWallet){
            try{ if(tonConnectUI.disconnect) await tonConnectUI.disconnect(); }catch{}
            setConnectedUI(null);
        } else {
            try{ await tonConnectUI.connect(); }catch(e){ alert('Ошибка подключения'); }
        }
    });

    try{
        tonConnectUI=new TON_CONNECT_UI.TonConnectUI({
            manifestUrl:'https://mr-scam.vercel.app/tonconnect-manifest.json',
            buttonRootId:'connect-container'
        });
        tonConnectUI.onStatusChange(wallet=>{
            if(wallet) setConnectedUI(wallet.account.address);
            else setConnectedUI(null);
        });
    }catch(e){ console.error(e); }

    async function updateWalletTonBalance(addr){
        try{
            const res=await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${addr}`);
            const data=await res.json();
            if(data.ok) document.getElementById('wallet-ton-balance').textContent=(data.result/1e9).toFixed(3);
        }catch{ document.getElementById('wallet-ton-balance').textContent='--'; }
    }

    // Tabs
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click',()=>{
            tabs.forEach(t=>t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.profile-tab-content').forEach(c=>c.classList.remove('active'));
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Bottom nav
    const sections = { 'profile-btn':'profile-section','market-btn':'play-section','events-btn':'staking-section','giveaway-btn':'tasks-section' };
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn=>{
        btn.addEventListener('click',()=>{
            document.querySelectorAll('.bottom-nav .nav-item').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
            document.getElementById(sections[btn.id]).classList.add('active');
        });
    });

    // Modals
    function openModal(modalId){ document.getElementById(modalId).classList.add('active'); }
    function closeModal(modalId){ document.getElementById(modalId).classList.remove('active'); }

    document.querySelectorAll('.modal-close').forEach(btn=>{
        btn.addEventListener('click', ()=>{ btn.closest('.modal').classList.remove('active'); });
    });

    document.getElementById('payment-btn').addEventListener('click',()=>openModal('ton-modal'));
    document.getElementById('pay-stars-btn').addEventListener('click',()=>openModal('stars-modal'));

    // TON send
    document.getElementById('ton-submit').addEventListener('click', async ()=>{
        const amount=parseFloat(document.getElementById('ton-amount').value);
        if(!amount || !connectedWallet){ alert('Введите сумму или подключите кошелек'); return; }
        try{
            await tonConnectUI.sendTransaction([{to:'EQDUMMYADDRESS123456789',value:(amount*1e9).toString(),data:''}]);
            alert('Отправлено!');
            closeModal('ton-modal');
            updateWalletTonBalance(connectedWallet);
        }catch(e){ alert('Ошибка транзакции'); console.error(e); }
    });

    // Stars send
    document.getElementById('stars-submit').addEventListener('click', async ()=>{
        const amount=parseInt(document.getElementById('stars-amount').value);
        if(!amount){ alert('Введите количество Stars'); return; }
        try{
            tg.sendData(JSON.stringify({type:'stars',amount}));
            alert('Stars отправлены!');
            closeModal('stars-modal');
        }catch(e){ alert('Ошибка'); console.error(e); }
    });
});
