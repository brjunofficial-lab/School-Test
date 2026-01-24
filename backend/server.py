from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import logging
import uuid
import bcrypt
import jwt
import base64
from io import BytesIO
from PIL import Image
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production-min-32-chars-long')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION = int(os.environ.get('JWT_EXPIRATION_MINUTES', 10080))
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class UserRole:
    STUDENT = "student"
    PARENT = "parent"
    TEACHER = "teacher"

class UserSignup(BaseModel):
    name: str
    nickname: str
    email: EmailStr
    mobile: str
    password: str
    role: str
    dob: str
    class_name: Optional[str] = None
    section: Optional[str] = None
    school: Optional[str] = None
    parent_name: Optional[str] = None
    parent_mobile: Optional[str] = None
    parent_email: Optional[EmailStr] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    nickname: str
    email: EmailStr
    mobile: str
    role: str
    dob: str
    class_name: Optional[str] = None
    section: Optional[str] = None
    school: Optional[str] = None
    student_code: Optional[str] = None
    parent_name: Optional[str] = None
    parent_mobile: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    created_at: str

class SubjectCreate(BaseModel):
    name: str
    class_name: str
    description: Optional[str] = None

class Subject(BaseModel):
    id: str
    name: str
    class_name: str
    description: Optional[str] = None
    created_at: str

class QuestionType:
    MCQ = "mcq"
    FILL_BLANK = "fill_blank"
    MATCH = "match"
    SHORT = "short"
    LONG = "long"

class Question(BaseModel):
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    marks: int = 1
    match_pairs: Optional[Dict[str, str]] = None

class TestType:
    CHAPTER = "chapter"
    SYLLABUS = "syllabus"
    WEEKLY = "weekly"
    QUARTERLY = "quarterly"
    HALF_YEARLY = "half_yearly"
    YEARLY = "yearly"
    MONTHLY_SPECIAL = "monthly_special"

class TestCreate(BaseModel):
    title: str
    subject_id: str
    class_name: str
    test_type: str
    duration_minutes: int
    total_marks: int
    questions: List[Question]
    scheduled_at: Optional[str] = None

class Test(BaseModel):
    id: str
    title: str
    subject_id: str
    class_name: str
    test_type: str
    duration_minutes: int
    total_marks: int
    questions: List[Question]
    created_by: str
    created_at: str
    scheduled_at: Optional[str] = None

class AnswerSubmission(BaseModel):
    question_index: int
    answer_text: Optional[str] = None
    selected_option: Optional[str] = None
    match_pairs: Optional[Dict[str, str]] = None
    handwritten_image: Optional[str] = None
    ocr_text: Optional[str] = None

class TestSubmission(BaseModel):
    test_id: str
    answers: List[AnswerSubmission]

class TestResult(BaseModel):
    id: str
    test_id: str
    student_id: str
    answers: List[AnswerSubmission]
    total_score: float
    max_score: int
    submitted_at: str
    evaluated: bool = False

# ============= HELPER FUNCTIONS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_student_code() -> str:
    return f"STD{str(uuid.uuid4())[:8].upper()}"

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> Dict[str, Any]:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def extract_text_from_image(image_base64: str) -> str:
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ocr_{uuid.uuid4()}",
            system_message="You are an OCR system. Extract all text from the image exactly as written. Return only the extracted text, no additional commentary."
        ).with_model("openai", "gpt-4o")
        
        image_content = ImageContent(image_base64=image_base64)
        message = UserMessage(
            text="Extract all handwritten text from this image.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(message)
        return response
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return ""

async def evaluate_answer(question: str, correct_answer: str, student_answer: str, marks: int) -> float:
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"eval_{uuid.uuid4()}",
            system_message=f"You are an exam evaluator. Evaluate the student's answer against the correct answer. Award marks out of {marks}. Return only a number between 0 and {marks}."
        ).with_model("openai", "gpt-5.2")
        
        message = UserMessage(
            text=f"Question: {question}\n\nCorrect Answer: {correct_answer}\n\nStudent Answer: {student_answer}\n\nEvaluate and return marks (0-{marks}):"
        )
        
        response = await chat.send_message(message)
        score = float(response.strip())
        return min(max(score, 0), marks)
    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        return 0.0

# ============= AUTH ROUTES =============

@api_router.post("/auth/signup", response_model=User)
async def signup(user_data: UserSignup):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    user_dict['id'] = str(uuid.uuid4())
    user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    if user_data.role == UserRole.STUDENT:
        user_dict['student_code'] = generate_student_code()
    
    user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    user_dict.pop('password')
    return User(**user_dict)

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['role'])
    user.pop('password')
    
    return {
        "token": token,
        "user": User(**user)
    }

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: Dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# ============= SUBJECT ROUTES =============

