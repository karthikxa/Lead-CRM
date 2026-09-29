const nodemailer=require('nodemailer');
async function test(port, secure){
  console.log(`Testing ${port} secure=${secure}`);
  const t=nodemailer.createTransport({
    host:'smtp.gmail.com', port, secure,
    auth:{user:'zedagencyofficial@gmail.com', pass:'oeexdvgdgklbyksu'},
    tls:{rejectUnauthorized:false}
  });
  try {
    await t.verify();
    console.log(`VERIFY OK ${port}`);
    const info=await t.sendMail({
      from:'"Karthik - Zed Agency" <zedagencyofficial@gmail.com>',
      to:'balunithyapriya@gmail.com',
      subject:'Test 587',
      text:'test',
      html:'<p>test 587</p>'
    });
    console.log('sent',info.messageId);
  } catch(e){
    console.log('FAIL',e.message.substring(0,300));
  }
}
(async()=>{
  await test(465,true);
  await test(587,false);
})();
