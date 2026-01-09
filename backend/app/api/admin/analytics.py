from fastapi import APIRouter, Depends
from app.api.admin.auth import get_current_admin
from app.models.database import db

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(admin: str = Depends(get_current_admin)):
    # 1. KPI Counts
    total_docs = await db.fetch_val("SELECT COUNT(*) FROM documents")
    total_chunks = await db.fetch_val("SELECT COUNT(*) FROM document_chunks")
    
    # Count messages from users in the last 24 hours
    queries_today = await db.fetch_val("""
        SELECT COUNT(*) FROM messages 
        WHERE role = 'user' AND created_at >= NOW() - INTERVAL '24 HOURS'
    """) or 0
    
    # 2. Volume Trend (Last 7 Days)
    # Note: Requires generated series for gaps, or just simple group by
    trend_query = """
        SELECT to_char(created_at, 'Dy') as day, COUNT(*) as queries
        FROM messages
        WHERE role = 'user' AND created_at >= NOW() - INTERVAL '7 DAYS'
        GROUP BY 1, date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) ASC
    """
    trend_rows = await db.fetch(trend_query)
    
    trend_data = [{"day": r["day"], "queries": r["queries"]} for r in trend_rows]
    
    # Fill in if empty (mocking minimally for UI safety if no data yet)
    if not trend_data:
        trend_data = [{"day": "Today", "queries": 0}]

    # 3. Recent Queries (replacing Top Queries for now)
    recent_query_sql = """
        SELECT content, created_at 
        FROM messages 
        WHERE role = 'user' 
        ORDER BY created_at DESC 
        LIMIT 5
    """
    recent_rows = await db.fetch(recent_query_sql)
    recent_queries = [{"q": r["content"], "date": r["created_at"]} for r in recent_rows]

    # 4. Queries by Category
    cat_query = """
        SELECT metadata->>'category' as category, COUNT(*) as count
        FROM messages
        WHERE role = 'user' AND metadata IS NOT NULL
        GROUP BY 1
        ORDER BY count DESC
    """
    cat_rows = await db.fetch(cat_query)
    
    # Handle None/Null categories (legacy data)
    categories = []
    for r in cat_rows:
        cat_name = r["category"] or "General"
        # Capitalize
        cat_name = cat_name.capitalize()
        categories.append({"name": cat_name, "count": r["count"]})

    return {
        "kpi": {
            "total_documents": total_docs,
            "total_chunks": total_chunks,
            "queries_today": queries_today,
            "avg_latency": "N/A" # Not tracking latency yet
        },
        "volume_trend": trend_data,
        "recent_queries": recent_queries,
        "queries_by_category": categories
    }
