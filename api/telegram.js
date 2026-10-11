export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const allowed=(process.env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);
 if(req.headers.origin&&!allowed.includes(req.headers.origin))return res.status(403).json({error:"Forbidden origin"});
 const d=typeof req.body==="object"?req.body:{};
 if(d.website)return res.status(200).json({ok:true});
 const name=String(d.name||"").trim().slice(0,80),phone=String(d.phone||"").trim().slice(0,25);
 if(name.length<2||!/^\+?[0-9\s()\-]{9,25}$/.test(phone))return res.status(400).json({error:"Invalid fields"});
 const token=process.env.TELEGRAM_BOT_TOKEN,chat_id=process.env.TELEGRAM_CHAT_ID;
 if(!token||!chat_id)return res.status(500).json({error:"Not configured"});
 const text=`🛒 НОВЕ ЗАМОВЛЕННЯ\n📦 ${process.env.PRODUCT_NAME||"Товар"}\n💰 ${process.env.PRODUCT_PRICE||"Ціна уточнюється"}\n👤 ${name}\n📞 ${phone}\n🕒 ${new Date().toISOString()}`;
 try{const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id,text})});const result=await r.json();return res.status(r.ok&&result.ok?200:502).json({ok:!!result.ok});}catch{return res.status(502).json({error:"Telegram unavailable"});}
}