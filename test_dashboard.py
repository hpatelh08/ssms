import requests
import base64

# Test teacher login and dashboard access
def test_teacher_dashboard():
    # Login as teach8A
    login_data = {
        'username': 'teach8A',
        'password': 'teacher123'
    }
    
    session = requests.Session()
    
    # Login
    response = session.post('http://127.0.0.1:5000/login', data=login_data)
    print(f"Login status: {response.status_code}")
    
    if response.status_code == 200:
        # Access teacher dashboard
        dashboard_response = session.get('http://127.0.0.1:5000/teacher_dashboard')
        print(f"Dashboard status: {dashboard_response.status_code}")
        
        # Check if student data is present in response
        content = dashboard_response.text
        if 'stu08A' in content:
            print("✅ Student data found in dashboard")
            # Count student entries
            student_count = content.count('stu08A')
            print(f"Number of student entries found: {student_count}")
        else:
            print("❌ No student data found in dashboard")
            
        if '50 students' in content:
            print("✅ Shows 50 students total")
        else:
            print("❌ Doesn't show 50 students")

if __name__ == "__main__":
    test_teacher_dashboard()