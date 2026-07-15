import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
 
import database
from agents.coordinator import classify_intent
from agents.sales_agent import handle as sales_agent_handle
from agents.lead_qualifier import analyze_lead
from agents.quotation_agent import generate_quotation
from notifier import notify_hot_lead
 
app = FastAPI(title="SalesPilot AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/files", StaticFiles(directory="generated_quotations"), name="files")
 
@app.on_event("startup")
def on_startup():
    """Runs once when the server starts. Ensures our SQLite tables exist."""
    database.init_db()
 
class ChatRequest(BaseModel):
    session_id: str | None = None  
    message: str
 
class ChatResponse(BaseModel):
    session_id: str
    reply: str
    agent_used: str
    intent: str
    lead_status: str
    confidence: int
    sentiment: str
    should_escalate: bool
 
class QuoteRequest(BaseModel):
    customer_name: str
    product_query: str
    is_student: bool = False
 
@app.get("/")
def root():
    """Simple health check -- visiting this URL confirms the server is alive."""
    return {"status": "SalesPilot AI backend is running", "docs": "/docs"}
 
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    
    session_id = request.session_id or str(uuid.uuid4())
 
    database.save_message(session_id, "user", request.message)
    history = database.get_conversation_history(session_id)
 
    intent_result = classify_intent(request.message)
    intent = intent_result["intent"]
 
    lead_result = analyze_lead(history)
    database.upsert_lead(session_id, lead_result)
 
    if intent == "general_or_greeting":
        reply = "Hi there! I'm the TechHub AI assistant. Looking for a laptop or phone today, or have a question I can help with?"
        agent_used = "greeting_handler"
    else:
      
        prior_history = history[:-1]
        reply = sales_agent_handle(request.message, conversation_history=prior_history)
        agent_used = "sales_agent"
 
    database.save_message(session_id, "assistant", reply, agent_used=agent_used)

    if lead_result["should_escalate"]:
        notify_hot_lead(session_id, lead_result, request.message)
 
    return ChatResponse(
        session_id=session_id,
        reply=reply,
        agent_used=agent_used,
        intent=intent,
        lead_status=lead_result["lead_status"],
        confidence=lead_result["confidence"],
        sentiment=lead_result["sentiment"],
        should_escalate=lead_result["should_escalate"],
    )
 
@app.post("/quote")
def create_quote(request: QuoteRequest):
    """
    Separate endpoint for generating an actual downloadable PDF quotation.
    Kept separate from /chat because it needs explicit structured info
    (confirmed customer name + product) rather than free-form chat text.
    """
    result = generate_quotation(
        customer_name=request.customer_name,
        product_query=request.product_query,
        is_student=request.is_student,
    )
    if "error" in result:
        return {"success": False, "error": result["error"]}

    filename = result["pdf_path"].split("\\")[-1].split("/")[-1]
    result["download_url"] = f"/files/{filename}"
    return {"success": True, "quotation": result}
 
@app.get("/leads")
def list_leads():
    """Powers the Day 2 dashboard -- returns all leads with their latest scores."""
    return database.get_all_leads()