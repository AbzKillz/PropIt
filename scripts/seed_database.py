#!/usr/bin/env python3
"""Seed database with placeholder users and property posts"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import bcrypt
import os

# Connect to MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client['test_database']

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

SAMPLE_IMAGES = [
    "https://images.pexels.com/photos/17174768/pexels-photo-17174768.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/18435276/pexels-photo-18435276.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/6970049/pexels-photo-6970049.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/7511701/pexels-photo-7511701.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.unsplash.com/photo-1691425700585-c108acad6467?ixlib=rb-4.1.0&q=85",
    "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/2119714/pexels-photo-2119714.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
]

# Vendors (Sellers & Agents)
VENDORS = [
    {"name": "Sarah Estate Agency", "role": "agent", "is_pro": True, "is_verified": True, "email": "sarah@estates.com"},
    {"name": "James Property Co", "role": "seller", "is_pro": True, "is_verified": False, "email": "james@property.com"},
    {"name": "Emma Homes Ltd", "role": "agent", "is_pro": True, "is_verified": True, "email": "emma@homes.com"},
    {"name": "Marcus Realty", "role": "seller", "is_pro": False, "is_verified": False, "email": "marcus@realty.com"},
    {"name": "Olivia Lettings", "role": "agent", "is_pro": True, "is_verified": True, "email": "olivia@lettings.com"},
    {"name": "Tom Landlord", "role": "seller", "is_pro": False, "is_verified": False, "email": "tom@landlord.com"},
    {"name": "Sophie Properties", "role": "agent", "is_pro": True, "is_verified": True, "email": "sophie@properties.com"},
    {"name": "David Investments", "role": "seller", "is_pro": True, "is_verified": False, "email": "david@invest.com"},
    {"name": "Charlotte Estates", "role": "agent", "is_pro": False, "is_verified": True, "email": "charlotte@estates.com"},
    {"name": "William Homes", "role": "seller", "is_pro": False, "is_verified": False, "email": "william@homes.com"},
    {"name": "Premier Estates UK", "role": "agent", "is_pro": True, "is_verified": True, "email": "info@premierestates.com"},
    {"name": "City Living Rentals", "role": "agent", "is_pro": True, "is_verified": True, "email": "hello@cityliving.com"},
    {"name": "HomeFind Partners", "role": "agent", "is_pro": False, "is_verified": True, "email": "team@homefind.com"},
    {"name": "Urban Property Group", "role": "seller", "is_pro": True, "is_verified": False, "email": "sales@urbanprop.com"},
    {"name": "Coastal Homes Agency", "role": "agent", "is_pro": True, "is_verified": True, "email": "info@coastalhomes.com"},
]

# Explorers (Buyers)
EXPLORERS = [
    {"name": "Alex Explorer", "role": "buyer", "is_pro": False, "email": "alex@email.com"},
    {"name": "Jessica Hunt", "role": "buyer", "is_pro": False, "email": "jessica@email.com"},
    {"name": "Ryan Seeker", "role": "buyer", "is_pro": True, "email": "ryan@email.com"},
    {"name": "Mia FirstTime", "role": "buyer", "is_pro": False, "email": "mia@email.com"},
    {"name": "Noah Renter", "role": "buyer", "is_pro": False, "email": "noah@email.com"},
    {"name": "Ava Investor", "role": "buyer", "is_pro": True, "email": "ava@email.com"},
    {"name": "Liam Student", "role": "buyer", "is_pro": False, "email": "liam@email.com"},
    {"name": "Isabella Young", "role": "buyer", "is_pro": False, "email": "isabella@email.com"},
]

# Properties for sale
PROPERTIES_FOR_SALE = [
    {"title": "Victorian Terrace", "price": 850000, "city": "London", "area": "Islington", "beds": 3, "baths": 2, "sqft": 1800, "type": "house", "desc": "Stunning 3-bed Victorian terrace in the heart of London. Period features throughout, original fireplaces and high ceilings!", "tags": ["victorian", "london", "familyhome", "periodhome"]},
    {"title": "Modern Penthouse", "price": 1250000, "city": "Manchester", "area": "Spinningfields", "beds": 2, "baths": 2, "sqft": 1500, "type": "apartment", "desc": "Luxury penthouse with panoramic city views. High-spec finish throughout with floor-to-ceiling windows.", "tags": ["penthouse", "luxury", "cityviews", "modern"]},
    {"title": "Country Cottage", "price": 425000, "city": "Cotswolds", "area": "Bourton-on-the-Water", "beds": 2, "baths": 1, "sqft": 950, "type": "house", "desc": "Charming honey-stone cottage with beautiful gardens. Perfect weekend retreat in idyllic village!", "tags": ["cottage", "countryside", "cotswolds", "garden"]},
    {"title": "New Build Apartment", "price": 295000, "city": "Birmingham", "area": "Jewellery Quarter", "beds": 1, "baths": 1, "sqft": 650, "type": "apartment", "desc": "Brand new apartment with modern kitchen and balcony. Help to Buy available! Perfect for first-time buyers.", "tags": ["newbuild", "firsttimebuyer", "helptobuy", "apartment"]},
    {"title": "Georgian Townhouse", "price": 1750000, "city": "Bath", "area": "Royal Crescent", "beds": 5, "baths": 3, "sqft": 3200, "type": "house", "desc": "Magnificent Grade II listed Georgian townhouse near Royal Crescent. Rare opportunity to own a piece of history!", "tags": ["georgian", "listed", "bath", "luxury"]},
    {"title": "Seaside Bungalow", "price": 375000, "city": "Brighton", "area": "Hove", "beds": 3, "baths": 2, "sqft": 1100, "type": "house", "desc": "Detached bungalow just 5 mins walk from the beach. South-facing garden perfect for summer BBQs!", "tags": ["bungalow", "seaside", "brighton", "retirement"]},
    {"title": "Converted Warehouse", "price": 550000, "city": "Leeds", "area": "Calls Landing", "beds": 2, "baths": 2, "sqft": 1400, "type": "apartment", "desc": "Stunning warehouse conversion with exposed brick and original features. Double-height ceilings!", "tags": ["warehouse", "conversion", "industrial", "loft"]},
    {"title": "Family Detached", "price": 625000, "city": "Bristol", "area": "Clifton", "beds": 4, "baths": 3, "sqft": 2100, "type": "house", "desc": "Spacious family home in sought-after Clifton. Great schools nearby and stunning views of Suspension Bridge!", "tags": ["familyhome", "detached", "garden", "schools"]},
    {"title": "Investment Portfolio", "price": 2100000, "city": "Liverpool", "area": "Baltic Triangle", "beds": 12, "baths": 12, "sqft": 4500, "type": "commercial", "desc": "6 apartment investment block in trendy Baltic Triangle. Fully tenanted with 7% yield!", "tags": ["investment", "portfolio", "yield", "btl"]},
    {"title": "Riverside Apartment", "price": 485000, "city": "London", "area": "Canary Wharf", "beds": 2, "baths": 2, "sqft": 900, "type": "apartment", "desc": "Modern apartment with Thames views. 24hr concierge, gym and swimming pool access included.", "tags": ["riverside", "thames", "concierge", "gym"]},
]

# Properties for rent
PROPERTIES_FOR_RENT = [
    {"title": "City Centre Studio", "price": 1200, "city": "London", "area": "Shoreditch", "beds": 0, "baths": 1, "sqft": 400, "type": "flat", "desc": "Trendy studio in the heart of Shoreditch. Bills included! Perfect for young professionals.", "tags": ["studio", "shoreditch", "billsincluded", "furnished"]},
    {"title": "Modern 2-Bed Flat", "price": 1500, "city": "Manchester", "area": "Northern Quarter", "beds": 2, "baths": 1, "sqft": 750, "type": "flat", "desc": "Stylish apartment in trendy Northern Quarter. Exposed brick walls and industrial feel!", "tags": ["modern", "manchester", "cityliving", "quirky"]},
    {"title": "Student House Share", "price": 550, "city": "Leeds", "area": "Headingley", "beds": 1, "baths": 1, "sqft": 200, "type": "flat", "desc": "Room in friendly 5-bed student house. Fast WiFi, garden and close to university!", "tags": ["student", "houseshare", "university", "bills"]},
    {"title": "Executive Apartment", "price": 2500, "city": "London", "area": "Mayfair", "beds": 2, "baths": 2, "sqft": 1100, "type": "apartment", "desc": "Luxury serviced apartment in prestigious Mayfair. Weekly cleaning and concierge included.", "tags": ["executive", "mayfair", "serviced", "luxury"]},
    {"title": "Garden Flat", "price": 1100, "city": "Edinburgh", "area": "Stockbridge", "beds": 1, "baths": 1, "sqft": 550, "type": "flat", "desc": "Charming ground floor flat with private garden in lovely Stockbridge. Pet friendly!", "tags": ["garden", "petfriendly", "edinburgh", "cosy"]},
    {"title": "Dockside Loft", "price": 1800, "city": "Liverpool", "area": "Albert Dock", "beds": 2, "baths": 2, "sqft": 1000, "type": "apartment", "desc": "Stunning waterfront loft apartment overlooking Albert Dock. Parking included!", "tags": ["dockside", "waterfront", "parking", "loft"]},
    {"title": "Victorian Conversion", "price": 1650, "city": "Bristol", "area": "Redland", "beds": 2, "baths": 1, "sqft": 850, "type": "flat", "desc": "Beautiful Victorian flat with high ceilings and original features. Close to Whiteladies Road.", "tags": ["victorian", "highceilings", "bristol", "character"]},
    {"title": "New Build with Gym", "price": 1950, "city": "Birmingham", "area": "Brindleyplace", "beds": 2, "baths": 2, "sqft": 800, "type": "apartment", "desc": "Brand new luxury apartment with gym, cinema room and rooftop terrace access.", "tags": ["newbuild", "gym", "rooftop", "luxury"]},
    {"title": "Cosy Cottage", "price": 950, "city": "York", "area": "Bishopthorpe", "beds": 2, "baths": 1, "sqft": 700, "type": "house", "desc": "Picturesque cottage 10 mins from York Minster. Log burner and parking included!", "tags": ["cottage", "york", "logburner", "countryside"]},
    {"title": "Penthouse Suite", "price": 3500, "city": "London", "area": "South Bank", "beds": 3, "baths": 2, "sqft": 1800, "type": "apartment", "desc": "Spectacular penthouse with wrap-around terrace and views of the Shard and Thames!", "tags": ["penthouse", "terrace", "views", "southbank"]},
    {"title": "Artsy Warehouse", "price": 1400, "city": "Glasgow", "area": "Merchant City", "beds": 1, "baths": 1, "sqft": 650, "type": "apartment", "desc": "Creative space in converted warehouse. Perfect for artists and creative professionals!", "tags": ["warehouse", "creative", "glasgow", "unique"]},
    {"title": "Family Townhouse", "price": 2200, "city": "Oxford", "area": "Jericho", "beds": 3, "baths": 2, "sqft": 1300, "type": "house", "desc": "Beautiful townhouse in popular Jericho. Walking distance to city centre and great schools.", "tags": ["townhouse", "oxford", "family", "jericho"]},
]

async def seed_database():
    # Clear existing data
    await db.posts.delete_many({})
    await db.properties.delete_many({})
    await db.users.delete_many({"email": {"$ne": "admin@propgram.com"}})
    print("Cleared existing data")
    
    # Create vendor users
    vendor_ids = []
    for v in VENDORS:
        user_doc = {
            "email": v["email"],
            "password_hash": hash_password("password123"),
            "name": v["name"],
            "role": v["role"],
            "bio": f"Property professional at {v['name']}",
            "profile_image": "",
            "is_verified": v.get("is_verified", False),
            "is_pro": v.get("is_pro", False),
            "followers_count": 100 + (500 if v.get("is_pro") else 0),
            "following_count": 50,
            "followed_areas": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.users.insert_one(user_doc)
        vendor_ids.append({"id": str(result.inserted_id), **v})
    print(f"Created {len(vendor_ids)} vendor users")
    
    # Create explorer users
    explorer_ids = []
    for e in EXPLORERS:
        user_doc = {
            "email": e["email"],
            "password_hash": hash_password("password123"),
            "name": e["name"],
            "role": e["role"],
            "bio": "Looking for my dream home!",
            "profile_image": "",
            "is_verified": False,
            "is_pro": e.get("is_pro", False),
            "followers_count": 20,
            "following_count": 100,
            "followed_areas": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.users.insert_one(user_doc)
        explorer_ids.append({"id": str(result.inserted_id), **e})
    print(f"Created {len(explorer_ids)} explorer users")
    
    # Create properties for sale and posts
    for i, prop in enumerate(PROPERTIES_FOR_SALE):
        vendor = vendor_ids[i % len(vendor_ids)]
        prop_id = str(uuid.uuid4())
        
        property_doc = {
            "id": prop_id,
            "title": prop["title"],
            "description": prop["desc"],
            "price": prop["price"],
            "property_type": prop["type"],
            "listing_type": "buy",
            "bedrooms": prop["beds"],
            "bathrooms": prop["baths"],
            "area_sqft": prop["sqft"],
            "address": f"123 {prop['area']} Street",
            "city": prop["city"],
            "postcode": "XX1 1XX",
            "features": prop["tags"],
            "images": [SAMPLE_IMAGES[i % len(SAMPLE_IMAGES)]],
            "owner_id": vendor["id"],
            "owner_name": vendor["name"],
            "owner_role": vendor["role"],
            "is_featured": vendor.get("is_pro", False),
            "views": 100 + i * 50,
            "likes": 20 + i * 10,
            "saves": 5 + i * 2,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.properties.insert_one(property_doc)
        
        # Create post for this property
        post_doc = {
            "id": str(uuid.uuid4()),
            "content": prop["desc"],
            "property_id": prop_id,
            "area_id": None,
            "media_urls": [SAMPLE_IMAGES[i % len(SAMPLE_IMAGES)]],
            "tags": prop["tags"],
            "author_id": vendor["id"],
            "author_name": vendor["name"],
            "author_role": vendor["role"],
            "author_image": "",
            "is_pro": vendor.get("is_pro", False),
            "likes": 50 + i * 20,
            "comments_count": 10 + i * 5,
            "shares": 5 + i,
            "saves": 10 + i * 3,
            "liked_by": [],
            "saved_by": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.posts.insert_one(post_doc)
    print(f"Created {len(PROPERTIES_FOR_SALE)} sale properties and posts")
    
    # Create properties for rent and posts
    for i, prop in enumerate(PROPERTIES_FOR_RENT):
        vendor = vendor_ids[(i + 5) % len(vendor_ids)]
        prop_id = str(uuid.uuid4())
        img_index = (i + 10) % len(SAMPLE_IMAGES)
        
        property_doc = {
            "id": prop_id,
            "title": prop["title"],
            "description": prop["desc"],
            "price": prop["price"],
            "property_type": prop["type"],
            "listing_type": "rent",
            "bedrooms": prop["beds"],
            "bathrooms": prop["baths"],
            "area_sqft": prop["sqft"],
            "address": f"456 {prop['area']} Road",
            "city": prop["city"],
            "postcode": "YY2 2YY",
            "features": prop["tags"],
            "images": [SAMPLE_IMAGES[img_index]],
            "owner_id": vendor["id"],
            "owner_name": vendor["name"],
            "owner_role": vendor["role"],
            "is_featured": vendor.get("is_pro", False),
            "views": 80 + i * 30,
            "likes": 15 + i * 8,
            "saves": 3 + i,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.properties.insert_one(property_doc)
        
        # Create post for this property
        post_doc = {
            "id": str(uuid.uuid4()),
            "content": prop["desc"],
            "property_id": prop_id,
            "area_id": None,
            "media_urls": [SAMPLE_IMAGES[img_index]],
            "tags": prop["tags"],
            "author_id": vendor["id"],
            "author_name": vendor["name"],
            "author_role": vendor["role"],
            "author_image": "",
            "is_pro": vendor.get("is_pro", False),
            "likes": 40 + i * 15,
            "comments_count": 8 + i * 3,
            "shares": 3 + i,
            "saves": 8 + i * 2,
            "liked_by": [],
            "saved_by": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.posts.insert_one(post_doc)
    print(f"Created {len(PROPERTIES_FOR_RENT)} rental properties and posts")
    
    # Count results
    users_count = await db.users.count_documents({})
    posts_count = await db.posts.count_documents({})
    props_count = await db.properties.count_documents({})
    
    print(f"\n=== Database Seeded ===")
    print(f"Total Users: {users_count}")
    print(f"Total Posts: {posts_count}")
    print(f"Total Properties: {props_count}")

if __name__ == "__main__":
    asyncio.run(seed_database())
