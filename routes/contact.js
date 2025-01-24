const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'your-email@example.com', // Your email where you want to receive messages
            subject: `New Contact Message from ${name}`,
            html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send message' });
    }
});

module.exports = router; 