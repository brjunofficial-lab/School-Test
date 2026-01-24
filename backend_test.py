import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image
import uuid

class EducationPlatformTester:
    def __init__(self, base_url="https://studyprep-22.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.user_role = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_test_id = None
        self.created_subject_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if files:
                # Remove Content-Type for file uploads
                headers.pop('Content-Type', None)
                if method == 'POST':
                    response = requests.post(url, files=files, headers=headers)
            else:
                if method == 'GET':
                    response = requests.get(url, headers=headers)
                elif method == 'POST':
                    response = requests.post(url, json=data, headers=headers)
                elif method == 'PUT':
                    response = requests.put(url, json=data, headers=headers)
                elif method == 'DELETE':
                    response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_signup_student(self):
        """Test student signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        student_data = {
            "name": f"Test Student {timestamp}",
            "nickname": f"TestStudent{timestamp}",
            "email": f"student{timestamp}@test.com",
            "mobile": f"123456{timestamp}",
            "password": "TestPass123!",
            "role": "student",
            "dob": "2005-01-01",
            "class_name": "10th",
            "section": "A",
            "school": "Test School"
        }
        
        success, response = self.run_test(
            "Student Signup",
            "POST",
            "auth/signup",
            200,
            data=student_data
        )
        
        if success and 'id' in response:
            self.student_id = response['id']
            self.student_email = student_data['email']
            self.student_password = student_data['password']
            print(f"   Student ID: {self.student_id}")
        
        return success

    def test_signup_teacher(self):
        """Test teacher signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        teacher_data = {
            "name": f"Test Teacher {timestamp}",
            "nickname": f"TestTeacher{timestamp}",
            "email": f"teacher{timestamp}@test.com",
            "mobile": f"987654{timestamp}",
            "password": "TestPass123!",
            "role": "teacher",
            "dob": "1985-01-01",
            "school": "Test School"
        }
        
        success, response = self.run_test(
            "Teacher Signup",
            "POST",
            "auth/signup",
            200,
            data=teacher_data
        )
        
        if success and 'id' in response:
            self.teacher_id = response['id']
            self.teacher_email = teacher_data['email']
            self.teacher_password = teacher_data['password']
            print(f"   Teacher ID: {self.teacher_id}")
        
        return success

    def test_signup_parent(self):
        """Test parent signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        parent_data = {
            "name": f"Test Parent {timestamp}",
            "nickname": f"TestParent{timestamp}",
            "email": f"parent{timestamp}@test.com",
            "mobile": f"555666{timestamp}",
            "password": "TestPass123!",
            "role": "parent",
            "dob": "1980-01-01",
            "class_name": "10th",
            "section": "A",
            "parent_name": f"Parent Name {timestamp}",
            "parent_mobile": f"777888{timestamp}",
            "parent_email": f"parentcontact{timestamp}@test.com"
        }
        
        success, response = self.run_test(
            "Parent Signup",
            "POST",
            "auth/signup",
            200,
            data=parent_data
        )
        
        if success and 'id' in response:
            self.parent_id = response['id']
            self.parent_email = parent_data['email']
            self.parent_password = parent_data['password']
            print(f"   Parent ID: {self.parent_id}")
        
        return success

    def test_login(self, email, password, role_name):
        """Test login and get token"""
        success, response = self.run_test(
            f"{role_name} Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.user_role = response['user']['role']
            print(f"   Token received, User ID: {self.user_id}, Role: {self.user_role}")
            return True
        return False

    def test_get_me(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_subject(self):
        """Test creating a subject (teacher only)"""
        if self.user_role != 'teacher':
            print("⚠️  Skipping subject creation - not a teacher")
            return True
            
        subject_data = {
            "name": "Mathematics",
            "class_name": "10th",
            "description": "Advanced Mathematics for 10th grade"
        }
        
        success, response = self.run_test(
            "Create Subject",
            "POST",
            "subjects",
            200,
            data=subject_data
        )
        
        if success and 'id' in response:
            self.created_subject_id = response['id']
            print(f"   Subject ID: {self.created_subject_id}")
        
        return success

    def test_get_subjects(self):
        """Test getting subjects"""
        success, response = self.run_test(
            "Get Subjects",
            "GET",
            "subjects",
            200
        )
        return success

    def test_create_test(self):
        """Test creating a test (teacher only)"""
        if self.user_role != 'teacher':
            print("⚠️  Skipping test creation - not a teacher")
            return True
            
        test_data = {
            "title": "Sample Mathematics Test",
            "subject_id": self.created_subject_id or str(uuid.uuid4()),
            "class_name": "10th",
            "test_type": "chapter",
            "duration_minutes": 60,
            "total_marks": 10,
            "questions": [
                {
                    "question_text": "What is 2 + 2?",
                    "question_type": "mcq",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": "4",
                    "marks": 2
                },
                {
                    "question_text": "Fill in the blank: The capital of France is ____",
                    "question_type": "fill_blank",
                    "correct_answer": "Paris",
                    "marks": 2
                },
                {
                    "question_text": "Explain the Pythagorean theorem",
                    "question_type": "short",
                    "correct_answer": "In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides",
                    "marks": 3
                },
                {
                    "question_text": "Write an essay on the importance of mathematics in daily life",
                    "question_type": "long",
                    "correct_answer": "Mathematics is essential in daily life for calculations, problem-solving, and logical thinking",
                    "marks": 3
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Test",
            "POST",
            "tests",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.created_test_id = response['id']
            print(f"   Test ID: {self.created_test_id}")
        
        return success

    def test_get_tests(self):
        """Test getting tests"""
        success, response = self.run_test(
            "Get Tests",
            "GET",
            "tests",
            200
        )
        return success

    def test_get_test_by_id(self):
        """Test getting a specific test"""
        if not self.created_test_id:
            print("⚠️  Skipping get test by ID - no test created")
            return True
            
        success, response = self.run_test(
            "Get Test by ID",
            "GET",
            f"tests/{self.created_test_id}",
            200
        )
        return success

    def create_test_image(self):
        """Create a simple test image with text"""
        # Create a simple image with text for OCR testing
        img = Image.new('RGB', (400, 200), color='white')
        
        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return img_base64

    def test_image_upload(self):
        """Test image upload and OCR"""
        # Create a simple test image
        img = Image.new('RGB', (400, 200), color='white')
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        buffered.seek(0)
        
        files = {'file': ('test.jpg', buffered, 'image/jpeg')}
        
        success, response = self.run_test(
            "Image Upload and OCR",
            "POST",
            "upload-image",
            200,
            files=files
        )
        
        if success:
            print(f"   OCR Text: {response.get('ocr_text', 'No text extracted')}")
        
        return success

    def test_submit_test(self):
        """Test submitting a test (student only)"""
        if self.user_role != 'student' or not self.created_test_id:
            print("⚠️  Skipping test submission - not a student or no test available")
            return True
            
        # Create test submission with various answer types
        submission_data = {
            "test_id": self.created_test_id,
            "answers": [
                {
                    "question_index": 0,
                    "selected_option": "4"
                },
                {
                    "question_index": 1,
                    "answer_text": "Paris"
                },
                {
                    "question_index": 2,
                    "answer_text": "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides."
                },
                {
                    "question_index": 3,
                    "answer_text": "Mathematics is crucial in daily life for budgeting, cooking measurements, time management, and problem-solving."
                }
            ]
        }
        
        success, response = self.run_test(
            "Submit Test",
            "POST",
            f"tests/{self.created_test_id}/submit",
            200,
            data=submission_data
        )
        
        if success:
            self.result_id = response.get('id')
            print(f"   Result ID: {self.result_id}")
            print(f"   Score: {response.get('total_score', 0)}/{response.get('max_score', 0)}")
        
        return success

    def test_get_student_results(self):
        """Test getting student results"""
        if self.user_role != 'student':
            print("⚠️  Skipping get student results - not a student")
            return True
            
        success, response = self.run_test(
            "Get Student Results",
            "GET",
            f"results/student/{self.user_id}",
            200
        )
        return success

    def test_get_student_analytics(self):
        """Test getting student analytics"""
        success, response = self.run_test(
            "Get Student Analytics",
            "GET",
            f"analytics/student/{self.user_id}",
            200
        )
        
        if success:
            print(f"   Analytics: {response}")
        
        return success

def main():
    print("🚀 Starting Educational Platform API Tests")
    print("=" * 50)
    
    tester = EducationPlatformTester()
    
    # Test basic connectivity
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed, stopping tests")
        return 1
    
    # Test user registration for all roles
    print("\n📝 Testing User Registration...")
    if not tester.test_signup_student():
        print("❌ Student signup failed")
        return 1
    
    if not tester.test_signup_teacher():
        print("❌ Teacher signup failed")
        return 1
        
    if not tester.test_signup_parent():
        print("❌ Parent signup failed")
        return 1
    
    # Test as Teacher first (to create subjects and tests)
    print("\n👨‍🏫 Testing as Teacher...")
    if not tester.test_login(tester.teacher_email, tester.teacher_password, "Teacher"):
        print("❌ Teacher login failed")
        return 1
    
    tester.test_get_me()
    tester.test_create_subject()
    tester.test_get_subjects()
    tester.test_create_test()
    tester.test_get_tests()
    tester.test_get_test_by_id()
    
    # Test image upload functionality
    print("\n📷 Testing Image Upload and OCR...")
    tester.test_image_upload()
    
    # Test as Student (to take tests)
    print("\n👨‍🎓 Testing as Student...")
    if not tester.test_login(tester.student_email, tester.student_password, "Student"):
        print("❌ Student login failed")
        return 1
    
    tester.test_get_me()
    tester.test_get_tests()
    tester.test_submit_test()
    tester.test_get_student_results()
    tester.test_get_student_analytics()
    
    # Test as Parent
    print("\n👨‍👩‍👧‍👦 Testing as Parent...")
    if not tester.test_login(tester.parent_email, tester.parent_password, "Parent"):
        print("❌ Parent login failed")
        return 1
    
    tester.test_get_me()
    tester.test_get_student_analytics()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())