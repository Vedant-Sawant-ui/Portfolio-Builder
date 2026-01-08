/**
 * Sends a 6-digit OTP to the specified email using Resend API.
 * This bypasses Render's SMTP blocks by using HTTPS.
 */
async function sendOTPEmail(email, otp) {
    // 1. Check for API Key first
    if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY not found in environment');
        console.log('--- LOCAL DEV FALLBACK ---');
        console.log(`OTP for ${email}: ${otp}`);
        return true; 
    }

    const payload = {
        from: 'Portfolio Builder <onboarding@resend.dev>',
        to: [email],
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
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Log the specific error for the developer
            console.error('❌ Resend API Error:', data.message || response.statusText);
            return false; // Return false so the route can handle it
        }

        console.log(`✅ OTP email sent via Resend to ${email} (ID: ${data.id})`);
        return true;
    } catch (error) {
        console.error('❌ Resend Network/Fetch Error:', error.message);
        return false; 
    }
}

module.exports = { sendOTPEmail };
