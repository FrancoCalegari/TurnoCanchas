const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP credentials not found in .env. Simulating email sending.');
            console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
            return true;
        }

        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"TurnoCanchas" <no-reply@turnocanchas.com>',
            to,
            subject,
            html,
        });

        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendEmail
};
