import PyPDF2
import docx
from fastapi import UploadFile
import io

class DocumentParser:
    async def parse_file(self, file: UploadFile) -> str:
        content = await file.read()
        file_ext = file.filename.split('.')[-1].lower()
        
        if file_ext == 'pdf':
            return self._parse_pdf(content)
        elif file_ext == 'docx':
            return self._parse_docx(content)
        elif file_ext == 'txt':
            return content.decode('utf-8')
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

    def _parse_pdf(self, content: bytes) -> str:
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

    def _parse_docx(self, content: bytes) -> str:
        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text

    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
        # Simple sliding window chunking
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunks.append(text[start:end])
            start += chunk_size - overlap
            
        return chunks

document_parser = DocumentParser()
