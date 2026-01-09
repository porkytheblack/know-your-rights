from fastapi import APIRouter, HTTPException, UploadFile, File, Request, Form
from app.models.schemas import ChatRequest, ChatResponse
from app.services.agent_service import AgentService
from app.services.document_parser import DocumentParser
from app.utils.limiter import limiter
import uuid

router = APIRouter()
agent_service = AgentService()
document_parser = DocumentParser()

@router.post("/", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(request: Request, request_body: ChatRequest):
    session_id = request_body.session_id or str(uuid.uuid4())
    
    # Delegate to Agent Service
    result = await agent_service.handle_chat(
        message=request_body.message, 
        category=request_body.category,
        session_id=session_id,
        use_web_search=request_body.use_web_search
    )
    
    return ChatResponse(
        response=result["response"],
        session_id=session_id,
        sources=result["sources"]
    )

@router.post("/analyze")
async def analyze_contract(
    file: UploadFile = File(...),
    session_id: str = Form(None)
):
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
         raise HTTPException(status_code=400, detail="Invalid file type")

    # 1. Parse Document
    try:
        full_text = await document_parser.parse_file(file)
        
        # 2. Analyze
        analysis = await agent_service.analyze_document(full_text, session_id=session_id)
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_sessions():
    """List recent chat sessions."""
    return await agent_service.get_recent_sessions()

@router.get("/sessions/{session_id}")
async def get_session_history(session_id: str):
    """Get message history for a specific session."""
    messages = await agent_service.get_session_messages(session_id)
    return messages
