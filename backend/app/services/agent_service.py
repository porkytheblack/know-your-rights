from app.services.rag_service import RAGService
from app.services.embedding_service import EmbeddingService
from app.services.contract_analyzer import ContractAnalyzer
from app.services.web_search_service import WebSearchService
from app.utils.prompt_templates import LABOR_RIGHTS_SYSTEM_PROMPT, UNION_QUERY_SYSTEM_PROMPT, SEARCH_DECISION_PROMPT
from app.config import settings
from app.models.database import db
from openai import AsyncOpenAI
import uuid

class AgentService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.rag_service = RAGService()
        self.contract_analyzer = ContractAnalyzer()
        self.web_search = WebSearchService()
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def handle_chat(self, message: str, category: str = "general", session_id: str = None, use_web_search: bool = False) -> dict:
        """
        Handles a chat message based on category, with history.
        """
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Ensure session exists (even if passed from client)
        query = "INSERT INTO chat_sessions (id, title) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING"
        await db.execute(query, session_id, message[:50])

        # 1. Retrieve RAG Context
        # query_embedding is handled inside retrieve_relevant_chunks
        chunks = await self.rag_service.retrieve_relevant_chunks(message, top_k=5)
        
        sources = [{"title": chunk['title'], "type": "Document"} for chunk in chunks]
        context_text = "\n\n".join([chunk['chunk_text'] for chunk in chunks])

        # 2. Perform Web Search logic
        
        web_results = []
        search_query = None

        if use_web_search:
             # Force search logic
             print(f"Forced Web Search for: {message}")
             search_query = message
             if "kenya" not in message.lower():
                 search_query += " in Kenya"
        else:
             # Agentic check
             search_decision = await self._decide_search_need(message, context_text)
             if search_decision:
                 print(f"Agent decided to search with query: {search_decision}")
                 search_query = search_decision

        if search_query:
             web_results = await self.web_search.search(search_query, max_results=3)
             if web_results:
                 web_context = "\n".join([f"Source: {r['title']}\nContent: {r['content']}" for r in web_results])
                 context_text += f"\n\n--- WEB SEARCH RESULTS ---\n{web_context}"
                 sources.extend([{"title": r['title'], "type": "Web", "url": r.get('url')} for r in web_results])

        # 3. Retrieve History
        history = await self._get_chat_history(session_id)
        
        # 4. Select System Prompt
        if category == "union":
            system_prompt = UNION_QUERY_SYSTEM_PROMPT.format(context=context_text, question=message)
        else:
            system_prompt = LABOR_RIGHTS_SYSTEM_PROMPT.format(context=context_text, question=message)

        # 5. Generate Response
        messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": message}]
        
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.3
        )
        
        answer = response.choices[0].message.content
        
        # 6. Persist Interaction
        await self._save_message(session_id, "user", message, metadata={"category": category})
        await self._save_message(session_id, "assistant", answer)
        
        return {
            "response": answer,
            "sources": sources,
            "session_id": session_id
        }

    async def analyze_document(self, text: str, session_id: str = None) -> dict:
        """
        Delegates to ContractAnalyzer and persists context if session_id is provided.
        """
        analysis = await self.contract_analyzer.analyze_contract(text)
        
        if session_id:
            # Ensure session exists in DB (to satistfy FK for messages)
            create_session_query = "INSERT INTO chat_sessions (id, title) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING"
            await db.execute(create_session_query, session_id, "Document Upload Analysis")

            # 1. Save Document Content as Context (System/User Context)
            # Truncate if necessary, but for now we save it.
            # We'll use a special format or just user message.
            readable_text = f"User uploaded a document. Content preview:\n{text[:2000]}..." if len(text) > 2000 else f"User uploaded a document. Content:\n{text}"
            await self._save_message(session_id, "user", readable_text)
            
            # 2. Save Analysis as Assistant Message
            summary = analysis.get("assessment_summary", "Document analyzed.")
            await self._save_message(session_id, "assistant", f"I've analyzed the document. Summary: {summary}")
            
        return analysis
            

        
    async def _get_chat_history(self, session_id: str, limit: int = 5) -> list:
        query = "SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2"
        rows = await db.fetch(query, session_id, limit)
        return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]

    async def _save_message(self, session_id: str, role: str, content: str, metadata: dict = None):
        if not metadata:
            metadata = {}
        import json
        query = "INSERT INTO messages (id, session_id, role, content, metadata) VALUES ($1, $2, $3, $4, $5)"
        await db.execute(query, str(uuid.uuid4()), session_id, role, content, json.dumps(metadata))

    async def get_recent_sessions(self, limit: int = 20) -> list:
        query = """
            SELECT id, title, created_at 
            FROM chat_sessions 
            ORDER BY created_at DESC 
            LIMIT $1
        """
        rows = await db.fetch(query, limit)
        return [dict(r) for r in rows]

    async def get_session_messages(self, session_id: str) -> list:
        # Re-using internal logic but exposing formatting
        return await self._get_chat_history(session_id, limit=50)

    async def _decide_search_need(self, message: str, context: str) -> str | None:
        """
        Uses LLM to decide if a search is needed. Returns search query or None.
        """
        decision_prompt = SEARCH_DECISION_PROMPT.format(context=context, question=message)
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": decision_prompt}],
                temperature=0.0
            )
            result = response.choices[0].message.content.strip()
            
            if "NO_SEARCH" in result:
                return None
            return result
        except Exception as e:
            print(f"Search decision failed: {e}")
            return None
