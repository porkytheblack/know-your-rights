# Architecture - Know Your Rights Platform

## Overview
The "Know Your Rights" platform is a Retrieval-Augmented Generation (RAG) system designed to provide localized labor rights advice for Kenyan workers. It combines a knowledge base of legal documents with real-time web search and news scraping to deliver accurate, up-to-date legal insights.

## System Components

### 1. Frontend (Next.js 14)
*   **Role**: User interface for Chat, Admin Dashboard, and Document Management.
*   **Tech Stack**: React, TypeScript, TailwindCSS, Shadcn/UI.
*   **Key Features**:
    *   **Chat Interface**: Real-time streaming chat with markdown support.
    *   **Admin Dashboard**: secure area for uploading laws, monitoring usage, and configuring scrapers.
    *   **Auth**: JWT-based session management for admins.

### 2. Backend (FastAPI)
*   **Role**: Core API handling business logic, RAG pipeline, and Agent orchestration.
*   **Tech Stack**: Python 3.11, FastAPI, OpenAI SDK, Pydantic.
*   **Key Services**:
    *   `AgentService`: The central brain that routes queries between RAG (Documents) and Web Search.
    *   `RAGService`: Handles vector retrieval and context assembly.
    *   `DocumentParser`: Extracts text from PDFs/DOCX and chunks it.
    *   `NewsScraper`: Background service to fetch relevant labor news.

### 3. Database (PostgreSQL + pgvector)
*   **Role**: Primary data store for both relational data and vector embeddings.
*   **Extensions**: `pgvector` for storing 1536-dimensional embeddings.
*   **Key Tables**:
    *   `documents`: Metadata for uploaded laws/contracts.
    *   `document_chunks`: Text chunks + Vector Embeddings.
    *   `chat_sessions` & `messages`: Chat history state.

## Data Flow Diagrams

### Chat & RAG Pipeline
How a user query is processed to generate an answer.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API as FastAPI Backend
    participant Agent as AgentService
    participant DB as Postgres (pgvector)
    participant Search as WebSearchService
    participant LLM as OpenAI GPT-4

    User->>Frontend: "Is the doctors' strike legal?"
    Frontend->>API: POST /chat (message, session_id)
    API->>Agent: handle_chat()
    
    par Document Retrieval
        Agent->>DB: Query Vector Store (Embeddings)
        DB-->>Agent: Return top-k relevant chunks (Labor Act)
    and Search Decision
        Agent->>LLM: "Is web search needed for 'doctors strike'?"
        LLM-->>Agent: "Yes (Current Event)"
        Agent->>Search: Search "Kenya doctors union strike status"
        Search-->>Agent: Return recent news articles
    end

    Agent->>LLM: Generate Answer(Query + Doc Context + Web Results)
    LLM-->>Agent: "The strike is protected under Article 41..."
    Agent->>DB: Save Message History
    Agent-->>API: Return Response
    API-->>Frontend: Display Answer + Citations
```

### Document Ingestion Pipeline
How a PDF becomes searchable knowledge.

```mermaid
graph TD
    A[Admin Uploads PDF] -->|POST /upload| B(FastAPI Endpoint)
    B --> C{DocumentParser}
    C -->|Extract Text| D[Raw Text]
    D -->|Chunking Strategy| E[Text Chunks 500 chars]
    E --> F{EmbeddingService}
    F -->|OpenAI API| G[Vector Embeddings]
    G --> H[(Postgres pgvector)]
    H -->|Index| I[Ready for Search]
```

## Design Decisions

### Why PostgreSQL + pgvector?
*   **Simplicity**: We strictly avoided adding a separate vector database (like Pinecone or Weaviate) to keep the stack simple. Postgres allows us to join relational data (User/Session) with Vector data in a single query.
*   **Transactional Integrity**: Deleting a document atomically deletes all its chunks, ensuring no orphaned embeddings.

### Why Agentic Search?
*   **Problem**: RAG is static. If a strike happened today, the database wouldn't know.
*   **Solution**: The Agent dynamically decides if a query requires **external knowledge** (e.g., "current news") or **static knowledge** (e.g., "what does the law say").
*   **Implementation**: A lightweight LLM router examines the query before answering.

### Why Contextual Document Analysis?
*   **Flow**: Users often upload a contract and ask "Is this fair?".
*   **Approach**: We treat the uploaded document as a temporary addition to the context window, persisted in the session history, rather than indexing it into the global knowledge base. This preserves privacy and context relevance.
