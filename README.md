# 🚀 InsightCV AI

**InsightCV AI** is a full-stack AI-powered career assistant that helps job seekers optimize their resumes, improve ATS scores, prepare for interviews, and increase their chances of landing their dream job. The platform leverages AI to provide personalized resume analysis, resume rewriting, job matching, interview preparation, and career guidance through a modern and intuitive web interface.

## 🌐 Live Demo

* **Frontend:** https://your-frontend-url.vercel.app
* **Backend API:** https://insightcv-ai-backend.onrender.com

---

## ✨ Features

* 🔐 Secure Authentication (JWT + Google OAuth)
* 📄 Resume Upload & PDF Parsing
* 🤖 AI Resume Analysis
* 📊 ATS Score Analysis with detailed insights
* 🎯 AI Job Match Analysis
* ✍️ AI Resume Rewriter
* 💼 AI Career Coach
* 🎤 AI Interview Question Generator
* 📈 Resume History & Analytics Dashboard
* 📑 Professional PDF Reports
* 📱 Responsive Modern SaaS UI/UX
* ☁️ Cloud Deployment (Vercel + Render)
* 🐳 Dockerized Backend

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router
* Axios
* Framer Motion
* Recharts

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* Google OAuth
* Multer
* PDF-Parse
* PDFKit

### AI & Cloud

* Groq API (LLM)
* Google OAuth 2.0
* Vercel
* Render
* Docker

---

## 📂 Project Structure

```text
InsightCV-AI/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── config/
│   ├── Dockerfile
│   └── package.json
│
├── DESIGN.md
├── AGENTS.md
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/pushkar-jaju/InsightCV-AI.git
cd InsightCV-AI
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🐳 Docker (Backend)

Build the Docker image:

```bash
docker build -t insightcv-backend .
```

Run the container:

```bash
docker run -d -p 5000:5000 --name insightcv-backend-container --env-file .env insightcv-backend
```

---

## 🚀 Deployment

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** MongoDB Atlas

---

## 🔮 Future Enhancements

* Resume Version Comparison
* AI Skill Gap Analysis
* Career Roadmap Generator
* Application Tracking System
* Email Notifications
* CI/CD with GitHub Actions
* Docker Compose
* AWS Deployment

---

## 👨‍💻 Author

**Pushkar Jaju**

If you found this project useful, feel free to ⭐ the repository.
