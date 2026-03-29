import requests
import json

# Test with agent role for property creation
base_url = "https://propertygram.preview.emergentagent.com"

# Register as agent
agent_data = {
    "email": "test_agent@test.com",
    "password": "TestPass123!",
    "name": "Test Agent",
    "role": "agent"
}

print("Testing agent registration...")
response = requests.post(f"{base_url}/api/auth/register", json=agent_data)
print(f"Registration: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data['token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Test post creation
    print("\nTesting post creation...")
    post_data = {
        "content": "Check out this amazing property!",
        "media_urls": [],
        "tags": ["property", "test"]
    }
    
    response = requests.post(f"{base_url}/api/posts", json=post_data, headers=headers)
    print(f"Post creation: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
    else:
        print("✅ Post created successfully")
    
    # Test area creation
    print("\nTesting area creation...")
    area_data = {
        "name": "Test Area Agent",
        "city": "London",
        "postcode": "SW1A",
        "description": "A test area by agent"
    }
    
    response = requests.post(f"{base_url}/api/areas", json=area_data, headers=headers)
    print(f"Area creation: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
    else:
        print("✅ Area created successfully")
    
    # Test property creation
    print("\nTesting property creation...")
    property_data = {
        "title": "Agent Test Property",
        "description": "A beautiful test property by agent",
        "price": 250000,
        "property_type": "house",
        "listing_type": "buy",
        "bedrooms": 3,
        "bathrooms": 2,
        "area_sqft": 1500,
        "address": "123 Agent Street",
        "city": "London",
        "postcode": "SW1A 1AA",
        "features": ["garden", "parking"],
        "images": []
    }
    
    response = requests.post(f"{base_url}/api/properties", json=property_data, headers=headers)
    print(f"Property creation: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
    else:
        print("✅ Property created successfully")