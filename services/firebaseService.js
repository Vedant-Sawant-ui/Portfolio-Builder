const admin = require('firebase-admin');

// Note: In a real app, you would download the serviceAccountKey.json 
// from Firebase Console and set FIREBASE_SERVICE_ACCOUNT_PATH in .env
try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        // Preferred for Production (Railway/Render)
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        // For Local Development
        serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized');
    } else {
        console.warn('⚠️ Firebase credentials not found (JSON or PATH missing in .env).');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
}

module.exports = admin;
