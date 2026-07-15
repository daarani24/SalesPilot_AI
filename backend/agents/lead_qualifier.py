import os
import json
from groq import Groq
from dotenv import load_dotenv
 
load_dotenv()
 
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"
 
VALID_LEAD_STATUSES = ["Hot", "Warm", "Cold"]
VALID_SENTIMENTS = ["Happy", "Interested", "Confused", "Negative", "Urgent"]

ESCALATION_LEAD_STATUS = "Hot"
ESCALATION_MIN_CONFIDENCE = 70
 
QUALIFIER_SYSTEM_PROMPT = f"""You are an experienced sales manager silently observing a customer
conversation with a laptop/mobile store's AI sales assistant. You do NOT reply to the
customer. You only assess the conversation and output a structured judgment.
 
Assess:
1. lead_status: one of {VALID_LEAD_STATUSES}
   - Hot: shows clear buying intent (asking for quote, price, "how do I buy", urgency, budget stated)
   - Warm: interested, comparing options, asking detailed questions, but not ready to commit yet
   - Cold: just browsing, vague questions, early research, or unrelated small talk
 
2. confidence: integer 0-100, how confident you are in the lead_status judgment
   (low confidence if the conversation is too short/early to tell)
 
3. sentiment: one of {VALID_SENTIMENTS}
 
4. urgency: one of ["low", "medium", "high"]
 
Respond with ONLY valid JSON, nothing else, in this exact format:
{{"lead_status": "...", "confidence": 0, "sentiment": "...", "urgency": "...", "reasoning": "one short sentence"}}
"""

def analyze_lead(conversation_history):
    """
    conversation_history: list of {"role": "user"/"assistant", "content": "..."}
    representing the conversation SO FAR (can be just one customer message,
    or the full multi-turn chat -- the more context, the more accurate the score).
 
    Returns a dict with lead_status, confidence, sentiment, urgency, reasoning,
    plus a computed "should_escalate" boolean.
    """
    transcript = "\n".join(
        f"{turn['role'].upper()}: {turn['content']}" for turn in conversation_history
    )
 
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": QUALIFIER_SYSTEM_PROMPT},
                {"role": "user", "content": f"CONVERSATION SO FAR:\n{transcript}"},
            ],
            temperature=0.2,
            max_tokens=150,
        )
        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
 
        if result.get("lead_status") not in VALID_LEAD_STATUSES:
            result["lead_status"] = "Cold"
        if result.get("sentiment") not in VALID_SENTIMENTS:
            result["sentiment"] = "Interested"
        if not isinstance(result.get("confidence"), (int, float)):
            result["confidence"] = 0
 
        result["should_escalate"] = (
            result["lead_status"] == ESCALATION_LEAD_STATUS
            and result["confidence"] >= ESCALATION_MIN_CONFIDENCE
        )
 
        return result
 
    except Exception as e:
        return {
            "lead_status": "Cold",
            "confidence": 0,
            "sentiment": "Interested",
            "urgency": "low",
            "reasoning": f"Fallback due to error: {str(e)}",
            "should_escalate": False,
        }
 
if __name__ == "__main__":
    test_conversations = [
        [{"role": "user", "content": "Hi, just looking around"}],
        [
            {"role": "user", "content": "Do you have laptops under 40000?"},
            {"role": "assistant", "content": "Yes! The Acer Aspire 3 at 32,999 or HP 15s at 36,499."},
            {"role": "user", "content": "Great, can you give me a formal quote for the Acer one? I need it by tomorrow, my college starts."},
        ],
    ]
    for convo in test_conversations:
        result = analyze_lead(convo)
        print(f"Conversation: {[t['content'] for t in convo]}")
        print(f"  -> {result}\n")
 