from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import sqlite3

app = FastAPI()   # ⚠️ THIS LINE IS CRITICAL

# Database setup
def init_db():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            pending_fee TEXT,
            attendance TEXT,
            timetable TEXT,
            assignments TEXT
        )
    ''')
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN pending_fee TEXT DEFAULT '0'")
        cursor.execute("ALTER TABLE users ADD COLUMN attendance TEXT DEFAULT '0%'")
        cursor.execute("ALTER TABLE users ADD COLUMN timetable TEXT DEFAULT '{}'")
        cursor.execute("ALTER TABLE users ADD COLUMN assignments TEXT DEFAULT '[]'")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()

init_db()

class User(BaseModel):
    id: str
    name: str
    email: str

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend running 🚀"}

@app.get("/greeting")
def get_greeting():
    prompt = 'Generate a catchy, motivational 2-part greeting for a college student using an AI assistant. Return ONLY valid JSON in this exact format, with no other text or markdown: {"header": "Short Catchy Phrase", "subheader": "Slightly longer motivational question"}'
    
    try:
        import json
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }
        )
        data = response.json()
        result = json.loads(data["response"])
        return result
    except Exception as e:
        return {"header": "Hi Student", "subheader": "What can we get done today?"}

class ChatRequest(BaseModel):
    query: str
    context: str = ""

@app.post("/chat")
def chat(req: ChatRequest):
    subjects = "Reinforcement Learning, Computer Vision, Cloud computing, Software Quality Testing, Deep Learning, Generative AI"
    system_context = f"System Context: You are mruGPT, an agentic AI assistant for Mallareddy University. You are talking to a student. Their enrolled subjects are: {subjects}."
    
    if req.context:
        system_context += f" Their current data is: {req.context}."
        
    system_context += " You must answer their questions accurately using this data if relevant, and assist them with any other general college-related inquiries."
    
    prompt = f"{system_context}\n\nUser Question: {req.query}"
        
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "phi",
            "prompt": prompt,
            "stream": False
        }
    )

    data = response.json()
    return {"response": data["response"]}

@app.post("/users")
def add_user(user: User):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email=?", (user.email,))
    if not cursor.fetchone():
        # Mock personal data for new users
        pending_fee = "₹15,000" if "developer" in user.email else "₹0"
        attendance = "85%" if "developer" in user.email else "92%"
        timetable = "09:00 AM - Reinforcement Learning\n10:00 AM - Computer Vision\n11:00 AM - Cloud computing\n01:00 PM - Software Quality Testing\n02:00 PM - Deep Learning\n03:00 PM - Generative AI"
        assignments = "1. Computer Vision Project (Due: Tomorrow)\n2. Deep Learning Worksheet (Due: Friday)"
        
        cursor.execute(
            "INSERT INTO users (id, name, email, pending_fee, attendance, timetable, assignments) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user.id, user.name, user.email, pending_fee, attendance, timetable, assignments)
        )
    conn.commit()
    conn.close()
    return {"message": "User saved"}

@app.get("/student/{email}")
def get_student(email: str):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    cursor.execute("SELECT pending_fee, attendance, timetable, assignments FROM users WHERE email=?", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "pending_fee": row[0],
            "attendance": row[1],
            "timetable": row[2],
            "assignments": row[3]
        }
    return {"error": "Student not found"}