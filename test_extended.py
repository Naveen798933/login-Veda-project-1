import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api"
HEADERS = {"Content-Type": "application/json"}

print("\n" + "=" * 70)
print("EXTENDED TESTING SUITE - Advanced Features")
print("=" * 70)

test_results = {"passed": [], "failed": [], "warnings": []}

# Setup: Create and login test user
print("\n[SETUP] Creating test user and document...")
try:
    email = f"advanced_test_{int(datetime.now().timestamp())}@example.com"
    payload = {
        "firstName": "Advanced",
        "lastName": "Tester",
        "email": email,
        "password": "AdvancedPass123!"
    }
    requests.post(f"{BASE_URL}/auth/register", json=payload, headers=HEADERS)
    
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": "AdvancedPass123!"
    }, headers=HEADERS)
    
    access_token = login_response.json()["accessToken"]
    auth_headers = {**HEADERS, "Authorization": f"Bearer {access_token}"}
    
    doc_response = requests.post(f"{BASE_URL}/documents", json={
        "title": f"Advanced Test Doc {int(datetime.now().timestamp())}"
    }, headers=auth_headers)
    doc_id = doc_response.json()["_id"]
    
    # Update document with content before creating snapshots
    requests.patch(f"{BASE_URL}/documents/{doc_id}", json={
        "content": "Initial document content for versioning"
    }, headers=auth_headers)
    
    print("✓ Setup complete")
except Exception as e:
    print(f"✗ Setup failed: {e}")
    exit(1)

# Test 1: Document Version Creation
print("\n[TEST 1] Create Document Version (Snapshot)")
try:
    payload = {
        "title": "Version 1.0"
    }
    response = requests.post(
        f"{BASE_URL}/documents/{doc_id}/snapshots",
        json=payload,
        headers=auth_headers
    )
    if response.status_code in [200, 201]:
        print(f"✓ PASSED - Status: {response.status_code}")
        test_results["passed"].append("Create Document Version")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        print(f"  Error: {response.text[:200]}")
        test_results["failed"].append(f"Create Document Version - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Create Document Version - {str(e)}")

# Test 2: Get Document Version History
print("\n[TEST 2] Get Document Version History")
try:
    response = requests.get(
        f"{BASE_URL}/documents/{doc_id}/versions",
        headers=auth_headers
    )
    if response.status_code == 200:
        versions = response.json()
        print(f"✓ PASSED - Status: {response.status_code}")
        print(f"  Versions found: {len(versions)}")
        test_results["passed"].append("Get Version History")
        if versions:
            version_id = versions[0].get("_id")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Get Version History - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Get Version History - {str(e)}")

# Test 3: Comment Resolution
print("\n[TEST 3] Resolve Comment")
try:
    # Create a comment first
    comment_response = requests.post(f"{BASE_URL}/comments", json={
        "documentId": doc_id,
        "content": "Test comment for resolution",
        "parentId": None
    }, headers=auth_headers)
    
    comment_id = comment_response.json()["_id"]
    
    # Resolve the comment
    response = requests.patch(
        f"{BASE_URL}/comments/{comment_id}/resolve",
        headers=auth_headers
    )
    if response.status_code == 200:
        print(f"✓ PASSED - Status: {response.status_code}")
        test_results["passed"].append("Resolve Comment")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Resolve Comment - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Resolve Comment - {str(e)}")

# Test 4: Delete Comment
print("\n[TEST 4] Delete Comment")
try:
    response = requests.delete(
        f"{BASE_URL}/comments/{comment_id}",
        headers=auth_headers
    )
    if response.status_code == 200:
        print(f"✓ PASSED - Status: {response.status_code}")
        test_results["passed"].append("Delete Comment")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Delete Comment - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Delete Comment - {str(e)}")

