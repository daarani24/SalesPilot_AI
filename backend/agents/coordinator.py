import os
import json
from groq import Groq
from dotenv import load_dotenv
 
load_dotenv()
 
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"
 
VALID_INTENTS = [
    "product_inquiry",     
    "pricing_or_quote",    
    "objection_or_comparison",  
    "general_or_greeting",  
]
 
COORDINATOR_SYSTEM_PROMPT = f"""You are a routing classifier for a laptop and mobile phone store's sales chatbot.
Read the customer's message and classify it into EXACTLY ONE of these intents:
 
- product_inquiry: asking about products, specs, recommendations, comparisons of features
- pricing_or_quote: asking about price, discounts, EMI, or wants a formal quotation
- objection_or_comparison: pushing back on price, comparing to competitors, hesitating to buy
- general_or_greeting: greetings, small talk, or anything unclear
 
Respond with ONLY valid JSON in this exact format, nothing else:
{{"intent": "one_of_the_four_values", "reasoning": "one short sentence why"}}
"""
 
 
def classify_intent(customer_message:str)->dict:
    """
    Calls the LLM once with a small, cheap prompt to classify intent.
    Returns a dict like: {"intent": "product_inquiry", "reasoning": "..."}
 
    We keep this call separate and lightweight (no RAG, no long context)
    so routing stays fast — the specialist agent does the heavier work.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": COORDINATOR_SYSTEM_PROMPT},
                {"role": "user", "content": customer_message},
            ],
            temperature=0.2,  
            max_tokens=100,
        )
        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
 
        if result.get("intent") not in VALID_INTENTS:
            result["intent"] = "general_or_greeting"
            result["reasoning"] = "Fallback: model returned an unrecognized intent."
 
        return result
 
    except (json.JSONDecodeError, Exception) as e:

        return {
            "intent": "general_or_greeting",
            "reasoning": f"Fallback due to error: {str(e)}",
        }
 
if __name__ == "__main__":
    
    test_messages = [
        "Hi there!",
        "Do you have any laptops under 40000 for college?",
        "That MacBook seems really expensive compared to Amazon",
        "Can you give me a formal quote for the Dell Inspiron 14?",
    ]
    for msg in test_messages:
        result = classify_intent(msg)
        print(f"Message: {msg}\n  -> Intent: {result['intent']}\n  -> Why: {result['reasoning']}\n")
 