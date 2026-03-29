from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, File, UploadFile, Response, Query, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import requests
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# Object Storage Config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "propgram"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT Token Management
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth Helper
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = Field(default="buyer", description="buyer, seller, or agent")
    bio: Optional[str] = ""
    profile_image: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    bio: str
    profile_image: str
    is_verified: bool
    is_pro: bool
    followers_count: int
    following_count: int
    created_at: str

class PropertyCreate(BaseModel):
    title: str
    description: str
    price: float
    property_type: str = Field(description="house, apartment, flat, land, commercial")
    listing_type: str = Field(description="buy, rent, sell")
    bedrooms: Optional[int] = 0
    bathrooms: Optional[int] = 0
    area_sqft: Optional[int] = 0
    address: str
    city: str
    postcode: str
    features: List[str] = []
    images: List[str] = []

class PostCreate(BaseModel):
    content: str
    property_id: Optional[str] = None
    area_id: Optional[str] = None
    media_urls: List[str] = []
    tags: List[str] = []

class CommentCreate(BaseModel):
    content: str
    post_id: str

class AreaCreate(BaseModel):
    name: str
    city: str
    postcode: str
    description: Optional[str] = ""

# New Models for Messaging, Stories, Wishlists, Places Stayed
class MessageCreate(BaseModel):
    recipient_id: str
    content: str
    property_id: Optional[str] = None  # For property inquiries

class StoryCreate(BaseModel):
    media_url: str
    caption: Optional[str] = ""
    property_id: Optional[str] = None
    location: Optional[str] = ""

class PlaceStayedCreate(BaseModel):
    property_name: str
    location: str
    stay_date: str  # ISO date string
    rating: int = Field(ge=1, le=5)
    review: str
    photos: List[str] = []
    property_type: str = "rental"  # rental, airbnb, hotel, hostel
    would_recommend: bool = True

class InquiryCreate(BaseModel):
    property_id: str
    message: str
    contact_preference: str = "message"  # message, email, phone

