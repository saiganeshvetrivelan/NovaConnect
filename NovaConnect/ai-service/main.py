from fastapi import FastAPI
from pydantic import BaseModel
import spacy
from typing import List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import uvicorn
import re
import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NovaConnect AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spacy model (try english small model)
try:
    nlp = spacy.load("en_core_web_sm")
except:
    import os
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

class ForumQuery(BaseModel):
    post_content: str

@app.post("/ai/categorize-query")
def categorize_query(query: ForumQuery):
    doc = nlp(query.post_content)
    text_lower = query.post_content.lower()
    
    # Keyword-based categorization
    if any(w in text_lower for w in ['exam', 'test', 'quiz', 'midterm', 'final']):
        return {"suggested_tags": ["Exams", "General"]}
    if any(w in text_lower for w in ['assignment', 'homework', 'project', 'submit', 'deadline']):
        return {"suggested_tags": ["Assignment", "General"]}
    if any(w in text_lower for w in ['announcement', 'notice', 'important']):
        return {"suggested_tags": ["Announcement"]}
    if any(w in text_lower for w in ['algorithm', 'code', 'program', 'debug', 'function']):
        return {"suggested_tags": ["Algorithms", "General"]}
    
    nouns = [chunk.text for chunk in doc.noun_chunks if len(chunk.text) > 3]
    unique_tags = list(set(nouns))[:2]
    if not unique_tags:
        unique_tags = ["General"]
    return {"suggested_tags": unique_tags}

# ── AI Chat Assistant ─────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None  # role: student/faculty/admin

ACADEMIC_KB = {
    "attendance": "Attendance is tracked per course. Students need at least 75% attendance to be eligible for exams. Faculty can mark attendance by going to Attendance → Select Course → Mark Register.",
    "assignment": "Assignments are listed in the Assignments section. Students can submit text-based work and get an automatic AI plagiarism check. Faculty can create, view submissions, and grade them.",
    "forum": "The Discussion Forum is organized by course channels. You can post questions, reply to threads, and Faculty can pin important announcements. Messages are real-time via WebSocket.",
    "grade": "Grades are assigned by Faculty in the Grading tab under Assignments. Students can view their grades in My Submissions.",
    "resource": "Course resources (files, PDFs, slides) can be uploaded by Faculty in the Resources section. Students can download them anytime.",
    "course": "Courses are listed in the My Courses section. Click a course card to see its overview, resources, assignments, and forum.",
    "message": "You can send direct messages to any user via the Messages section. Use Compose to start a new conversation.",
    "plagiarism": "NovaConnect uses AI-powered TF-IDF cosine similarity to detect plagiarism in assignment submissions. Submissions above 40% similarity are flagged.",
    "password": "Contact your administrator to reset your password. The admin can update your credentials from the User Directory.",
    "deadline": "Assignment deadlines are shown in the Assignments section. Overdue assignments are marked with a red warning badge.",
    "enrollment": "Student enrollment is managed by the Admin. Contact your administrator to enroll in additional courses.",
    "notification": "Real-time notifications appear in your dashboard when new messages or forum posts are added to your courses.",
    "help": "NovaConnect is an AI-integrated academic platform. You can access: Dashboard, Courses, Forum, Assignments, Resources, Messages, and Attendance.",
}

