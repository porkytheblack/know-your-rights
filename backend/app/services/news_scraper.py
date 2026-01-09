import asyncio
from newspaper import Article
from app.services.web_search_service import WebSearchService
from app.services.embedding_service import EmbeddingService
from app.services.rag_service import RAGService
from app.models.database import db
import uuid

class NewsScraperService:
    def __init__(self):
        self.web_search = WebSearchService()
        self.embedding = EmbeddingService()
        self.rag = RAGService()

    async def scrape_and_index_news(self, query: str = "Kenya labor rights strikes unions news", limit: int = 5):
        """
        Searches for news, scrapes content, and indexes it if relevant.
        """
        print(f"Starting news scrape for: {query}")
        
        # 1. Search for recent articles
        results = await self.web_search.search(query, max_results=limit)
        
        indexed_count = 0
        for result in results:
            url = result['url']
            title = result['title']
            
            # Check if already indexed
            existing = await db.fetch_val("SELECT id FROM documents WHERE source_url = $1", url)
            if existing:
                print(f"Skipping existing article: {title}")
                continue

            try:
                # 2. Scrape full content using newspaper3k
                # Note: synchronous library, run in thread
                article_text = await asyncio.to_thread(self._scrape_article_content, url)
                
                if not article_text or len(article_text) < 200:
                    print(f"Skipping thin content: {title}")
                    continue

                # 3. Save to Documents
                doc_id = str(uuid.uuid4())
                await db.execute(
                    "INSERT INTO documents (id, title, content, document_type, source_url, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
                    doc_id, title, article_text, "News", url, '{"source": "scraper"}'
                )

                # 4. Chunk and Embed (using existing RAG service logic or manual)
                # We'll re-use the document ingestion pipeline logic here ideally, 
                # but for now let's manually call the services to keep it contained.
                
                # Split into chunks (simple split for now)
                words = article_text.split()
                chunk_size = 300
                chunks = [' '.join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]
                
                for i, chunk_text in enumerate(chunks):
                    emb = await self.embedding.create_embedding(chunk_text)
                    chunk_id = str(uuid.uuid4())
                    await db.execute(
                        "INSERT INTO document_chunks (id, document_id, chunk_text, chunk_index, embedding) VALUES ($1, $2, $3, $4, $5)",
                        chunk_id, doc_id, chunk_text, i, str(emb)
                    )
                
                indexed_count += 1
                print(f"Indexed: {title}")

            except Exception as e:
                print(f"Failed to process {url}: {e}")

        return {"status": "success", "indexed": indexed_count}

    def _scrape_article_content(self, url: str) -> str:
        try:
            article = Article(url)
            article.download()
            article.parse()
            return article.text
        except Exception as e:
            print(f"Scrape error: {e}")
            return ""
