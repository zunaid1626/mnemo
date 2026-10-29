# 🧠 Mnemo — Sovereign Personal AI Workspace & Second Brain

> Built for the **Nebius x NVIDIA Global AI Hackathon** (Personal AI Track)  
> Powered by **NVIDIA Nemotron Models** on **Nebius Token Factory** & Next.js.

---

## 🌟 What is Mnemo?

**Mnemo** is an intelligent, privacy-first personal AI workspace and second brain that combines:
1. **Persistent Semantic Memory**: Remembers user facts, goals, and working preferences across sessions.
2. **NVIDIA Nemotron 3 Ultra (550B) Cognitive Core**: Deep multi-step reasoning, executive planning, and task synthesis.
3. **Grounded Agent Workflows**: Proposes structured task actions with sovereign human-in-the-loop approval.
4. **Scrollytelling Product Showcase**: Interactive scroll-driven demonstration with live sandbox metrics.

---

## 🚀 Key Features

* **🧠 Multi-Tier NVIDIA Model Switching**:
  * `nvidia/Nemotron-3-Ultra-550b-a55b` — Flagship 550B deep reasoning & executive planning.
  * `nvidia/Nemotron-3_5-Lightning` — Sub-second ultra fast daily chat.
  * `nvidia/nemotron-3-super-120b-a12b` — 120B balanced developer workhorse.
  * `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` — 30B lightweight edge efficiency.
* **⚡ 1-Click Executive Daily Briefing**: Synthesizes active projects, deadlines, and memories into daily top-3 priorities.
* **📌 Instant "Save to Memory"**: 1-click memory capture directly from chat to your private memory library.
* **🎙 Voice Dictation**: Hands-free speech-to-text input with active pulse recording.
* **🛡 Local-First Data Sovereignty**: All projects and chats are kept in browser storage, while memories stay under your direct control.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16 (App Router), React 19, TypeScript
* **Inference Platform**: [Nebius Token Factory](https://tokenfactory.nebius.com)
* **AI Models**: NVIDIA Nemotron Suite (Nemotron 3 Ultra 550B, 3.5 Lightning, 3 Super, 3 Nano)
* **Styling & Motion**: Tailwind CSS v4, Framer Motion, Lucide Icons

---

## ⚙️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/mnemo.git
cd mnemo
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the root directory:
```env
NEBIUS_API_KEY=your_nebius_api_key_here
NEBIUS_MODEL=nvidia/Nemotron-3-Ultra-550b-a55b
```

### 3. Run Locally
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Deployment

### Deploy to Render (Node.js Web Service)
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) $\rightarrow$ **New Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect [`render.yaml`](./render.yaml):
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
5. In **Environment Variables**, add:
   * `NEBIUS_API_KEY`: *(Your Nebius Token Factory Key)*
   * `NEBIUS_MODEL`: `nvidia/Nemotron-3-Ultra-550b-a55b`
6. Click **Deploy**!

### Deploy to Vercel (Recommended for Next.js)
1. Install Vercel CLI: `npm i -g vercel` or push to GitHub and import into [Vercel](https://vercel.com).
2. Set Environment Variables: `NEBIUS_API_KEY` and `NEBIUS_MODEL`.
3. Deploy in seconds.

---

## 📄 License
MIT License
