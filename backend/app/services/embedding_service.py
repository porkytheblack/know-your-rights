from openai import AsyncOpenAI
from app.config import settings
from typing import List

class EmbeddingService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "text-embedding-3-small"
    
    async def create_embedding(self, text: str) -> List[float]:
        text = text.replace("\n", " ")
        response = await self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding
    
    async def batch_embed(self, texts: List[str]) -> List[List[float]]:
        # OpenAI has a limit on input size, so we might need to batch this further
        # inside here if lists are huge. For now, simple pass-through.
        if not texts:
            return []
            
        # Clean newlines for better embeddings
        cleaned_texts = [t.replace("\n", " ") for t in texts]
        
        response = await self.client.embeddings.create(
            model=self.model,
            input=cleaned_texts
        )
        # Sort by index to ensure order matches input
        return [data.embedding for data in response.data]

embedding_service = EmbeddingService()
