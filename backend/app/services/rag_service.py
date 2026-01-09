from app.models.database import get_database_pool
from app.services.embedding_service import embedding_service
import json

class RAGService:
    def __init__(self):
        pass
    
    async def retrieve_relevant_chunks(
        self, 
        query: str, 
        category: str = None, 
        top_k: int = 5
    ):
        pool = await get_database_pool()
        
        # 1. Create query embedding
        query_embedding = await embedding_service.create_embedding(query)
        embedding_json = json.dumps(query_embedding)
        
        # 2. Similarity search with pgvector
        # Note: We need to cast the parameter to vector using brackets or dedicated syntax
        # Asyncpg requires specific handling for vector types if not using a type decoder.
        # Simplest way is passing it as a string representation compatible with pgvector.
        
        # Construct the SQL query
        sql = """
            SELECT 
                dc.chunk_text,
                d.title,
                d.document_type,
                d.metadata,
                1 - (dc.embedding <=> $1::vector) as similarity
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE ($2::varchar IS NULL OR d.document_type = $2)
            ORDER BY dc.embedding <=> $1::vector
            LIMIT $3
        """
        
        async with pool.acquire() as conn:
            results = await conn.fetch(sql, embedding_json, category, top_k)
            
        return [dict(row) for row in results]

    async def search_similar_chunks(self, embedding, limit: int = 5):
        # Compatibility alias if needed, or better yet, fix usage in AgentService
        pass

rag_service = RAGService()
