from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatSessionCreate(BaseModel):
    category: str = Field(..., description="Category of the session: 'union', 'contract', 'general'")
    title: Optional[str] = None

class Message(BaseModel):
    role: str
    content: str
    created_at: Optional[datetime] = None

class ChatHistory(BaseModel):
    session_id: str
    messages: List[Message]

class DocumentMetadata(BaseModel):
    source_url: Optional[str] = None
    document_type: str
    title: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    category: str = "general"
    use_web_search: bool = False

class ChatResponse(BaseModel):
    response: str
    session_id: str
    sources: List[Dict[str, Any]] = []
