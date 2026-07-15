import os
from groq import Groq
from dotenv import load_dotenv
from rag.vector_store import catalog_store
 
load_dotenv()
 
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"
 
SALES_AGENT_SYSTEM_PROMPT = """You are a friendly, knowledgeable sales assistant for TechHub Computers,
a laptop and mobile phone store. You help customers find the right product and
handle price objections or competitor comparisons professionally.
 
STRICT RULES:
- Only mention products, prices, and specs that appear in the CATALOG CONTEXT below.
- If the catalog context doesn't have what the customer needs, say so honestly
  and offer to connect them with a human sales rep — never invent a product or price.
- Keep replies conversational and concise (3-5 sentences), like a real salesperson
  texting back, not a wall of text.
- If handling an objection/comparison, use the competitor comparison notes if relevant,
  but stay respectful of competitors — no bashing, just factual advantages.
"""
 
def _is_useful_chunk(chunk):
    """
    Filters out chunks that are just a lone section header with no real
    product data (these can happen because we split the catalog on '====').
    A useful chunk should have some minimum length and ideally a 'Price' line.
    """
    return len(chunk.strip()) > 40
 
def handle(customer_message , conversation_history):
    """
    Main entry point for this agent. Called by main.py once the Coordinator
    has decided the intent is product_inquiry or objection_or_comparison.
 
    conversation_history: optional list of prior {"role": ..., "content": ...}
    messages, so the agent has context in a multi-turn conversation.
    """

    raw_chunks = catalog_store.search(customer_message, top_k=4)
    useful_chunks = [c for c in raw_chunks if _is_useful_chunk(c)]
 
    if useful_chunks:
        catalog_context = "\n\n---\n\n".join(useful_chunks)
    else:
        catalog_context = "No matching catalog entries found."
 
    messages = [{"role": "system", "content": SALES_AGENT_SYSTEM_PROMPT}]
 
    if conversation_history:
        messages.extend(conversation_history)
 
    messages.append({
        "role": "user",
        "content": f"CATALOG CONTEXT:\n{catalog_context}\n\nCUSTOMER MESSAGE:\n{customer_message}",
    })
 
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.6,  
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
 
    except Exception as e:
       
        return (
            "Sorry, I'm having a little trouble looking that up right now. "
            "A team member will follow up with you shortly! "
            f"(internal error: {str(e)})"
        )
 
if __name__ == "__main__":
    
    test_msgs = [
        "Do you have any laptops under 40000 for college?",
        "That MacBook seems really expensive compared to Amazon",
    ]
    for msg in test_msgs:
        print(f"Customer: {msg}")
        print(f"Agent: {handle(msg)}\n")
 