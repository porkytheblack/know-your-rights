import asyncio
import httpx
import uuid

BASE_URL = "http://localhost:8000"

async def run_tests():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("--- Starting End-to-End Tests ---")

        # 1. Test Health
        try:
            resp = await client.get(f"{BASE_URL}/health")
            print(f"Health Check: {resp.status_code} - {resp.json()}")
        except Exception as e:
            print(f"Health Check Failed: {e}")
            return

        # 2. Test Chat (Public)
        print("\n--- Testing Chat ---")
        chat_payload = {
            "message": "What are my rights regarding sick leave?",
            "category": "general"
        }
        resp = await client.post(f"{BASE_URL}/api/chat/", json=chat_payload)
        if resp.status_code == 200:
            data = resp.json()
            print(f"Chat Response: Success (Session ID: {data['session_id']})")
            print(f"Agent Answer: {data['response'][:100]}...")
        else:
            print(f"Chat Failed: {resp.status_code} - {resp.text}")

        # 2b. Test Forced Web Search
        print("\n--- Testing Chat with Forced Web Search ---")
        chat_payload_web = {
            "message": "What is the capital of France?", # Irrelevant to labor rights, should fail RAG but succeed with Web Search
            "category": "general",
            "use_web_search": True
        }
        resp = await client.post(f"{BASE_URL}/api/chat/", json=chat_payload_web)
        if resp.status_code == 200:
            data = resp.json()
            sources = data.get('sources', [])
            has_web = any(s['type'] == 'Web' for s in sources)
            print(f"Forced Search Response: Success")
            print(f"Has Web Sources: {has_web}")
            if not has_web:
                print("WARNING: Web search was forced but no web sources returned.")
        else:
            print(f"Forced Search Failed: {resp.status_code} - {resp.text}")

        # 2c. Test Implicit Agentic Search (New Feature)
        print("\n--- Testing Implicit Agentic Search ---")
        chat_payload_implicit = {
            "message": "Are there any ongoing doctor strikes in Kenya right now?", # Should trigger agent search
            "category": "general",
            # use_web_search defaults to False
        }
        resp = await client.post(f"{BASE_URL}/api/chat/", json=chat_payload_implicit)
        if resp.status_code == 200:
            data = resp.json()
            sources = data.get('sources', [])
            has_web = any(s['type'] == 'Web' for s in sources)
            print(f"Implicit Search Response: Success")
            print(f"Has Web Sources: {has_web}")
            if not has_web:
                print("WARNING: Implicit search failed. Agent decided NOT to search.")
        else:
            print(f"Implicit Search Failed: {resp.status_code} - {resp.text}")

        # 2d. Test Multi-Turn Context
        print("\n--- Testing Multi-Turn Context ---")
        # Turn 1: Establish context
        turn1_payload = {
            "message": "My name is Jon. Remember this.",
            "category": "general"
        }
        resp1 = await client.post(f"{BASE_URL}/api/chat/", json=turn1_payload)
        session_id = None
        if resp1.status_code == 200:
            data1 = resp1.json()
            session_id = data1.get("session_id")
            print(f"Turn 1 Success. Session ID: {session_id}")
        else:
            print(f"Turn 1 Failed: {resp1.status_code}")

        if session_id:
            # Turn 2: Recall context
            turn2_payload = {
                "message": "What is my name?",
                "category": "general",
                "session_id": session_id
            }
            resp2 = await client.post(f"{BASE_URL}/api/chat/", json=turn2_payload)
            if resp2.status_code == 200:
                data2 = resp2.json()
                answer = data2.get("response", "")
                print(f"Turn 2 Answer: {answer}")
                if "Jon" in answer:
                    print("Context Verification: PASSED")
                else:
                    print("Context Verification: FAILED (Name not found)")
            else:
                 print(f"Turn 2 Failed: {resp2.status_code}")

        # 3. Test Admin Login (Auth)
        print("\n--- Testing Admin Login ---")
        # Use form data for OAuth2
        login_data = {"username": "admin@example.com", "password": "admin"}
        resp = await client.post(f"{BASE_URL}/api/admin/auth/login", data=login_data)
        
        headers = {} # Initialize headers
        if resp.status_code == 200:
            print(f"Login Success! Token obtained.")
            headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}
        else:
            print(f"Login Failed: {resp.status_code} - {resp.text}")
            return

        # 4. Test Contextual Document Analysis
        print("\n--- Testing Contextual Document Analysis ---")
        doc_session_id = str(uuid.uuid4())
        dummy_content = b"This is a sample employment contract. Termination requires 3 months notice."
        files = {'file': ('contract.txt', dummy_content, 'text/plain')}
        data = {'session_id': doc_session_id}
        
        print(f"Uploading doc to session: {doc_session_id}")
        resp = await client.post(f"{BASE_URL}/api/chat/analyze", files=files, data=data)
        
        if resp.status_code == 200:
            print("Analysis Response: Success")
            
            # Now ask a question about it
            print("Asking follow-up question...")
            chat_payload = {
                "message": "How much notice is needed for termination?",
                "session_id": doc_session_id,
                "category": "contract"
            }
            chat_resp = await client.post(f"{BASE_URL}/api/chat/", json=chat_payload)
            if chat_resp.status_code == 200:
                answer = chat_resp.json()['response']
                print(f"Follow-up Answer: {answer}")
                if "3 months" in answer or "three months" in answer.lower():
                     print("Context Verification: PASSED")
                else:
                     print("Context Verification: FAILED (Notice period not found)")
            else:
                 print(f"Follow-up Chat Failed: {chat_resp.status_code}")
        else:
             print(f"Analysis Failed: {resp.status_code} - {resp.text}")

        # 5. Test Admin Documents List (to verify column fix)
        print("\n--- Testing Admin Documents List ---")
        if headers:
            docs_resp = await client.get(f"{BASE_URL}/api/admin/documents/", headers=headers)
            if docs_resp.status_code == 200:
                 print("List Documents: Success")
                 docs = docs_resp.json()
                 print(f"Found {len(docs)} documents.")
                 if len(docs) > 0:
                     print(f"First Doc: {docs[0]}")
            else:
                 print(f"List Documents Failed: {docs_resp.status_code} - {docs_resp.text}")
        else:
            print("Skipping Admin Documents List: No admin token available.")

        # 6. Test Protected News Scrape
        print("\n--- Testing Protected News Scrape ---")
        if headers:
            scrape_resp = await client.post(
                f"{BASE_URL}/api/admin/news/scrape?query=Kenya%20Labor&limit=1", 
                headers=headers
            )
            if scrape_resp.status_code == 200:
                print(f"Scrape Trigger Success: {scrape_resp.json()}")
            else:
                print(f"Scrape Trigger Failed: {scrape_resp.status_code} - {scrape_resp.text}")

        print("\n--- Tests Completed ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
