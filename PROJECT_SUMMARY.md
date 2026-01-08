# Portfolio-Builder: Project Executive Summary

## 🛠️ Project Overview
**Portfolio-Builder** is a high-performance, AI-integrated web application designed to help developers and students create professional portfolios in seconds. It leverages the power of Large Language Models (LLMs) to automate content creation and provides a robust, scalable infrastructure for hosting dynamic personal brands.

## 🚀 Core Value Proposition
- **AI Content Engineering**: Automates the refinement of professional biographies and project descriptions using the Google Gemini Pro API.
- **Intelligent Resume Parsing**: Instantly extracts key skills, projects, and contact information from PDF resumes to pre-populate sections.
- **Dynamic Theming Engine**: Offers a curated selection of premium, responsive themes tailored for high-impact professional presentation.
- **Live Deployment Analytics**: Integrates GitHub and LeetCode APIs to display real-time coding activity and competitive programming performance.

## 🏗️ Technical Architecture
The project is built on a "Free Forever" professional stack, demonstrating advanced expertise in cost-optimization and cloud infrastructure.

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | EJS + Vanilla CSS | SEO-friendly server-side rendering with granular design control. |
| **Backend** | Node.js + Express | Highly scalable runtime for asynchronous API orchestration. |
| **Database** | PostgreSQL (Neon.tech) | Serverless relational data management with point-in-time recovery. |
| **AI Layer** | Google Gemini 1.5 Flash | SOTA generative AI for text optimization and structured parsing. |
| **Auth** | PostgreSQL + Firebase Admin | Hybrid identity management for secure, multi-tier authentication. |
| **Storage** | Cloudinary | Global CDN-backed media management for persistent image hosting. |
| **Email** | Brevo API | High-reliability transactional email delivery bypassing SMTP blocks. |
| **Hosting** | Render | Fully automated CI/CD pipeline with horizontal scaling capability. |

## 💡 Key Engineering Challenges Solved
1. **Bypassing SMTP Restrictions**: Engineered a robust HTTPS-based email delivery system using the Brevo API to overcome cloud-provider port blocks (SMTP 465/587).
2. **Infrastructure Resilience**: Implemented strict connection pooling and timeouts (5s) to ensure zero-delay performance on free-tier cloud resources.
3. **Cross-Service Sync**: Orchestrated real-time data synchronization between local PostgreSQL, Firebase Auth, and Cloudinary storage.
4. **AI Output Consistency**: Developed advanced prompting strategies to ensure extracted resume data remains structured and high-quality.

## 📈 Future Scalability
- **Custom Domain Integration**: Built-in support for verified domain senders.
- **Expanded Theme Marketplace**: Architecture supports dynamic injection of new EJS templates.
- **Rich Analytics Dashboard**: Ready for the integration of visitor tracking and engagement metrics.

---
**Developer:** Vedant Sawant  
**Live Application:** [portfolio-builder-fdv7.onrender.com](https://portfolio-builder-fdv7.onrender.com)
