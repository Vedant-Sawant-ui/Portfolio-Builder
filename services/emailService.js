/**
 * Sends a 6-digit OTP to the specified email using Brevo API.
 * This bypasses Render's SMTP blocks and allows sending to anyone 
 * without needing a custom domain.
 */
async function sendOTPEmail(email, otp) {
    // 1. Check for API Key and Sender
    if (!process.env.BREVO_API_KEY || !process.env.EMAIL_USER) {
        console.warn('⚠️ BREVO_API_KEY or EMAIL_USER missing in environment');
        console.log('--- LOCAL DEV FALLBACK ---');
        console.log(`OTP for ${email}: ${otp}`);
        return true; 
    }

    const payload = {
        sender: { name: "Portfolio Builder", email: process.env.EMAIL_USER },
        to: [{ email: email }],
        subject: 'User Verification OTP',
        htmlContent: `
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
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Brevo API Error:', data.message || response.statusText);
            return false;
        }

        console.log(`✅ OTP email sent via Brevo to ${email} (ID: ${data.messageId})`);
        return true;
    } catch (error) {
        console.error('❌ Brevo Network Error:', error.message);
        return false; 
    }
}

module.exports = { sendOTPEmail };
