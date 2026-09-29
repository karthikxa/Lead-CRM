const nodemailer=require('nodemailer');
async function main(){
  const t=nodemailer.createTransport({
    host:'smtp.gmail.com', port:465, secure:true,
    auth:{user:'zedagencyofficial@gmail.com', pass:'gxil fcan exuo hqei'}
  });
  await t.verify();
  console.log('verified');
  const html=`<div style="font-family:Arial,sans-serif; font-size:14px; line-height:1.6; color:#111; max-width:600px;">
<p>Hi,</p>
<p>I'm Karthik — I build custom websites for local businesses in Chennai.</p>
<p>Quick demo for you: <a href="https://zodzy.in">https://zodzy.in</a> (3D / Modern)</p>
<p>Other demos: https://zed-agency-demo1.vercel.app/ , https://zed-agency-demo2.vercel.app/</p>
<p>Pricing: Static ₹5,000 | Animated ₹7,000 | 3D ₹10,000 — Automation optional +₹1,200-2,000/mo.</p>
<p>I can make a free demo for your business before you decide. Call/WhatsApp me: <a href="tel:+919884048181">+91 9884048181</a></p>
<p>— Karthik<br>Zed Agency<br><a href="https://zodzy.in">zodzy.in</a> | +91 9884048181</p>
<p style="font-size:11px; color:#888;">If not interested, reply STOP to opt out.</p>
</div>`;
  const info=await t.sendMail({
    from:'Karthik <zedagencyofficial@gmail.com>',
    to:'balunithyapriya@gmail.com',
    subject:'Website help for your business? — Karthik',
    text: `Hi,\n\nI'm Karthik (+91 9884048181) — I build custom websites for local businesses in Chennai.\n\nDemo: https://zodzy.in\nPricing: Static 5000, Animated 7000, 3D 10000\n\nFree demo available before you decide.\n\n— Karthik\n+91 9884048181\nzodzy.in`,
    html,
    headers:{
      'X-Mailer': 'Zed Mailer',
      'List-Unsubscribe': '<mailto:zedagencyofficial@gmail.com?subject=unsubscribe>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    },
    replyTo:'zedagencyofficial@gmail.com'
  });
  console.log('sent',info.messageId);
}
main().catch(e=>console.error(e));
