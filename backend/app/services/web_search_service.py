from app.config import settings
from tavily import TavilyClient
import asyncio

class WebSearchService:
    def __init__(self):
        # We'll use Tavily as primary, but can abstract this later.
        # Ensure TAVILY_API_KEY is in .env
        self.api_key = settings.TAVILY_API_KEY
        self.client = TavilyClient(api_key=self.api_key) if self.api_key else None

    async def search(self, query: str, max_results: int = 5) -> list:
        """
        Performs a web search and returns normalized results.
        """
        if not self.client:
            print("Warning: Web Search disabled (No API Key)")
            return []

        try:
            # Tavily's python SDK is synchronous, so we run it in a thread/executor if needed, 
            # or just call it directly if it's fast enough. 
            # For better async support, we might wrap it.
            # However, for this MVP, we'll assume it's acceptable or use asyncio.to_thread
            
            response = await asyncio.to_thread(
                self.client.search,
                query=query,
                search_depth="advanced",
                max_results=max_results
            )
            
            results = []
            for result in response.get('results', []):
                results.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "content": result.get('content'),
                    "source": "Web Search" 
                })
            return results
            
        except Exception as e:
            print(f"Web Search Error: {e}")
            return []
