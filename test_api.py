import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000/api"
HEADERS = {"Content-Type": "application/json"}

print("=" * 60)
print("LogicVeda Application Testing Suite")
print(f"Timestamp: {datetime.now().isoformat()}")
print("=" * 60)

results = {"passed": [], "failed": []}

# Test 1: Register User
print("\n[TEST 1] User Registration")
try:
    payload = {
        "firstName": "Test",
        "lastName": "User",
        "email": f"test@{int(datetime.now().timestamp())}@example.com",
        "password": "SecurePass123!"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload, headers=HEADERS)
    if response.status_code in [200, 201]:
        print(f"✓ PASSED - Status: {response.status_code}")
        results["passed"].append("User Registration")
        user_data = response.json()
        email = payload["email"]
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        print(f"Response: {response.text}")
        results["failed"].append(f"User Registration - {response.text}")
except Exception as e:
    print(f"✗ ERROR - {str(e)}")
    results["failed"].append(f"User Registration - {str(e)}")

# Test 2: Login
print("\n[TEST 2] User Login")
try:
    payload = {
        "email": email,
        "password": "SecurePass123!"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload, headers=HEADERS)
    if response.status_code in [200, 201]:
        print(f"✓ PASSED - Status: {response.status_code}")
        results["passed"].append("User Login")
        login_data = response.json()
        access_token = login_data.get("accessToken")
        print(f"Access Token obtained: {access_token[:20]}...")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        print(f"Response: {response.text}")
        results["failed"].append(f"User Login - {response.text}")
except Exception as e:
    print(f"✗ ERROR - {str(e)}")
    results["failed"].append(f"User Login - {str(e)}")

# Test 3: Create Document
print("\n[TEST 3] Create Document")
try:
    payload = {
        "title": f"Test Document {int(datetime.now().timestamp())}"
    }
    auth_headers = {**HEADERS, "Authorization": f"Bearer {access_token}"}
    response = requests.post(f"{BASE_URL}/documents", json=payload, headers=auth_headers)
    if response.status_code in [200, 201]:
        print(f"✓ PASSED - Status: {response.status_code}")
        results["passed"].append("Create Document")
        doc_data = response.json()
        doc_id = doc_data.get("_id")
        print(f"Document ID: {doc_id}")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        print(f"Response: {response.text}")
        results["failed"].append(f"Create Document - {response.text}")
except Exception as e:
    print(f"✗ ERROR - {str(e)}")
    results["failed"].append(f"Create Document - {str(e)}")

# Test 4: Get Documents List
print("\n[TEST 4] Get Documents List")
try:
    response = requests.get(f"{BASE_URL}/documents", headers=auth_headers)
    if response.status_code == 200:
        docs = response.json()
        print(f"✓ PASSED - Status: {response.status_code}")
        print(f"Documents found: {len(docs)}")
        results["passed"].append("Get Documents")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        print(f"Response: {response.text}")
        results["failed"].append(f"Get Documents - {response.text}")
except Exception as e:
    print(f"✗ ERROR - {str(e)}")
    results["failed"].append(f"Get Documents - {str(e)}")

# Test 5: Update Document
print("\n[TEST 5] Update Document")
try:
    payload = {
        "title": f"Updated Document {int(datetime.now().timestamp())}",
        "content": "This is test content"
    }
    response = requests.patch(f"{BASE_URL}/documents/{doc_id}", json=payload, headers=auth_headers)
    if response.status_code == 200:
        print(f"✓ PASSED - Status: {response.status_code}")
        results["passed"].append("Update Document")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        print(f"Response: {response.text}")
        results["failed"].append(f"Update Document - {response.text}")
except Exception as e:
    print(f"✗ ERROR - {str(e)}")
    results["failed"].append(f"Update Document - {str(e)}")

# Test 6: Create Comment
print("\n[TEST 6] Create Comment")
try:
    payload = {
        "documentId": doc_id,
        "content": "This is a test comment",
        "parentId": None
    }
    response = requests.post(f"{BASE_URL}/comments", json=payload, headers=auth_headers)
    if response.status_code in [200, 201]:
        print(f"✓ PASSED - Status: {response.status_code}")
        results["passed"].append("Create Comment")
        comment_data = response.json()
        comment_id = comment_data.get("_id")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        print(f"Response: {response.text}")
        results["failed"].append(f"Create Comment - {response.text}")
except Exception as e:
    print(f"✗ ERROR - {str(e)}")
    results["failed"].append(f"Create Comment - {str(e)}")

# Test 7: Get Comments
print("\n[TEST 7] Get Comments for Document")
try:
    response = requests.get(f"{BASE_URL}/comments/{doc_id}", headers=auth_headers)
    if response.status_code == 200:
        comments = response.json()
        print(f"✓ PASSED - Status: {response.status_code}")
        print(f"Comments found: {len(comments)}")
        results["passed"].append("Get Comments")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        print(f"Response: {response.text}")
        results["failed"].append(f"Get Comments - {response.text}")
except Exception as e:
    print(f"✗ ERROR - {str(e)}")
    results["failed"].append(f"Get Comments - {str(e)}")

# Test 8: Health Check
print("\n[TEST 8] Server Health Check")
try:
    response = requests.get("http://localhost:5000/health")
    if response.status_code == 200:
        health = response.json()
        print(f"✓ PASSED - Status: {response.status_code}")
        print(f"Server Status: {health.get('status')}")
        results["passed"].append("Health Check")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        results["failed"].append(f"Health Check - {response.text}")
except Exception as e:
    print(f"✗ ERROR - {str(e)}")
    results["failed"].append(f"Health Check - {str(e)}")

# Summary
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print(f"✓ Passed: {len(results['passed'])}")
for test in results["passed"]:
    print(f"  ✓ {test}")

if results["failed"]:
    print(f"\n✗ Failed: {len(results['failed'])}")
    for test in results["failed"]:
        print(f"  ✗ {test}")
else:
    print("\n✓ All tests passed!")

print("=" * 60)
