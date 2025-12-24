import fetch from 'node-fetch';

export default async function handler(req,res){
    if(req.method!=='POST') return res.status(405).json({message:'Method not allowed'});
    const { userId } = JSON.parse(req.body);
    const botToken = process.env.BOT_TOKEN;
    const chatId = userId;
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendInvoice`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            chat_id:chatId,
            title:"Премиум в Mr. Scam",
            description:"50 Stars",
            payload:"payload_50_stars",
            provider_token:process.env.PROVIDER_TOKEN,
            currency:"XTR",
            prices:[{label:"50 Stars",amount:5000}]
        })
    });
    const data = await response.json();
    res.status(200).json({message:data.ok?"Invoice отправлен!":"Ошибка при отправке"});
}