@api_router.post("/subjects", response_model=Subject)
async def create_subject(subject_data: SubjectCreate, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create subjects")
    
    subject_dict = subject_data.model_dump()
    subject_dict['id'] = str(uuid.uuid4())
    subject_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.subjects.insert_one(subject_dict)
    return Subject(**subject_dict)

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects(class_name: Optional[str] = None):
    query = {"class_name": class_name} if class_name else {}
    subjects = await db.subjects.find(query, {"_id": 0}).to_list(1000)
    return [Subject(**s) for s in subjects]

# ============= TEST ROUTES =============

@api_router.post("/tests", response_model=Test)
async def create_test(test_data: TestCreate, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Only teachers can create tests")
    
    test_dict = test_data.model_dump()
    test_dict['id'] = str(uuid.uuid4())
    test_dict['created_by'] = current_user['user_id']
    test_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.tests.insert_one(test_dict)
    return Test(**test_dict)

@api_router.get("/tests", response_model=List[Test])
async def get_tests(class_name: Optional[str] = None, test_type: Optional[str] = None):
    query = {}
    if class_name:
        query['class_name'] = class_name
    if test_type:
        query['test_type'] = test_type
    
    tests = await db.tests.find(query, {"_id": 0}).to_list(1000)
    return [Test(**t) for t in tests]

@api_router.get("/tests/{test_id}", response_model=Test)
async def get_test(test_id: str):
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return Test(**test)

# ============= SUBMISSION ROUTES =============

@api_router.post("/tests/{test_id}/submit")
async def submit_test(test_id: str, submission: TestSubmission, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can submit tests")
    
    test = await db.tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Process answers with OCR if needed
    processed_answers = []
    for ans in submission.answers:
        ans_dict = ans.model_dump()
        if ans.handwritten_image and not ans.ocr_text:
            ans_dict['ocr_text'] = await extract_text_from_image(ans.handwritten_image)
        processed_answers.append(ans_dict)
    
    # Calculate score
    total_score = 0.0
    for i, ans in enumerate(processed_answers):
        if i < len(test['questions']):
            question = test['questions'][i]
            
            if question['question_type'] == QuestionType.MCQ:
                if ans.get('selected_option') == question.get('correct_answer'):
                    total_score += question['marks']
            
            elif question['question_type'] == QuestionType.FILL_BLANK:
                if ans.get('answer_text', '').strip().lower() == question.get('correct_answer', '').strip().lower():
                    total_score += question['marks']
            
            elif question['question_type'] in [QuestionType.SHORT, QuestionType.LONG]:
                answer_text = ans.get('ocr_text') or ans.get('answer_text', '')
                if answer_text and question.get('correct_answer'):
                    score = await evaluate_answer(
                        question['question_text'],
                        question['correct_answer'],
                        answer_text,
                        question['marks']
                    )
                    total_score += score
    
    result_dict = {
        'id': str(uuid.uuid4()),
        'test_id': test_id,
        'student_id': current_user['user_id'],
        'answers': processed_answers,
        'total_score': total_score,
        'max_score': test['total_marks'],
        'submitted_at': datetime.now(timezone.utc).isoformat(),
        'evaluated': True
    }
    
    await db.test_results.insert_one(result_dict)
    return TestResult(**result_dict)

@api_router.get("/results/student/{student_id}", response_model=List[TestResult])
async def get_student_results(student_id: str, current_user: Dict = Depends(get_current_user)):
    if current_user['role'] == UserRole.STUDENT and current_user['user_id'] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    results = await db.test_results.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return [TestResult(**r) for r in results]

@api_router.get("/results/{result_id}", response_model=TestResult)
async def get_result(result_id: str, current_user: Dict = Depends(get_current_user)):
    result = await db.test_results.find_one({"id": result_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    if current_user['role'] == UserRole.STUDENT and current_user['user_id'] != result['student_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return TestResult(**result)

# ============= FILE UPLOAD ROUTE =============

@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        # Convert to base64
        image = Image.open(BytesIO(contents))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large
        max_size = (1024, 1024)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        # Extract text using OCR
        ocr_text = await extract_text_from_image(img_base64)
        
        return {
            "image_base64": img_base64,
            "ocr_text": ocr_text
        }
    except Exception as e:
        logger.error(f"Image upload error: {e}")
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

# ============= ANALYTICS ROUTES =============

@api_router.get("/analytics/student/{student_id}")
async def get_student_analytics(student_id: str, current_user: Dict = Depends(get_current_user)):
    results = await db.test_results.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    if not results:
        return {
            "total_tests": 0,
            "average_score": 0,
            "total_marks": 0,
            "obtained_marks": 0
        }
    
    total_tests = len(results)
    total_marks = sum(r['max_score'] for r in results)
    obtained_marks = sum(r['total_score'] for r in results)
    average_score = (obtained_marks / total_marks * 100) if total_marks > 0 else 0
    
    return {
        "total_tests": total_tests,
        "average_score": round(average_score, 2),
        "total_marks": total_marks,
        "obtained_marks": round(obtained_marks, 2)
    }

@api_router.get("/")
async def root():
    return {"message": "Educational Examination Platform API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()