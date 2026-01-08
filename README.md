# 🚀 Portfolio-Builder

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://portfolio-builder-fdv7.onrender.com)
[![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20PostgreSQL-blue)](https://portfolio-builder-fdv7.onrender.com)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-orange)](https://google.ai)

**Portfolio-Builder** is an AI-engineered platform that converts your professional journey into a high-impact, live portfolio in seconds. Forget manual formatting—let SOTA AI build your brand while you focus on building the future.

## ✨ Key Features

- **🪄 AI Content Engineering**: Professionally polish your biographies, project descriptions, and achievements using the **Gemini 2.x Flash** API.
- **📄 Intelligent Resume Parsing**: Upload a PDF, and the app instantly extracts your skills, socials, and experience using AI-driven structured data parsing.
- **📊 Real-time Developer Analytics**: Integrated with **GitHub** and **LeetCode** APIs to showcase your coding streak and problem-solving stats.
- **🎨 Premium Theme Engine**: A curated selection of responsive, SEO-optimized themes tailored for modern developers.
- **🔐 Privacy & Visibility Control**: Toggle between "Private" and "Published" modes. Includes a professional "Private Profile" view for secure drafts.
- **🛰️ Dynamic Hosting Strategy**: Standardized URL generation for seamless sharing across local and production environments.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js (High-performance API orchestration)
- **Database**: PostgreSQL (via Neon.tech Serverless)
- **AI Layer**: Google Gemini API (2.0/2.5 Flash Fallback Chain)
- **Auth**: Firebase Admin SDK & PostgreSQL Hybrid Session Management
- **Media**: Cloudinary CDN (Persistent Global Image Hosting)
- **Email**: Brevo Transactional API (HTTPS-based bypass for SMTP port blocks)
- **Frontend**: EJS + Vanilla CSS (SEO-friendly SSR with granular design control)

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

## 🛡️ Security & Resilience
- **Indestructible Sync**: Transactional database initialization ensures schema stability on every deploy.
- **Strict Timeouts**: 5s timeouts on all external service calls to prevent application hangs.
- **Fail-Safe AI**: Intelligent model rotation between Gemini 2.0, 2.5, and 1.5 to guarantee uptime.

## 🤝 Contributing
Feel free to fork this project, open issues, or submit PRs!

## 📜 License
MIT License - created by [Vedant Sawant](https://github.com/Vedant-Sawant-ui)
