import os
from groq import Groq
from dotenv import load_dotenv
from rag.vector_store import get_catalog_store

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"

MAX_HISTORY_TURNS = 6

SALES_AGENT_SYSTEM_PROMPT = """You are a friendly, knowledgeable sales assistant for TechHub Computers,
a laptop and mobile phone store. You help customers find the right product and
handle price objections or competitor comparisons professionally.

STRICT RULES:
- Only mention products, prices, and specs that appear in the CATALOG CONTEXT below.
- If the catalog context doesn't have what the customer needs, say so honestly
  and offer to connect them with a human sales rep -- never invent a product or price.
- Keep replies conversational and concise (3-5 sentences), like a real salesperson
  texting back, not a wall of text.
- EXCEPTION: if the customer asks to see multiple products, brands, or prices compared
  side by side (e.g. "what brands do you have", "compare these", "show me all options"),
  format that part as a markdown table with columns like Brand | Model | Price, instead
  of a paragraph -- it's much easier to scan. You can still add a short sentence before
  or after the table.
- If handling an objection/comparison, use the competitor comparison notes if relevant,
  but stay respectful of competitors -- no bashing, just factual advantages.

CRITICAL - NEVER DO THIS: you have NO ability to actually place orders, process payments,
confirm cash-on-delivery, send confirmation emails, schedule deliveries, or generate PDF
quotations yourself from this chat. You are a conversational sales assistant only. NEVER say
things like "your order is confirmed", "we'll email you", "I've prepared your quotation",
"I'll generate the PDF for you", or "once it's ready I'll let you know" -- none of that is
something you can actually do, and saying it would be a false promise to a real customer.

When a customer wants to buy/book/order, or asks you to generate/prepare a quotation:
- Confirm which exact product they want (product name + price).
- Tell them clearly, in one short sentence, to click the document/quote icon button next to
  the chat input -- that opens a form that generates their REAL official PDF quotation
  instantly, themselves, right now. This is a genuine self-service feature, not something
  you do on their behalf.
- Do NOT say you are "preparing" or "generating" anything yourself, and do not repeat
  yourself if they say "ok" -- once you've pointed them to the button, a short
  acknowledgment is enough (e.g. "Great, just click the quote icon whenever you're ready!").
- Only mention the human sales team for what happens AFTER the quotation exists: finalizing
  payment and delivery. Don't use "our team will follow up" as a stand-in for generating
  the quotation itself.
"""

def _is_useful_chunk(chunk: str) -> bool:
    """
    Filters out chunks that are just a lone section header with no real
    product data (these can happen because we split the catalog on '====').
    A useful chunk should have some minimum length and ideally a 'Price' line.
    """
    return len(chunk.strip()) > 40

def _build_search_query(customer_message: str, conversation_history: list[dict] | None) -> str:
    """
    Builds the text used for RAG search. A short follow-up like "under 30k,
    what brands?" carries no useful search signal on its own -- it only makes
    sense combined with what was just being discussed (e.g. "phones"). So we
    prepend the last couple of turns to the current message before searching,
    giving ChromaDB the topic context it needs to retrieve the right chunks.
    """
    if not conversation_history:
        return customer_message

    recent = conversation_history[-2:]
    context_text = " ".join(turn["content"] for turn in recent)
    return f"{context_text} {customer_message}"

def handle(customer_message: str, conversation_history: list[dict] | None = None) -> str:
    """
    Main entry point for this agent. Called by main.py once the Coordinator
    has decided the intent is product_inquiry or objection_or_comparison.

    conversation_history: optional list of prior {"role": ..., "content": ...}
    messages, so the agent has context in a multi-turn conversation.
    """
   
    search_query = _build_search_query(customer_message, conversation_history)
    raw_chunks = get_catalog_store().search(search_query, top_k=4)
    useful_chunks = [c for c in raw_chunks if _is_useful_chunk(c)]

    if useful_chunks:
        catalog_context = "\n\n---\n\n".join(useful_chunks)
    else:
        catalog_context = "No matching catalog entries found."

    messages = [{"role": "system", "content": SALES_AGENT_SYSTEM_PROMPT}]

    if conversation_history:
        messages.extend(conversation_history[-MAX_HISTORY_TURNS:])

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