# Create the main app
app = FastAPI(title="PropGram API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# ========== AUTH ROUTES ==========
@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role if user_data.role in ["buyer", "seller", "agent"] else "buyer",
        "bio": user_data.bio or "",
        "profile_image": user_data.profile_image or "",
        "is_verified": False,
        "is_pro": False,
        "followers_count": 0,
        "following_count": 0,
        "followed_areas": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "email": email,
        "name": user_data.name,
        "role": user_doc["role"],
        "bio": user_doc["bio"],
        "profile_image": user_doc["profile_image"],
        "is_verified": False,
        "is_pro": False,
        "followers_count": 0,
        "following_count": 0,
        "created_at": user_doc["created_at"],
        "token": access_token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, request: Request, response: Response):
    email = credentials.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force lockout
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_time = attempts.get("last_attempt")
        if lockout_time:
            lockout_dt = datetime.fromisoformat(lockout_time) if isinstance(lockout_time, str) else lockout_time
            if datetime.now(timezone.utc) - lockout_dt < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 15 minutes.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "email": email,
        "name": user["name"],
        "role": user["role"],
        "bio": user.get("bio", ""),
        "profile_image": user.get("profile_image", ""),
        "is_verified": user.get("is_verified", False),
        "is_pro": user.get("is_pro", False),
        "followers_count": user.get("followers_count", 0),
        "following_count": user.get("following_count", 0),
        "created_at": user.get("created_at", ""),
        "token": access_token
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload["sub"]
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ========== PROPERTY ROUTES ==========
@api_router.post("/properties")
async def create_property(property_data: PropertyCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["seller", "agent"]:
        raise HTTPException(status_code=403, detail="Only sellers and agents can list properties")
    
    property_doc = {
        "id": str(uuid.uuid4()),
        "title": property_data.title,
        "description": property_data.description,
        "price": property_data.price,
        "property_type": property_data.property_type,
        "listing_type": property_data.listing_type,
        "bedrooms": property_data.bedrooms,
        "bathrooms": property_data.bathrooms,
        "area_sqft": property_data.area_sqft,
        "address": property_data.address,
        "city": property_data.city,
        "postcode": property_data.postcode,
        "features": property_data.features,
        "images": property_data.images,
        "owner_id": str(user["_id"]),
        "owner_name": user["name"],
        "owner_role": user["role"],
        "is_featured": user.get("is_pro", False),
        "views": 0,
        "likes": 0,
        "saves": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.properties.insert_one(property_doc)
    property_doc.pop("_id", None)  # Remove MongoDB's _id before returning
    return property_doc

@api_router.get("/properties")
async def get_properties(
    listing_type: Optional[str] = None,
    property_type: Optional[str] = None,
    city: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {}
    if listing_type:
        query["listing_type"] = listing_type
    if property_type:
        query["property_type"] = property_type
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    # Sort: Featured (pro) first, then by date
    properties = await db.properties.find(query, {"_id": 0}).sort([("is_featured", -1), ("created_at", -1)]).skip(skip).limit(limit).to_list(limit)
    return properties

@api_router.get("/properties/{property_id}")
async def get_property(property_id: str):
    property_doc = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    # Increment views
    await db.properties.update_one({"id": property_id}, {"$inc": {"views": 1}})
    return property_doc

# ========== POST/FEED ROUTES ==========
@api_router.post("/posts")
async def create_post(post_data: PostCreate, request: Request):
    user = await get_current_user(request)
    
    post_doc = {
        "id": str(uuid.uuid4()),
        "content": post_data.content,
        "property_id": post_data.property_id,
        "area_id": post_data.area_id,
        "media_urls": post_data.media_urls,
        "tags": post_data.tags,
        "author_id": str(user["_id"]),
        "author_name": user["name"],
        "author_role": user["role"],
        "author_image": user.get("profile_image", ""),
        "is_pro": user.get("is_pro", False),
        "likes": 0,
        "comments_count": 0,
        "shares": 0,
        "saves": 0,
        "liked_by": [],
        "saved_by": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(post_doc)
    post_doc.pop("_id", None)  # Remove ObjectId before returning
    return post_doc

@api_router.get("/posts/feed")
async def get_feed(
    request: Request,
    feed_type: str = "foryou",
    area_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
):
    user = await get_optional_user(request)
    query = {}
    
    if feed_type == "following" and user:
        # Get followed users and areas
        followed_areas = user.get("followed_areas", [])
        following = await db.follows.find({"follower_id": user["_id"]}).to_list(100)
        following_ids = [f["following_id"] for f in following]
        query["$or"] = [
            {"author_id": {"$in": following_ids}},
            {"area_id": {"$in": followed_areas}}
        ]
    elif feed_type == "move":
        # Rental properties only
        posts_with_props = await db.posts.find({"property_id": {"$ne": None}}, {"property_id": 1}).to_list(1000)
        prop_ids = [p["property_id"] for p in posts_with_props]
        rental_props = await db.properties.find({"id": {"$in": prop_ids}, "listing_type": "rent"}, {"id": 1}).to_list(1000)
        rental_prop_ids = [p["id"] for p in rental_props]
        query["property_id"] = {"$in": rental_prop_ids}
    elif feed_type == "buysell":
        # Buy/sell properties only
        posts_with_props = await db.posts.find({"property_id": {"$ne": None}}, {"property_id": 1}).to_list(1000)
        prop_ids = [p["property_id"] for p in posts_with_props]
        sale_props = await db.properties.find({"id": {"$in": prop_ids}, "listing_type": {"$in": ["buy", "sell"]}}, {"id": 1}).to_list(1000)
        sale_prop_ids = [p["id"] for p in sale_props]
        query["property_id"] = {"$in": sale_prop_ids}
    elif area_id:
        query["area_id"] = area_id
    
    # Sort: Pro posts first, then by date
    posts = await db.posts.find(query, {"_id": 0}).sort([("is_pro", -1), ("created_at", -1)]).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with property data if available
    for post in posts:
        if post.get("property_id"):
            property_doc = await db.properties.find_one({"id": post["property_id"]}, {"_id": 0})
            post["property"] = property_doc
    
    return posts

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, request: Request):
    user = await get_current_user(request)
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if user["_id"] in post.get("liked_by", []):
        # Unlike
        await db.posts.update_one({"id": post_id}, {"$pull": {"liked_by": user["_id"]}, "$inc": {"likes": -1}})
        return {"liked": False}
    else:
        # Like
        await db.posts.update_one({"id": post_id}, {"$addToSet": {"liked_by": user["_id"]}, "$inc": {"likes": 1}})
        return {"liked": True}

@api_router.post("/posts/{post_id}/save")
async def save_post(post_id: str, request: Request):
    user = await get_current_user(request)
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if user["_id"] in post.get("saved_by", []):
        await db.posts.update_one({"id": post_id}, {"$pull": {"saved_by": user["_id"]}, "$inc": {"saves": -1}})
        return {"saved": False}
    else:
        await db.posts.update_one({"id": post_id}, {"$addToSet": {"saved_by": user["_id"]}, "$inc": {"saves": 1}})
        return {"saved": True}

# ========== COMMENT ROUTES ==========
@api_router.post("/comments")
async def create_comment(comment_data: CommentCreate, request: Request):
    user = await get_current_user(request)
    
    comment_doc = {
        "id": str(uuid.uuid4()),
        "content": comment_data.content,
        "post_id": comment_data.post_id,
        "author_id": str(user["_id"]),
        "author_name": user["name"],
        "author_role": user["role"],
        "author_image": user.get("profile_image", ""),
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(comment_doc)
    await db.posts.update_one({"id": comment_data.post_id}, {"$inc": {"comments_count": 1}})
    comment_doc.pop("_id", None)  # Remove ObjectId before returning
    return comment_doc

@api_router.get("/comments/{post_id}")
async def get_comments(post_id: str, skip: int = 0, limit: int = 20):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return comments

# ========== AREA ROUTES ==========
@api_router.post("/areas")
async def create_area(area_data: AreaCreate, request: Request):
    user = await get_current_user(request)
    
    # Check if area already exists
    existing = await db.areas.find_one({"name": {"$regex": f"^{area_data.name}$", "$options": "i"}, "city": {"$regex": f"^{area_data.city}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Area already exists")
    
    area_doc = {
        "id": str(uuid.uuid4()),
        "name": area_data.name,
        "city": area_data.city,
        "postcode": area_data.postcode,
        "description": area_data.description,
        "followers_count": 0,
        "posts_count": 0,
        "created_by": str(user["_id"]),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.areas.insert_one(area_doc)
    area_doc.pop("_id", None)  # Remove ObjectId before returning
    return area_doc

@api_router.get("/areas")
async def get_areas(search: Optional[str] = None, skip: int = 0, limit: int = 20):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"postcode": {"$regex": search, "$options": "i"}}
        ]
    
    areas = await db.areas.find(query, {"_id": 0}).sort("followers_count", -1).skip(skip).limit(limit).to_list(limit)
    return areas

@api_router.post("/areas/{area_id}/follow")
async def follow_area(area_id: str, request: Request):
    user = await get_current_user(request)
    
    area = await db.areas.find_one({"id": area_id})
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    followed_areas = user.get("followed_areas", [])
    if area_id in followed_areas:
        # Unfollow
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$pull": {"followed_areas": area_id}})
        await db.areas.update_one({"id": area_id}, {"$inc": {"followers_count": -1}})
        return {"following": False}
    else:
        # Follow
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$addToSet": {"followed_areas": area_id}})
        await db.areas.update_one({"id": area_id}, {"$inc": {"followers_count": 1}})
        return {"following": True}

# ========== USER/PROFILE ROUTES ==========
@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    return user

@api_router.get("/users/{user_id}/posts")
async def get_user_posts(user_id: str, skip: int = 0, limit: int = 20):
    posts = await db.posts.find({"author_id": user_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return posts

@api_router.get("/users/{user_id}/properties")
async def get_user_properties(user_id: str, skip: int = 0, limit: int = 20):
    properties = await db.properties.find({"owner_id": user_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return properties

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, request: Request):
    current_user = await get_current_user(request)
    if current_user["_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_follow = await db.follows.find_one({"follower_id": current_user["_id"], "following_id": user_id})
    
    if existing_follow:
        # Unfollow
        await db.follows.delete_one({"_id": existing_follow["_id"]})
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"followers_count": -1}})
        await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$inc": {"following_count": -1}})
        return {"following": False}
    else:
        # Follow
        await db.follows.insert_one({
            "follower_id": current_user["_id"],
            "following_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"followers_count": 1}})
        await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$inc": {"following_count": 1}})
        return {"following": True}

@api_router.put("/users/profile")
async def update_profile(request: Request, name: Optional[str] = None, bio: Optional[str] = None, profile_image: Optional[str] = None):
    user = await get_current_user(request)
    update_data = {}
    if name:
        update_data["name"] = name
    if bio is not None:
        update_data["bio"] = bio
    if profile_image is not None:
        update_data["profile_image"] = profile_image
    
    if update_data:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated_user["_id"] = str(updated_user["_id"])
    return updated_user

# ========== FILE UPLOAD ROUTES ==========
@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user['_id']}/{file_id}.{ext}"
    
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    file_doc = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "owner_id": str(user["_id"]),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.files.insert_one(file_doc)
    return {"id": file_id, "path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def download_file(path: str, auth: Optional[str] = Query(None)):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ========== PAYMENT/SUBSCRIPTION ROUTES ==========
PRO_PACKAGES = {
    "monthly": 9.99,
    "yearly": 99.99
}

@api_router.post("/payments/checkout")
async def create_checkout(package_id: str, origin_url: str, request: Request):
    user = await get_current_user(request)
    
    if package_id not in PRO_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    amount = PRO_PACKAGES[package_id]
    
    webhook_url = f"{str(request.base_url).rstrip('/')}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=os.environ.get("STRIPE_API_KEY"), webhook_url=webhook_url)
    
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user["_id"], "package_id": package_id}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["_id"],
        "email": user["email"],
        "package_id": package_id,
        "amount": amount,
        "currency": "usd",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    
    transaction = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user["_id"]})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already processed, return status
    if transaction.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid"}
    
    webhook_url = f"{str(request.base_url).rstrip('/')}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=os.environ.get("STRIPE_API_KEY"), webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": status.payment_status, "status": status.status}}
    )
    
    # If paid, upgrade user to pro
    if status.payment_status == "paid" and transaction.get("payment_status") != "paid":
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"is_pro": True, "pro_since": datetime.now(timezone.utc).isoformat()}})
    
    return {"status": status.status, "payment_status": status.payment_status}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        webhook_url = f"{str(request.base_url).rstrip('/')}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=os.environ.get("STRIPE_API_KEY"), webhook_url=webhook_url)
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            # Update transaction and user
            transaction = await db.payment_transactions.find_one({"session_id": event.session_id})
            if transaction and transaction.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                await db.users.update_one(
                    {"_id": ObjectId(transaction["user_id"])},
                    {"$set": {"is_pro": True, "pro_since": datetime.now(timezone.utc).isoformat()}}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ========== MESSAGING ROUTES ==========
@api_router.post("/messages")
async def send_message(message_data: MessageCreate, request: Request):
    user = await get_current_user(request)
    
    # Check recipient exists
    recipient = await db.users.find_one({"_id": ObjectId(message_data.recipient_id)})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Create or get conversation
    conversation = await db.conversations.find_one({
        "$or": [
            {"participants": [user["_id"], message_data.recipient_id]},
            {"participants": [message_data.recipient_id, user["_id"]]}
        ]
    })
    
    if not conversation:
        conv_doc = {
            "id": str(uuid.uuid4()),
            "participants": [user["_id"], message_data.recipient_id],
            "last_message": message_data.content[:100],
            "last_message_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.conversations.insert_one(conv_doc)
        conversation_id = conv_doc["id"]
    else:
        conversation_id = conversation["id"]
        await db.conversations.update_one(
            {"id": conversation_id},
            {"$set": {"last_message": message_data.content[:100], "last_message_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": user["_id"],
        "sender_name": user["name"],
        "sender_role": user["role"],
        "recipient_id": message_data.recipient_id,
        "content": message_data.content,
        "property_id": message_data.property_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    message_doc.pop("_id", None)
    
    # If property inquiry, also create inquiry record
    if message_data.property_id:
        property_doc = await db.properties.find_one({"id": message_data.property_id})
        if property_doc:
            inquiry_doc = {
                "id": str(uuid.uuid4()),
                "property_id": message_data.property_id,
                "property_title": property_doc.get("title", ""),
                "inquirer_id": user["_id"],
                "inquirer_name": user["name"],
                "owner_id": property_doc.get("owner_id"),
                "message": message_data.content,
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.inquiries.insert_one(inquiry_doc)
    
    return message_doc

@api_router.get("/messages/conversations")
async def get_conversations(request: Request):
    user = await get_current_user(request)
    
    conversations = await db.conversations.find(
        {"participants": user["_id"]},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(50)
    
    # Enrich with participant info
    for conv in conversations:
        other_id = [p for p in conv["participants"] if p != user["_id"]][0]
        other_user = await db.users.find_one({"_id": ObjectId(other_id)}, {"password_hash": 0, "_id": 0})
        if other_user:
            conv["other_user"] = other_user
        
        # Get unread count
        unread = await db.messages.count_documents({
            "conversation_id": conv["id"],
            "recipient_id": user["_id"],
            "read": False
        })
        conv["unread_count"] = unread
    
    return conversations

@api_router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, request: Request, skip: int = 0, limit: int = 50):
    user = await get_current_user(request)
    
    # Verify user is part of conversation
    conversation = await db.conversations.find_one({"id": conversation_id, "participants": user["_id"]})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Mark as read
    await db.messages.update_many(
        {"conversation_id": conversation_id, "recipient_id": user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

# ========== INQUIRY ROUTES ==========
@api_router.post("/inquiries")
async def create_inquiry(inquiry_data: InquiryCreate, request: Request):
    user = await get_current_user(request)
    
    property_doc = await db.properties.find_one({"id": inquiry_data.property_id})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    inquiry_doc = {
        "id": str(uuid.uuid4()),
        "property_id": inquiry_data.property_id,
        "property_title": property_doc.get("title", ""),
        "inquirer_id": user["_id"],
        "inquirer_name": user["name"],
        "inquirer_email": user["email"],
        "owner_id": property_doc.get("owner_id"),
        "message": inquiry_data.message,
        "contact_preference": inquiry_data.contact_preference,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.inquiries.insert_one(inquiry_doc)
    inquiry_doc.pop("_id", None)
    
    # Send message to property owner
    message_doc = {
        "id": str(uuid.uuid4()),
        "conversation_id": None,
        "sender_id": user["_id"],
        "sender_name": user["name"],
        "sender_role": user["role"],
        "recipient_id": property_doc.get("owner_id"),
        "content": f"🏠 Property Inquiry: {property_doc.get('title')}\n\n{inquiry_data.message}",
        "property_id": inquiry_data.property_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(message_doc)
    
    return inquiry_doc

@api_router.get("/inquiries")
async def get_inquiries(request: Request):
    user = await get_current_user(request)
    
    # Get inquiries for user's properties (if seller/agent) or sent by user (if buyer)
    if user["role"] in ["seller", "agent"]:
        inquiries = await db.inquiries.find(
            {"owner_id": user["_id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
    else:
        inquiries = await db.inquiries.find(
            {"inquirer_id": user["_id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
    
    return inquiries

# ========== STORIES ROUTES ==========
@api_router.post("/stories")
async def create_story(story_data: StoryCreate, request: Request):
    user = await get_current_user(request)
    
    story_doc = {
        "id": str(uuid.uuid4()),
        "media_url": story_data.media_url,
        "caption": story_data.caption,
        "property_id": story_data.property_id,
        "location": story_data.location,
        "author_id": user["_id"],
        "author_name": user["name"],
        "author_role": user["role"],
        "author_image": user.get("profile_image", ""),
        "is_pro": user.get("is_pro", False),
        "views": 0,
        "viewers": [],
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.stories.insert_one(story_doc)
    story_doc.pop("_id", None)
    return story_doc

@api_router.get("/stories")
async def get_stories(request: Request):
    user = await get_optional_user(request)
    
    # Get active stories (not expired)
    now = datetime.now(timezone.utc).isoformat()
    stories = await db.stories.find(
        {"expires_at": {"$gt": now}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Group by author
    authors = {}
    for story in stories:
        author_id = story["author_id"]
        if author_id not in authors:
            authors[author_id] = {
                "author_id": author_id,
                "author_name": story["author_name"],
                "author_role": story["author_role"],
                "author_image": story.get("author_image", ""),
                "is_pro": story.get("is_pro", False),
                "stories": [],
                "has_unseen": False
            }
        authors[author_id]["stories"].append(story)
        if user and user["_id"] not in story.get("viewers", []):
            authors[author_id]["has_unseen"] = True
    
    return list(authors.values())

@api_router.post("/stories/{story_id}/view")
async def view_story(story_id: str, request: Request):
    user = await get_current_user(request)
    
    await db.stories.update_one(
        {"id": story_id},
        {"$addToSet": {"viewers": user["_id"]}, "$inc": {"views": 1}}
    )
    
    return {"viewed": True}

# ========== WISHLIST ROUTES ==========
@api_router.post("/wishlist/{property_id}")
async def toggle_wishlist(property_id: str, request: Request):
    user = await get_current_user(request)
    
    property_doc = await db.properties.find_one({"id": property_id})
    if not property_doc:
        raise HTTPException(status_code=404, detail="Property not found")
    
    existing = await db.wishlist.find_one({"user_id": user["_id"], "property_id": property_id})
    
    if existing:
        await db.wishlist.delete_one({"_id": existing["_id"]})
        return {"wishlisted": False}
    else:
        wishlist_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["_id"],
            "property_id": property_id,
            "property_title": property_doc.get("title", ""),
            "property_price": property_doc.get("price", 0),
            "property_city": property_doc.get("city", ""),
            "property_image": property_doc.get("images", [""])[0] if property_doc.get("images") else "",
            "listing_type": property_doc.get("listing_type", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wishlist.insert_one(wishlist_doc)
        return {"wishlisted": True}

@api_router.get("/wishlist")
async def get_wishlist(request: Request):
    user = await get_current_user(request)
    
    wishlist = await db.wishlist.find(
        {"user_id": user["_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return wishlist

# ========== PLACES STAYED ROUTES ==========
@api_router.post("/places-stayed")
async def add_place_stayed(place_data: PlaceStayedCreate, request: Request):
    user = await get_current_user(request)
    
    place_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "user_name": user["name"],
        "user_role": user["role"],
        "property_name": place_data.property_name,
        "location": place_data.location,
        "stay_date": place_data.stay_date,
        "rating": place_data.rating,
        "review": place_data.review,
        "photos": place_data.photos,
        "property_type": place_data.property_type,
        "would_recommend": place_data.would_recommend,
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.places_stayed.insert_one(place_doc)
    place_doc.pop("_id", None)
    return place_doc

@api_router.get("/places-stayed")
async def get_places_stayed(request: Request, user_id: Optional[str] = None, skip: int = 0, limit: int = 20):
    query = {}
    if user_id:
        query["user_id"] = user_id
    
    places = await db.places_stayed.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return places

@api_router.get("/places-stayed/feed")
async def get_places_feed(request: Request, skip: int = 0, limit: int = 20):
    """Get all places stayed posts for the community feed"""
    places = await db.places_stayed.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user info
    for place in places:
        user = await db.users.find_one({"_id": ObjectId(place["user_id"])}, {"password_hash": 0})
        if user:
            place["user_image"] = user.get("profile_image", "")
            place["user_role"] = user.get("role", "buyer")
    
    return places

@api_router.post("/places-stayed/{place_id}/like")
async def like_place_stayed(place_id: str, request: Request):
    user = await get_current_user(request)
    
    place = await db.places_stayed.find_one({"id": place_id})
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    
    liked_by = place.get("liked_by", [])
    if user["_id"] in liked_by:
        await db.places_stayed.update_one(
            {"id": place_id},
            {"$pull": {"liked_by": user["_id"]}, "$inc": {"likes": -1}}
        )
        return {"liked": False}
    else:
        await db.places_stayed.update_one(
            {"id": place_id},
            {"$addToSet": {"liked_by": user["_id"]}, "$inc": {"likes": 1}}
        )
        return {"liked": True}

# ========== HEALTH CHECK ==========
@api_router.get("/")
async def root():
    return {"message": "PropGram API", "status": "healthy"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup events
@app.on_event("startup")
async def startup():
    # Initialize storage
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.posts.create_index([("is_pro", -1), ("created_at", -1)])
    await db.properties.create_index([("is_featured", -1), ("created_at", -1)])
    await db.areas.create_index("followers_count")
    await db.follows.create_index([("follower_id", 1), ("following_id", 1)])
    await db.messages.create_index([("conversation_id", 1), ("created_at", -1)])
    await db.conversations.create_index("participants")
    await db.stories.create_index([("expires_at", 1), ("created_at", -1)])
    await db.wishlist.create_index([("user_id", 1), ("property_id", 1)])
    await db.places_stayed.create_index([("user_id", 1), ("created_at", -1)])
    await db.inquiries.create_index([("owner_id", 1), ("created_at", -1)])
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@propgram.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "agent",
            "bio": "PropGram Admin",
            "profile_image": "",
            "is_verified": True,
            "is_pro": True,
            "followers_count": 0,
            "following_count": 0,
            "followed_areas": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user seeded")
    
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin User\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write("- Role: agent (verified, pro)\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/register\n")
        f.write("- POST /api/auth/login\n")
        f.write("- POST /api/auth/logout\n")
        f.write("- GET /api/auth/me\n")
        f.write("- POST /api/auth/refresh\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
