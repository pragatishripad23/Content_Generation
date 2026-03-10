#!/usr/bin/env python3
"""
SolisBoard API Testing Suite
Tests all critical API endpoints for the AI-powered social media platform
"""
import requests
import json
import sys
import time
from datetime import datetime

class SolisBoardAPITester:
    def __init__(self, base_url="https://content-optimizer-44.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.brand_id = None
        self.campaign_id = None
        self.post_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {"message": "No JSON response"}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"Response: {response.text[:500]}", "DEBUG")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint, 
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    # ── Auth Tests ──
    def test_auth_register_existing_user(self):
        """Test registering with existing test user (should fail)"""
        test_data = {
            "email": "test@solisboard.com",
            "password": "test123",
            "name": "Test User",
            "company": "Test Co",
            "industry": "Technology"
        }
        success, response = self.run_test(
            "Auth Register (Existing User)",
            "POST", "/auth/register", 400, test_data
        )
        return success

    def test_auth_login(self):
        """Test login with test user"""
        login_data = {
            "email": "test@solisboard.com",
            "password": "test123"
        }
        success, response = self.run_test(
            "Auth Login",
            "POST", "/auth/login", 200, login_data
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response.get('user', {})
            self.brand_id = self.user_data.get('brand_id')
            self.log(f"Login successful. Brand ID: {self.brand_id}")
            return True
        return False

    def test_auth_me(self):
        """Test getting current user profile"""
        success, response = self.run_test(
            "Auth Me",
            "GET", "/auth/me", 200
        )
        if success:
            self.log(f"User data retrieved: {response.get('user', {}).get('name', 'Unknown')}")
        return success

    # ── Campaign Tests ──
    def test_campaigns_list(self):
        """Test listing campaigns"""
        success, response = self.run_test(
            "Campaigns List",
            "GET", f"/campaigns?brand_id={self.brand_id}", 200
        )
        if success:
            campaigns = response if isinstance(response, list) else []
            self.log(f"Found {len(campaigns)} campaigns")
        return success

    def test_campaigns_create(self):
        """Test creating a campaign"""
        campaign_data = {
            "brand_id": self.brand_id,
            "name": f"Test Campaign {int(time.time())}",
            "brief": "AI-powered social media campaign for testing Module 1 ideation engine",
            "goal": "awareness"
        }
        success, response = self.run_test(
            "Campaigns Create",
            "POST", "/campaigns", 200, campaign_data
        )
        if success and 'id' in response:
            self.campaign_id = response['id']
            self.log(f"Campaign created with ID: {self.campaign_id}")
            return True
        return False

    def test_campaign_get(self):
        """Test getting campaign details"""
        if not self.campaign_id:
            return False
        success, response = self.run_test(
            "Campaign Get Detail",
            "GET", f"/campaigns/{self.campaign_id}", 200
        )
        return success

    def test_campaign_ideation(self):
        """Test Module 1 - Campaign Ideation Engine"""
        if not self.campaign_id:
            return False
        
        ideation_data = {
            "topic": "Product Launch Campaign",
            "objective": "Increase brand awareness and drive pre-orders",
            "audience": "Tech enthusiasts aged 25-40",
            "duration_days": 30
        }
        success, response = self.run_test(
            "Module 1 - Campaign Ideation",
            "POST", f"/campaigns/{self.campaign_id}/ideate", 200, ideation_data
        )
        if success:
            concepts = response.get('concepts', [])
            calendar = response.get('calendar_outline', [])
            self.log(f"Ideation generated: {len(concepts)} concepts, {len(calendar)} calendar items")
        return success

    # ── AI Generation Tests (Module 2 & 3) ──
    def test_generate_text_multi_model(self):
        """Test Module 2 - Multi-Model Text Generation"""
        text_data = {
            "brief": "Exciting product launch announcement for innovative AI tool",
            "platform": "instagram",
            "tone": "professional",
            "brand_voice": "innovative"
        }
        success, response = self.run_test(
            "Module 2 - Multi-Model Text Generation",
            "POST", "/generate/text", 200, text_data
        )
        if success:
            variations = response.get('variations', [])
            self.log(f"Text generation: {len(variations)} model variations")
            
            # Check if we got responses from all 3 models
            models_found = [v.get('model') for v in variations]
            expected_models = ['claude-sonnet', 'gpt-4o', 'gemini']
            self.log(f"Models responded: {models_found}")
            
        return success

    def test_generate_variations(self):
        """Test Module 3 - Caption Variations & Hashtags"""
        variations_data = {
            "caption": "🚀 Introducing our game-changing AI platform that revolutionizes social media marketing! Get ready to transform your content strategy.",
            "count": 5
        }
        success, response = self.run_test(
            "Module 3 - Caption Variations",
            "POST", "/generate/variations", 200, variations_data
        )
        if success:
            variations = response.get('variations', [])
            self.log(f"Caption variations generated: {len(variations)}")
        return success

    # ── Posts Tests ──
    def test_posts_create(self):
        """Test creating a post"""
        post_data = {
            "brand_id": self.brand_id,
            "campaign_id": self.campaign_id,
            "caption": "Test post created via API testing suite",
            "platforms": ["instagram", "twitter"],
            "post_type": "text"
        }
        success, response = self.run_test(
            "Posts Create",
            "POST", "/posts", 200, post_data
        )
        if success and 'id' in response:
            self.post_id = response['id']
            self.log(f"Post created with ID: {self.post_id}")
            return True
        return False

    def test_posts_list(self):
        """Test listing posts"""
        success, response = self.run_test(
            "Posts List",
            "GET", f"/posts?brand_id={self.brand_id}", 200
        )
        if success:
            posts = response if isinstance(response, list) else []
            self.log(f"Found {len(posts)} posts")
        return success

    # ── Health & Root Tests ──
    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "API Root Health Check",
            "GET", "/", 200
        )
        if success:
            self.log(f"API Message: {response.get('message', 'No message')}")
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        self.log("🚀 Starting SolisBoard API Test Suite", "START")
        self.log("=" * 60)
        
        # Health check first
        self.test_root_endpoint()
        
        # Auth flow
        self.log("\n📋 Authentication Tests")
        self.test_auth_register_existing_user()  # Should fail with 400
        login_success = self.test_auth_login()
        if not login_success:
            self.log("❌ Login failed - stopping tests", "CRITICAL")
            return self.generate_summary()
        
        self.test_auth_me()
        
        # Campaign tests
        self.log("\n🎯 Campaign Tests")
        self.test_campaigns_list()
        campaign_created = self.test_campaigns_create()
        if campaign_created:
            self.test_campaign_get()
            # Add delay for AI processing
            self.log("⏳ Testing AI Ideation (may take 10-30 seconds)...")
            self.test_campaign_ideation()
        
        # AI Generation tests
        self.log("\n🤖 AI Generation Tests (Modules 2 & 3)")
        self.log("⏳ Testing Multi-Model Text Generation (may take 10-30 seconds)...")
        self.test_generate_text_multi_model()
        self.test_generate_variations()
        
        # Posts tests
        self.log("\n📝 Posts Tests")
        self.test_posts_create()
        self.test_posts_list()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        self.log("\n" + "=" * 60)
        self.log(f"🏁 Test Suite Complete", "SUMMARY")
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            self.log("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                error_msg = failure.get('error', f"Status {failure.get('actual', 'unknown')}")
                self.log(f"  • {failure['test']}: {error_msg}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": len(self.failed_tests),
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "failures": self.failed_tests
        }

def main():
    """Main test execution"""
    print("SolisBoard API Testing Suite")
    print("Testing Backend: https://content-optimizer-44.preview.emergentagent.com")
    
    tester = SolisBoardAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())