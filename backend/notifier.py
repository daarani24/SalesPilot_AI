import os
import smtplib
from email.mime.text import MIMEText
from datetime import datetime
from dotenv import load_dotenv
 
load_dotenv()
 
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")
ALERT_RECIPIENT = os.getenv("ALERT_RECIPIENT")
 
def notify_hot_lead(session_id: str, lead_data: dict, last_customer_message: str):
    """
    Called from main.py whenever should_escalate is True.
    Always logs to console/log file. Sends a real email ONLY if email
    credentials are present in .env -- otherwise skips silently.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    alert_text = (
        f"\n{'='*60}\n"
        f"🔥 HOT LEAD ALERT — {timestamp}\n"
        f"Session: {session_id}\n"
        f"Lead status: {lead_data['lead_status']} (confidence: {lead_data['confidence']}%)\n"
        f"Sentiment: {lead_data['sentiment']} | Urgency: {lead_data['urgency']}\n"
        f"Reason: {lead_data.get('reasoning', 'N/A')}\n"
        f"Last message: \"{last_customer_message}\"\n"
        f"{'='*60}\n"
    )
 
    print(alert_text)
 
    _append_to_log_file(alert_text)
 
    if EMAIL_ADDRESS and EMAIL_APP_PASSWORD and ALERT_RECIPIENT:
        _send_email_alert(session_id, lead_data, last_customer_message)
 
def _append_to_log_file(alert_text:str):
    """Keeps a persistent record of all escalations, even after the server restarts."""
    log_path = os.path.join(os.path.dirname(__file__), "..", "data", "escalation_log.txt")
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(alert_text)
 
def _send_email_alert(session_id: str, lead_data: dict, last_customer_message: str):
    """Sends a real email via Gmail SMTP. Wrapped in try/except so a failed
    email never crashes the chat response the customer is waiting on."""
    try:
        subject = f"🔥 Hot Lead Alert - Session {session_id[:8]}"
        body = (
            f"A customer conversation just crossed the hot-lead threshold.\n\n"
            f"Lead status: {lead_data['lead_status']} ({lead_data['confidence']}% confidence)\n"
            f"Sentiment: {lead_data['sentiment']}\n"
            f"Urgency: {lead_data['urgency']}\n"
            f"Last message: {last_customer_message}\n\n"
            f"Reply to this customer as soon as possible."
        )
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = ALERT_RECIPIENT
 
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
            server.send_message(msg)
 
    except Exception as e:
        
        print(f"[notifier] Email alert failed (non-fatal): {e}")
 
if __name__ == "__main__":

    notify_hot_lead(
        session_id="test-session-123",
        lead_data={
            "lead_status": "Hot",
            "confidence": 92,
            "sentiment": "Urgent",
            "urgency": "high",
            "reasoning": "Customer requested a formal quote with a deadline.",
        },
        last_customer_message="Can you send me a quote today? I need it urgently.",
    )