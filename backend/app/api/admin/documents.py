from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.api.admin.auth import get_current_admin
from app.models.database import db

router = APIRouter()

class DocumentResponse(BaseModel):
    id: str # UUID
    title: str
    type: str = "Policy" # Default
    category: str = "General"
    status: str = "Active"
    chunk_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    skip: int = 0, 
    limit: int = 50, 
    admin: str = Depends(get_current_admin)
):
    # Fetch documents with chunk counts
    query = """
        SELECT 
            d.id, 
            d.title as title, 
            d.last_updated as created_at,
            COUNT(c.id) as chunk_count
        FROM documents d
        LEFT JOIN document_chunks c ON d.id = c.document_id
        GROUP BY d.id
        ORDER BY d.last_updated DESC
        OFFSET $1 LIMIT $2
    """
    rows = await db.fetch(query, skip, limit)
    
    # Map to schema
    result = []
    for row in rows:
        result.append(DocumentResponse(
            id=str(row['id']),
            title=row['title'],
            chunk_count=row['chunk_count'],
            created_at=row['created_at']
        ))
    return result

@router.delete("/{document_id}")
async def delete_document(document_id: str, admin: str = Depends(get_current_admin)):
    # Delete chunks first (cascade usually handles this, but explicit is safe)
    await db.execute("DELETE FROM document_chunks WHERE document_id = $1", document_id)
    await db.execute("DELETE FROM documents WHERE id = $1", document_id)
    return {"message": "Document deleted"}

@router.get("/{document_id}/content")
async def get_document_content(document_id: str, admin: str = Depends(get_current_admin)):
    content = await db.fetch_val("SELECT content FROM documents WHERE id = $1", document_id)
    if not content:
        raise HTTPException(status_code=404, detail="Document not found")
    
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content)
