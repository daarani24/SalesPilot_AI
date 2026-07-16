import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "salespilot.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  
    return conn

def init_db():
    """Creates the tables if they don't already exist. Safe to call on every startup."""
    conn = get_connection()
    cursor = conn.cursor()
 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            agent_used TEXT,
            timestamp TEXT NOT NULL
        )
    """)
 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            session_id TEXT PRIMARY KEY,
            lead_status TEXT,
            confidence INTEGER,
            sentiment TEXT,
            urgency TEXT,
            should_escalate INTEGER,
            updated_at TEXT
        )
    """)
 
    conn.commit()
    conn.close()
 
def save_message(session_id: str, role: str, content: str, agent_used: str = None):
    """Logs one chat message (customer or agent) to the conversations table."""
    conn = get_connection()
    conn.execute(
        "INSERT INTO conversations (session_id, role, content, agent_used, timestamp) VALUES (?, ?, ?, ?, ?)",
        (session_id, role, content, agent_used, datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()
 
def upsert_lead(session_id: str, lead_data: dict):
    """
    Saves/updates the latest lead score for a session.
    'Upsert' = insert if new, update if the session already has a score
    (a lead's status can change as the conversation develops).
    """
    conn = get_connection()
    conn.execute("""
        INSERT INTO leads (session_id, lead_status, confidence, sentiment, urgency, should_escalate, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
            lead_status=excluded.lead_status,
            confidence=excluded.confidence,
            sentiment=excluded.sentiment,
            urgency=excluded.urgency,
            should_escalate=excluded.should_escalate,
            updated_at=excluded.updated_at
    """, (
        session_id,
        lead_data.get("lead_status"),
        lead_data.get("confidence"),
        lead_data.get("sentiment"),
        lead_data.get("urgency"),
        int(lead_data.get("should_escalate", False)),
        datetime.now().isoformat(),
    ))
    conn.commit()
    conn.close()
 
 
def get_conversation_history(session_id: str) -> list[dict]:
    """Returns the full message history for a session, formatted for LLM message lists."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT role, content FROM conversations WHERE session_id = ? ORDER BY id ASC",
        (session_id,),
    ).fetchall()
    conn.close()
    return [{"role": row["role"], "content": row["content"]} for row in rows]
 
 
def get_all_leads() -> list[dict]:
    """Returns all leads -- used by the Day 2 dashboard."""
    conn = get_connection()
    rows = conn.execute("SELECT * FROM leads ORDER BY updated_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]