# Test 5: Soft Delete Document
print("\n[TEST 5] Soft Delete Document")
try:
    response = requests.delete(
        f"{BASE_URL}/documents/{doc_id}",
        headers=auth_headers
    )
    if response.status_code == 200:
        print(f"✓ PASSED - Status: {response.status_code}")
        test_results["passed"].append("Soft Delete Document")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Soft Delete - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Soft Delete - {str(e)}")

# Test 6: Get Trash Documents
print("\n[TEST 6] Get Trash/Deleted Documents")
try:
    response = requests.get(
        f"{BASE_URL}/documents/trash",
        headers=auth_headers
    )
    if response.status_code == 200:
        trash = response.json()
        print(f"✓ PASSED - Status: {response.status_code}")
        print(f"  Documents in trash: {len(trash)}")
        test_results["passed"].append("Get Trash Documents")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Get Trash - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Get Trash - {str(e)}")

# Test 7: Restore Document
print("\n[TEST 7] Restore Document from Trash")
try:
    response = requests.post(
        f"{BASE_URL}/documents/{doc_id}/restore",
        headers=auth_headers
    )
    if response.status_code == 200:
        print(f"✓ PASSED - Status: {response.status_code}")
        test_results["passed"].append("Restore Document")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Restore Document - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Restore Document - {str(e)}")

# Test 8: Pagination/Search
print("\n[TEST 8] Get Documents with Limit")
try:
    response = requests.get(
        f"{BASE_URL}/documents?limit=5&skip=0",
        headers=auth_headers
    )
    if response.status_code == 200:
        docs = response.json()
        print(f"✓ PASSED - Status: {response.status_code}")
        print(f"  Documents returned: {len(docs)}")
        test_results["passed"].append("Documents Pagination")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Pagination - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Pagination - {str(e)}")

# Test 9: Forgot Password Endpoint
print("\n[TEST 9] Forgot Password Request")
try:
    response = requests.post(f"{BASE_URL}/auth/forgot-password", json={
        "email": email
    }, headers=HEADERS)
    if response.status_code in [200, 201]:
        print(f"✓ PASSED - Status: {response.status_code}")
        test_results["passed"].append("Forgot Password")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Forgot Password - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Forgot Password - {str(e)}")

# Test 10: Metrics Endpoint
print("\n[TEST 10] Prometheus Metrics Endpoint")
try:
    response = requests.get("http://localhost:5000/metrics")
    if response.status_code == 200 and "# HELP" in response.text:
        print(f"✓ PASSED - Status: {response.status_code}")
        print(f"  Metrics available: Yes")
        test_results["passed"].append("Prometheus Metrics")
    else:
        print(f"✗ FAILED - Status: {response.status_code}")
        test_results["failed"].append(f"Prometheus Metrics - {response.status_code}")
except Exception as e:
    print(f"✗ ERROR - {e}")
    test_results["failed"].append(f"Prometheus Metrics - {str(e)}")

# Summary Report
print("\n" + "=" * 70)
print("EXTENDED TEST SUMMARY")
print("=" * 70)

if test_results["passed"]:
    print(f"\n✓ PASSED ({len(test_results['passed'])} tests):")
    for test in test_results["passed"]:
        print(f"  ✓ {test}")

if test_results["failed"]:
    print(f"\n✗ FAILED ({len(test_results['failed'])} tests):")
    for test in test_results["failed"]:
        print(f"  ✗ {test}")
else:
    print("\n✓ All extended tests passed!")

if test_results["warnings"]:
    print(f"\n⚠ WARNINGS ({len(test_results['warnings'])}):")
    for warning in test_results["warnings"]:
        print(f"  ⚠ {warning}")

total = len(test_results["passed"]) + len(test_results["failed"])
pass_rate = (len(test_results["passed"]) / total * 100) if total > 0 else 0
print(f"\n{'='*70}")
print(f"Pass Rate: {pass_rate:.1f}% ({len(test_results['passed'])}/{total})")
print("=" * 70 + "\n")