def generate_ai_response(message: str, context: str = None) -> str:
    msg_lower = message.lower().strip()
    
    # Greetings
    if any(w in msg_lower for w in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
        role_str = f" ({context})" if context else ""
        return f"Hello{role_str}! 👋 I'm Nova, your AI academic assistant. How can I help you today? You can ask me about courses, assignments, attendance, resources, or anything about the platform."
    
    # Thank you
    if any(w in msg_lower for w in ['thank', 'thanks', 'thank you']):
        return "You're welcome! 😊 If you have any other questions, feel free to ask anytime."
    
    # Check knowledge base
    for keyword, response in ACADEMIC_KB.items():
        if keyword in msg_lower:
            return f"📚 **{keyword.title()}**: {response}"
    
    # Time-based queries
    if 'time' in msg_lower or 'date' in msg_lower:
        now = datetime.datetime.now()
        return f"🕐 Current date and time: **{now.strftime('%B %d, %Y at %I:%M %p')}**"
    
    # NLP analysis using spacy
    doc = nlp(message)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    
    # General academic help
    if any(w in msg_lower for w in ['how', 'what', 'when', 'where', 'why', 'who']):
        return f"That's a great question! 🤔 I can help you with: attendance tracking, assignment submissions, course resources, discussion forums, grading, and messaging. Could you be more specific about what you need help with?"
    
    return f"I understand you're asking about: **'{message}'**. As your AI assistant, I can help with academic queries about courses, assignments, attendance, resources, and platform navigation. Please try asking something like: 'How do I submit an assignment?' or 'What is the attendance policy?'"

class ChatRequest(BaseModel):
    message: str
    user_role: Optional[str] = "Student"
    conversation_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    suggested_actions: List[str]

@app.post("/ai/chat", response_model=ChatResponse)
def ai_chat(req: ChatRequest):
    response = generate_ai_response(req.message, req.user_role)
    
    # Generate context-aware suggestions
    msg_lower = req.message.lower()
    suggestions = []
    if 'assignment' in msg_lower:
        suggestions = ["Go to Assignments", "View my submissions", "Check deadlines"]
    elif 'attendance' in msg_lower:
        suggestions = ["View attendance records", "Check attendance percentage"]
    elif 'course' in msg_lower:
        suggestions = ["Browse my courses", "Open course forum", "View resources"]
    elif 'message' in msg_lower:
        suggestions = ["Open Messages", "Compose new message"]
    else:
        suggestions = ["View Dashboard", "Check Assignments", "Browse Courses"]
    
    return ChatResponse(response=response, suggested_actions=suggestions[:3])

# ── Forum Post Tagging ─────────────────────────────────────────────────────────
@app.post("/ai/suggest-tags")
def suggest_tags(query: ForumQuery):
    return categorize_query(query)

# ── Note Summarization ─────────────────────────────────────────────────────────
class DocumentContent(BaseModel):
    text: str

@app.post("/ai/summarize-resource")
def summarize_text(doc: DocumentContent):
    text = doc.text[:500]
    if len(text) < 50:
        return {"summary": text}
    
    # Extractive summarization using spacy sentence ranking
    sentences = [sent.text.strip() for sent in nlp(text).sents if len(sent.text.strip()) > 20]
    if not sentences:
        return {"summary": text[:200] + "..."}
    
    # Return first 2 most relevant sentences
    summary = " ".join(sentences[:2])
    return {"summary": summary}

# ── Plagiarism Check ───────────────────────────────────────────────────────────
class SimilarityRequest(BaseModel):
    new_submission_text: str
    existing_submissions_texts: List[str]

@app.post("/ai/plagiarism-check")
def check_similarity(req: SimilarityRequest):
    if not req.existing_submissions_texts or not req.new_submission_text.strip():
        return {"max_similarity_score": 0.0, "is_flagged": False}
        
    corpus = [req.new_submission_text] + req.existing_submissions_texts
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        max_similarity = max(similarities) if len(similarities) > 0 else 0
    except:
        max_similarity = 0
    
    return {
        "max_similarity_score": round(float(max_similarity) * 100, 2),
        "is_flagged": float(max_similarity) > 0.40
    }

# ── Student Engagement Analysis ────────────────────────────────────────────────
class AnalyticsRequest(BaseModel):
    attendance_rate: float
    forum_posts_count: int
    assignments_on_time: float

@app.post("/ai/engagement-analysis")
def analyze_engagement(req: AnalyticsRequest):
    score = (req.attendance_rate * 0.4) + (min(req.forum_posts_count, 10)/10 * 0.2) + (req.assignments_on_time * 0.4)
    status = "Highly Engaged" if score > 0.8 else ("At Risk" if score < 0.5 else "Average")
    return {"engagement_score": round(score * 100, 2), "status": status}

@app.get("/health")
def health():
    return {"status": "ok", "service": "NovaConnect AI", "version": "2.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

