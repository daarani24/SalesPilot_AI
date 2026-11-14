import os
import re
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.1-8b-instant"

VALID_INTENTS = [
    "product_inquiry",
    "pricing_or_quote",
    "objection_or_comparison",
    "general_or_greeting",
]

CONTEXT_WINDOW = 4

COORDINATOR_SYSTEM_PROMPT = f"""You are a routing classifier for a laptop and mobile phone store's sales chatbot.
You will be shown the RECENT CONVERSATION (may include prior turns) and the CUSTOMER'S LATEST MESSAGE.
Classify the LATEST message into EXACTLY ONE of these intents, using the prior turns for context
when the latest message alone is ambiguous (e.g. a short reply like "cash" or "yes" that only
makes sense given what was just asked):

- product_inquiry: asking about products, specs, recommendations, comparisons of features
- pricing_or_quote: asking about price, discounts, EMI, wants a formal quotation, or is continuing
  a pricing/purchase conversation (e.g. answering a question the assistant just asked about payment,
  discount eligibility, or order details)
- objection_or_comparison: pushing back on price, comparing to competitors, hesitating to buy
- general_or_greeting: greetings, small talk, or genuinely unclear with no relevant prior context

Respond with ONLY valid JSON in this exact format, nothing else:
{{"intent": "one_of_the_four_values", "reasoning": "one short sentence why"}}
"""

def classify_intent(customer_message: str, conversation_history: list[dict] | None = None) -> dict:
    context_block = ""
    if conversation_history:
        recent = conversation_history[-CONTEXT_WINDOW:]
        context_block = "\n".join(f"{t['role'].upper()}: {t['content']}" for t in recent)

    user_content = (
        f"RECENT CONVERSATION:\n{context_block if context_block else '(none, this is the first message)'}\n\n"
        f"CUSTOMER'S LATEST MESSAGE:\n{customer_message}"
    )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": COORDINATOR_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.2,
            max_tokens=100,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content.strip()
        print(f"[coordinator] RAW: {raw!r}")

        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON object found in model output")
        result = json.loads(match.group(0))

        result["intent"] = str(result.get("intent", "")).strip().lower()
        if result["intent"] not in VALID_INTENTS:
            print(f"[coordinator] Unrecognized intent: {result['intent']!r}")
            result["intent"] = "product_inquiry"
            result["reasoning"] = "Fallback: unrecognized intent."
        return result

    except Exception as e:
        print(f"[coordinator] ERROR: {type(e).__name__}: {e}")
        return {
            "intent": "product_inquiry",   # fail toward the sales agent, not the greeting
            "reasoning": f"Fallback due to error: {e}",
        }

if __name__ == "__main__":

    print("-- Without context (old bug reproduced) --")
    print(classify_intent("cash"))

    print("\n-- With context (fixed) --")
    history = [
        {"role": "user", "content": "I want to book the Acer Aspire 3"},
        {"role": "assistant", "content": "Great choice! Would you like to pay online or cash on delivery?"},
    ]
    print(classify_intent("cash", conversation_history=history))