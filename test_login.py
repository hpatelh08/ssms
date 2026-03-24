import requests
import time

time.sleep(1)

# Test form submission with correct credentials
data = {
    'username': 'stu08A001',
    'password': 'stu001',
    'role': 'student'
}

response = requests.post('http://localhost:5000/login', data=data, allow_redirects=False)
print(f'Status Code: {response.status_code}')
print(f'Redirect: {response.headers.get("Location", "No redirect")}')

if response.status_code == 302:
    print('✓ Login successful - redirected to dashboard!')
else:
    print(f'✗ Login failed')
    print(f'Response: {response.text[:500]}')
