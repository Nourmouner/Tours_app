const nodemailer =require('nodemailer');

 const  sendEmail = 0;
// = async options =>{
//     const transporter =nodemailer.createTransport({
//         service : 'Gmail',
//         // host : process.env.EMAIL_HOST,
//         // port : process.env.EMAIL_PORT,
//         auth : {
//             // user : process.env.EMAIL_USERNAME,
//             // pass : process.env.EMAIL_PASSWORD,
//         }
//     });
//     const mailOptions ={
//         from : 'name <emailladdress>',
//         to : options.email,
//         subject :options.subject,
//         text : options.message,
//         html : options.html,

//     };
//     await transporter.sendMail(mailOptions);

// };
module.exports =sendEmail;
