from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from app.models.database import get_database_pool
from app.services.document_parser import document_parser
from app.services.embedding_service import embedding_service
from app.models.schemas import DocumentMetadata
import uuid
import json

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: str = Form("general"),
    source_url: str = Form(None),
    background_tasks: BackgroundTasks = None
):
    # 1. Parse text
    try:
        text = await document_parser.parse_file(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # 2. Save document record
    doc_id = uuid.uuid4()
    pool = await get_database_pool()
    
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO documents (id, title, content, document_type, source_url, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, doc_id, title, text, document_type, source_url, json.dumps({}))

    # 3. Process embeddings in background
    if background_tasks:
        background_tasks.add_task(process_document_embeddings, doc_id, text)
    else:
        # If no background task support (e.g. testing), run await
        await process_document_embeddings(doc_id, text)
        
    return {"id": str(doc_id), "status": "processing"}

async def process_document_embeddings(doc_id: uuid.UUID, text: str):
    chunks = document_parser.chunk_text(text)
    pool = await get_database_pool()
    
    # Generate embeddings
    embeddings = await embedding_service.batch_embed(chunks)
    
    # Save chunks
    async with pool.acquire() as conn:
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            embedding_json = json.dumps(embedding)
            await conn.execute("""
                INSERT INTO document_chunks (id, document_id, chunk_text, chunk_index, embedding)
                VALUES ($1, $2, $3, $4, $5::vector)
            """, uuid.uuid4(), doc_id, chunk, i, embedding_json)
