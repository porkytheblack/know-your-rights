import json
from openai import AsyncOpenAI
from app.config import settings
from app.utils.prompt_templates import CONTRACT_REVIEW_SYSTEM_PROMPT

class ContractAnalyzer:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_contract(self, contract_text: str) -> dict:
        """
        Analyzes a contract text and returns structured risk assessment.
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": CONTRACT_REVIEW_SYSTEM_PROMPT.format(contract_text=contract_text)},
                    {"role": "user", "content": "Please analyze this contract."}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from AI")
                
            return json.loads(content)
        except Exception as e:
            print(f"Error analyzing contract: {e}")
            return {
                "overall_score": 0,
                "assessment_summary": "Error processing contract.",
                "compliant_terms": [],
                "areas_of_concern": [
                    {"clause": "N/A", "risk_level": "High", "explanation": f"System Error: {str(e)}", "recommendation": "Retry analysis"}
                ],
                "missing_clauses": []
            }
