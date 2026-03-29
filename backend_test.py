import requests
import sys
import json
from datetime import datetime

class PropGramAPITester:
    def __init__(self, base_url="https://propertygram.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "api/",
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test User",
            "role": "buyer"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('id')
            print(f"   Registered user ID: {self.user_id}")
            return True
        return False

    def test_login_admin(self):
        """Test admin login"""
        admin_credentials = {
            "email": "admin@propgram.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data=admin_credentials
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('id')
            print(f"   Admin user ID: {self.user_id}")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        return success

    def test_create_property(self):
        """Test property creation"""
        property_data = {
            "title": "Test Property",
            "description": "A beautiful test property",
            "price": 250000,
            "property_type": "house",
            "listing_type": "buy",
            "bedrooms": 3,
            "bathrooms": 2,
            "area_sqft": 1500,
            "address": "123 Test Street",
            "city": "London",
            "postcode": "SW1A 1AA",
            "features": ["garden", "parking"],
            "images": []
        }
        
        success, response = self.run_test(
            "Create Property",
            "POST",
            "api/properties",
            200,
            data=property_data
        )
        
        if success:
            self.property_id = response.get('id')
            print(f"   Created property ID: {self.property_id}")
            return True
        return False

    def test_get_properties(self):
        """Test get properties"""
        success, response = self.run_test(
            "Get Properties",
            "GET",
            "api/properties",
            200
        )
        return success

    def test_create_post(self):
        """Test post creation"""
        post_data = {
            "content": "Check out this amazing property!",
            "property_id": getattr(self, 'property_id', None),
            "media_urls": [],
            "tags": ["property", "test"]
        }
        
        success, response = self.run_test(
            "Create Post",
            "POST",
            "api/posts",
            200,
            data=post_data
        )
        
        if success:
            self.post_id = response.get('id')
            print(f"   Created post ID: {self.post_id}")
            return True
        return False

    def test_get_feed(self):
        """Test get feed"""
        success, response = self.run_test(
            "Get Feed",
            "GET",
            "api/posts/feed",
            200
        )
        return success

    def test_like_post(self):
        """Test post like functionality"""
        if not hasattr(self, 'post_id'):
            print("⚠️  Skipping like test - no post created")
            return True
            
        success, response = self.run_test(
            "Like Post",
            "POST",
            f"api/posts/{self.post_id}/like",
            200
        )
        return success

    def test_create_area(self):
        """Test area creation"""
        area_data = {
            "name": "Test Area",
            "city": "London",
            "postcode": "SW1A",
            "description": "A test area"
        }
        
        success, response = self.run_test(
            "Create Area",
            "POST",
            "api/areas",
            200,
            data=area_data
        )
        
        if success:
            self.area_id = response.get('id')
            print(f"   Created area ID: {self.area_id}")
            return True
        return False

    def test_get_areas(self):
        """Test get areas"""
        success, response = self.run_test(
            "Get Areas",
            "GET",
            "api/areas",
            200
        )
        return success

    def test_follow_area(self):
        """Test area follow functionality"""
        if not hasattr(self, 'area_id'):
            print("⚠️  Skipping follow test - no area created")
            return True
            
        success, response = self.run_test(
            "Follow Area",
            "POST",
            f"api/areas/{self.area_id}/follow",
            200
        )
        return success

    def test_logout(self):
        """Test logout"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "api/auth/logout",
            200
        )
        if success:
            self.token = None
        return success

    def test_brute_force_protection(self):
        """Test brute force protection"""
        print("\n🔍 Testing Brute Force Protection...")
        
        # Try 6 failed login attempts
        failed_credentials = {
            "email": "admin@propgram.com",
            "password": "wrongpassword"
        }
        
        for i in range(6):
            success, response = self.run_test(
                f"Failed Login Attempt {i+1}",
                "POST",
                "api/auth/login",
                401 if i < 5 else 429,  # Expect 429 on 6th attempt
                data=failed_credentials
            )
            
            if i == 5 and success:  # 6th attempt should be blocked
                print("✅ Brute force protection working")
                return True
        
        return False

def main():
    print("🚀 Starting PropGram API Tests")
    print("=" * 50)
    
    # Setup
    tester = PropGramAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("User Registration", tester.test_register),
        ("Get Current User", tester.test_get_me),
        ("Create Property", tester.test_create_property),
        ("Get Properties", tester.test_get_properties),
        ("Create Post", tester.test_create_post),
        ("Get Feed", tester.test_get_feed),
        ("Like Post", tester.test_like_post),
        ("Create Area", tester.test_create_area),
        ("Get Areas", tester.test_get_areas),
        ("Follow Area", tester.test_follow_area),
        ("Logout", tester.test_logout),
        ("Admin Login", tester.test_login_admin),
        ("Brute Force Protection", tester.test_brute_force_protection)
    ]
    
    # Run tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend API tests mostly successful!")
        return 0
    else:
        print("⚠️  Backend API has significant issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())