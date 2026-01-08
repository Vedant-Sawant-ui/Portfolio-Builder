# 🚀 Portfolio-Builder

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://portfolio-builder-fdv7.onrender.com)
[![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20PostgreSQL-blue)](https://portfolio-builder-fdv7.onrender.com)

**Portfolio-Builder** is an AI-powered platform that converts your professional journey into a stunning, live portfolio in minutes. Stop manually formatting HTML—let AI build your brand while you focus on code.

## ✨ Key Features

- **🤖 AI Profile Upgrade**: Don't settle for boring bios. Use Gemini AI to professionally rephrase your profile and projects.
- **📄 Instant Resume Parsing**: Upload a PDF, and watch the app extract your skills, socials, and experience automatically.
- **📊 Real-time Analytics**: Live integration with **GitHub** and **LeetCode** to show off your repositories and problem-solving stats.
- **🎨 Premium Themes**: Choose from modern, minimalist, and developer-focused themes that look great on any device.
- **⚡ Instant Deployment**: Your portfolio is live the moment you hit "Publish."

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via Neon.tech)
- **AI**: Google Gemini API (1.5 Flash)
- **Auth**: Firebase Admin SDK & Hybrid Session Management
- **Media**: Cloudinary CDN
- **Email**: Brevo Transactional API
- **Frontend**: EJS (Server-side rendering), Vanilla CSS

## ⚙️ Setting Up Locally

### 1. Prerequisites
- Node.js installed
- A PostgreSQL database (or Neon.tech account)
- API Keys for: Gemini, Cloudinary, Firebase, and Brevo.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Vedant-Sawant-ui/Portfolio-Builder.git

# Navigate to the directory
cd Portfolio-Builder

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_neon_db_url
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_URL=your_cloudinary_url
BREVO_API_KEY=your_brevo_key
EMAIL_USER=your_verified_email
SESSION_SECRET=your_secret
FIREBASE_SERVICE_ACCOUNT_JSON=your_json_string
```

### 4. Run the App
```bash
npm run dev
```

## 🛡️ Security & Performance
- **Optimized for Render**: Engineered to run efficiently on free-tier cloud resources.
- **Strict Timeouts**: 5s timeouts on all external calls to prevent application hangs.
- **Secure Handling**: No hardcoded secrets; full environment variable integration.

## 🤝 Contributing
Feel free to fork this project, open issues, or submit PRs!

## 📜 License
MIT License - created by [Vedant Sawant](https://github.com/Vedant-Sawant-ui)
