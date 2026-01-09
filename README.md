# Know Your Rights Platform 🇰🇪

An AI-powered legal assistant designed to help Kenyan workers understand their labor rights, analyze contracts, and stay informed about union activities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-beta-orange.svg)

## Features

*   **RAG-Powered Chat**: Ask questions about the Kenyan Employment Act, Labor Relations Act, and more.
*   **Agentic Web Search**: Automatically fetches real-time news (e.g., strike updates) when the knowledge base is insufficient.
*   **Contract Analysis**: Upload generic contracts or offer letters for an instant fairness review.
*   **Admin Dashboard**: robust interface to manage the knowledge base, view analytics, and scrape news.
*   **Full Source Citations**: Every answer links back to the specific legal document or web source used.

## Architecture

*   **Frontend**: Next.js 14, TypeScript, TailwindCSS, Shadcn/UI.
*   **Backend**: Python FastAPI, OpenAI (GPT-4o), LangChain concepts.
*   **Database**: PostgreSQL 16 with `pgvector` for semantic search.
*   **Infrastructure**: Docker Compose.

See [Architecture.md](./Architecture.md) for detailed diagrams and design rationale.

## Prerequisites

*   Docker & Docker Compose
*   OpenAI API Key
*   (Optional) Tavily API Key for web search features.

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/know-your-rights.git
cd know-your-rights
```

### 2. Configure Environment
Create a `.env` file in the root directory (or use the example provided):

```ini
# Database (Auto-configured by Docker)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=labor_rights_db

# AI Services
OPENAI_API_KEY=sk-your-openai-key-here
TAVILY_API_KEY=tvly-your-tavily-key-here
SERPER_API_KEY=your-serper-key-here

# Security
SECRET_KEY=dev_secret_key_change_in_prod
JWT_SECRET_KEY=admin_jwt_secret_change_in_prod
ADMIN_MASTER_KEY=admin_registration_key
```

### 3. Start the Stack
Run the application using Docker Compose:

```bash
docker-compose up --build
```

*   **Frontend**: `http://localhost:3000`
*   **Backend API**: `http://localhost:8000`
*   **API Docs**: `http://localhost:8000/docs`

### 4. Initialize the Database
Once the containers are running, you need to apply the schema migration:

```bash
# In a new terminal
docker-compose exec backend python scripts/init_db.py
```

### 5. Seed Knowledge Base
To make the AI useful, you must upload some legal documents. You can do this via the Admin Dashboard or API.

**Via Admin Dashboard**:
1.  Go to `http://localhost:3000/admin/login`
2.  Use the Master Key defined in `.env` to register/login.
3.  Navigate to **Documents** and upload PDF files (e.g., "Employment Act 2007.pdf").

**Via API**:
```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -F "file=@/path/to/Employment_Act.pdf"
```

## Development

### Backend
Currently located in `./backend`.
To run locally without Docker (requires a local Postgres instance):
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
Currently located in `./frontend`.
```bash
cd frontend
npm install
npm run dev
```

## License
MIT
