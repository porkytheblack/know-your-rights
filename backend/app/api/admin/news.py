from fastapi import APIRouter, HTTPException, Depends
from app.services.news_scraper import NewsScraperService
from app.api.admin.auth import get_current_admin
from app.models.database import db

router = APIRouter()
scraper_service = NewsScraperService()

@router.post("/scrape")
async def trigger_scrape(query: str = "Kenya labor rights strikes unions news", limit: int = 5, admin: dict = Depends(get_current_admin)):
    """
    Triggers a news scrape job (protected by admin auth).
    """
    try:
        result = await scraper_service.scrape_and_index_news(query, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_news(limit: int = 20, admin: dict = Depends(get_current_admin)):
    """
    List all documents of type 'News'.
    """
    try:
        query = """
            SELECT id, title, source_url, last_updated as created_at
            FROM documents
            WHERE document_type = 'News'
            ORDER BY last_updated DESC
            LIMIT $1
        """
        rows = await db.fetch(query, limit)
        return [
            {
                "id": str(r['id']),
                "title": r['title'],
                "source": r['source_url'], # Using URL as source for now
                "created_at": r['created_at']
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
