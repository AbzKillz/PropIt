import requests
import sys
import json
from datetime import datetime

class FeedFilterTester:
    def __init__(self, base_url="https://propertygram.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.property_ids = {"rent": [], "buy": []}

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

    def login_admin(self):
        """Login as admin to create test properties"""
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

    def create_test_properties(self):
        """Create test properties for rent and buy"""
        # Create rental property
        rental_property = {
            "title": "Test Rental Property",
            "description": "A beautiful rental property for testing",
            "price": 1500,
            "property_type": "apartment",
            "listing_type": "rent",
            "bedrooms": 2,
            "bathrooms": 1,
            "area_sqft": 800,
            "address": "123 Rental Street",
            "city": "London",
            "postcode": "SW1A 1AA",
            "features": ["furnished", "parking"],
            "images": []
        }
        
        success, response = self.run_test(
            "Create Rental Property",
            "POST",
            "api/properties",
            200,
            data=rental_property
        )
        
        if success:
            rental_id = response.get('id')
            self.property_ids["rent"].append(rental_id)
            print(f"   Created rental property ID: {rental_id}")

        # Create buy property
        buy_property = {
            "title": "Test Buy Property",
            "description": "A beautiful property for sale",
            "price": 350000,
            "property_type": "house",
            "listing_type": "buy",
            "bedrooms": 3,
            "bathrooms": 2,
            "area_sqft": 1200,
            "address": "456 Sale Street",
            "city": "London",
            "postcode": "SW1A 2BB",
            "features": ["garden", "garage"],
            "images": []
        }
        
        success, response = self.run_test(
            "Create Buy Property",
            "POST",
            "api/properties",
            200,
            data=buy_property
        )
        
        if success:
            buy_id = response.get('id')
            self.property_ids["buy"].append(buy_id)
            print(f"   Created buy property ID: {buy_id}")

        return len(self.property_ids["rent"]) > 0 and len(self.property_ids["buy"]) > 0

    def create_test_posts(self):
        """Create posts for the test properties"""
        # Create post for rental property
        if self.property_ids["rent"]:
            rental_post = {
                "content": "Amazing rental property available now!",
                "property_id": self.property_ids["rent"][0],
                "media_urls": [],
                "tags": ["rental", "apartment", "london"]
            }
            
            success, response = self.run_test(
                "Create Rental Post",
                "POST",
                "api/posts",
                200,
                data=rental_post
            )

        # Create post for buy property
        if self.property_ids["buy"]:
            buy_post = {
                "content": "Beautiful house for sale in prime location!",
                "property_id": self.property_ids["buy"][0],
                "media_urls": [],
                "tags": ["forsale", "house", "london"]
            }
            
            success, response = self.run_test(
                "Create Buy Post",
                "POST",
                "api/posts",
                200,
                data=buy_post
            )

    def test_feed_foryou(self):
        """Test For You feed (should show all posts)"""
        success, response = self.run_test(
            "Get For You Feed",
            "GET",
            "api/posts/feed?feed_type=foryou",
            200
        )
        
        if success:
            posts = response if isinstance(response, list) else []
            print(f"   For You feed returned {len(posts)} posts")
            return True
        return False

    def test_feed_move(self):
        """Test Move feed (should show only rental properties)"""
        success, response = self.run_test(
            "Get Move Feed (Rentals Only)",
            "GET",
            "api/posts/feed?feed_type=move",
            200
        )
        
        if success:
            posts = response if isinstance(response, list) else []
            print(f"   Move feed returned {len(posts)} posts")
            
            # Check if all posts are rental properties
            rental_only = True
            for post in posts:
                if post.get('property') and post['property'].get('listing_type') != 'rent':
                    rental_only = False
                    print(f"   ❌ Found non-rental property: {post['property'].get('listing_type')}")
            
            if rental_only and posts:
                print("   ✅ All posts in Move feed are rental properties")
            elif not posts:
                print("   ⚠️  No posts found in Move feed")
            
            return True
        return False

    def test_feed_buysell(self):
        """Test Buy/Sell feed (should show only sale properties)"""
        success, response = self.run_test(
            "Get Buy/Sell Feed (Sales Only)",
            "GET",
            "api/posts/feed?feed_type=buysell",
            200
        )
        
        if success:
            posts = response if isinstance(response, list) else []
            print(f"   Buy/Sell feed returned {len(posts)} posts")
            
            # Check if all posts are sale properties
            sale_only = True
            for post in posts:
                if post.get('property'):
                    listing_type = post['property'].get('listing_type')
                    if listing_type not in ['buy', 'sell']:
                        sale_only = False
                        print(f"   ❌ Found non-sale property: {listing_type}")
            
            if sale_only and posts:
                print("   ✅ All posts in Buy/Sell feed are sale properties")
            elif not posts:
                print("   ⚠️  No posts found in Buy/Sell feed")
            
            return True
        return False

    def test_feed_following(self):
        """Test Following feed"""
        success, response = self.run_test(
            "Get Following Feed",
            "GET",
            "api/posts/feed?feed_type=following",
            200
        )
        
        if success:
            posts = response if isinstance(response, list) else []
            print(f"   Following feed returned {len(posts)} posts")
            return True
        return False

    def test_properties_by_listing_type(self):
        """Test properties endpoint with listing type filters"""
        # Test rental properties
        success, response = self.run_test(
            "Get Rental Properties",
            "GET",
            "api/properties?listing_type=rent",
            200
        )
        
        if success:
            properties = response if isinstance(response, list) else []
            rental_count = len([p for p in properties if p.get('listing_type') == 'rent'])
            print(f"   Found {rental_count} rental properties")

        # Test buy properties
        success, response = self.run_test(
            "Get Buy Properties",
            "GET",
            "api/properties?listing_type=buy",
            200
        )
        
        if success:
            properties = response if isinstance(response, list) else []
            buy_count = len([p for p in properties if p.get('listing_type') == 'buy'])
            print(f"   Found {buy_count} buy properties")

        return True

def main():
    print("🚀 Starting PropGram Feed Filter Tests")
    print("=" * 60)
    
    # Setup
    tester = FeedFilterTester()
    
    # Login as admin first
    if not tester.login_admin():
        print("❌ Failed to login as admin, stopping tests")
        return 1
    
    # Create test data
    print("\n📝 Creating test data...")
    tester.create_test_properties()
    tester.create_test_posts()
    
    # Test sequence
    tests = [
        ("For You Feed", tester.test_feed_foryou),
        ("Move Feed (Rentals)", tester.test_feed_move),
        ("Buy/Sell Feed (Sales)", tester.test_feed_buysell),
        ("Following Feed", tester.test_feed_following),
        ("Properties by Listing Type", tester.test_properties_by_listing_type)
    ]
    
    # Run tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Feed Filter Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Feed filter tests successful!")
        return 0
    else:
        print("⚠️  Feed filter functionality has issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())