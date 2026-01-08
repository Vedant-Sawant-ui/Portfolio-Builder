const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit OTP to the specified email.
 */
async function sendOTPEmail(email, otp) {
    // 1. Check for credentials first
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ EMAIL_USER or EMAIL_PASS not found in .env');
        console.log('--- LOCAL DEV FALLBACK ---');
        console.log(`OTP for ${email}: ${otp}`);
        return true; 
    }

    // 2. Initialize transporter with Port 587 (STARTTLS) for better cloud compatibility
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for 587 (STARTTLS)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
    });

    const mailOptions = {
        from: `"Portfolio Builder" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'User Verification OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #6366f1; text-align: center;">Verification Code</h2>
                <p style="color: #475569; font-size: 1rem;">Use the OTP below to verify your email. This code is valid for <strong>5 minutes</strong>.</p>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
                    <span style="font-size: 2.5rem; font-weight: 800; letter-spacing: 5px; color: #6366f1;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 0.85rem; text-align: center;">If you didn't request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="text-align: center; color: #94a3b8; font-size: 0.75rem;">&copy; ${new Date().getFullYear()} Portfolio Builder</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Real OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Nodemailer Error:', error.message);
        console.error('❌ Error Code:', error.code);
        console.error('❌ Stack:', error.stack);
        
        // In production, we want to know if it failed
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Email failed: ${error.message}`);
        }

        console.log('--- FALLBACK TO CONSOLE (Local/Dev) ---');
        console.log(`OTP for ${email}: ${otp}`);
        return true; 
    }
}

module.exports = { sendOTPEmail };
