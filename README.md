# 🤖 Aegis AI — Research Assistant

An advanced AI-powered research copilot built using **React, FastAPI, RAG architecture, FAISS vector search, and LLM streaming**.

Aegis AI allows users to upload PDFs, ask questions in natural language, receive citation-based answers, and directly navigate to referenced pages inside an integrated PDF viewer.

---

# 🚀 Features

## 📄 AI PDF Research Assistant
- Upload research papers, textbooks, notes, or documents
- Ask natural language questions
- AI answers strictly from uploaded documents

---

## 🧠 RAG (Retrieval-Augmented Generation)
- Semantic chunk retrieval
- Vector embeddings using Sentence Transformers
- FAISS similarity search
- Context-aware responses

---

## ⚡ Real-Time Streaming Responses
- Token-by-token streaming
- Live AI typing experience
- Smooth conversational UX

---

## 📚 Citation-Based PDF Viewer
- AI responses include source citations
- Clickable page references
- Built-in PDF viewer opens directly to referenced page

---

## 💬 Persistent Chat History
- Multiple chat sessions
- Rename chats
- Delete chats
- Continue previous conversations
- Stored using localStorage

---

## 🎨 Modern UI/UX
- Dark glassmorphism theme
- Framer Motion animations
- Markdown rendering
- Syntax-highlighted code blocks
- Responsive layout
- AI typing indicators

---

# 🖼️ Screenshots

## Main Chat Interface
<img width="100%" alt="Main UI" src="ADD_SCREENSHOT_HERE">

---

## Citation-Based PDF Viewer
<img width="100%" alt="PDF Viewer" src="ADD_SCREENSHOT_HERE">

---

## Streaming AI Responses
<img width="100%" alt="Streaming Responses" src="ADD_SCREENSHOT_HERE">

---

## Chat History Sidebar
<img width="100%" alt="Chat History" src="ADD_SCREENSHOT_HERE">

---

# 🏗️ Architecture

```text
User Query
   ↓
Frontend (React)
   ↓
FastAPI Backend
   ↓
Semantic Search (FAISS)
   ↓
Relevant Chunks Retrieved
   ↓
LLM Prompt Construction
   ↓
Streaming AI Response
   ↓
Frontend Rendering + Citations
```

---

# 🛠️ Tech Stack

## Frontend
- React
- Tailwind CSS
- Framer Motion
- React Markdown
- React PDF
- React Hot Toast
- React Syntax Highlighter

---

## Backend
- FastAPI
- Python
- FAISS
- Sentence Transformers
- PyMuPDF

---

## AI / NLP
- Retrieval-Augmented Generation (RAG)
- Vector Embeddings
- Semantic Search
- Streaming LLM APIs

---

# 📂 Project Structure

```text
ai-copilot/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── rag.py
│   ├── llm.py
│   └── uploads/
│
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone YOUR_REPO_URL
```

---

## 2️⃣ Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 3️⃣ Backend Setup

```bash
cd backend

python3 -m venv venv

source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run backend:

```bash
python3 -m uvicorn main:app --reload
```

---

# 🔑 Environment Variables

Create `.env` inside backend:

```env
OPENROUTER_API_KEY=YOUR_API_KEY
```

---

# 📌 Future Improvements

- Authentication
- MongoDB cloud chat storage
- Multi-PDF retrieval
- Hybrid search (keyword + semantic)
- AI-generated notes
- Voice assistant
- Research paper summarization
- Agentic workflows
- LangChain integration

---

# 🧪 Research Concepts Demonstrated

- Retrieval-Augmented Generation (RAG)
- Vector Databases
- Semantic Retrieval
- Embedding Models
- Streaming APIs
- Human-AI Interaction
- Information Retrieval Systems

---

# 👨‍💻 Author

**Jayanth Vikram**

Computer Science Engineering Student  
AI • Full Stack • Research Systems • NLP

---

# ⭐ If you like this project

Give it a star on GitHub ⭐
