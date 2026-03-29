# PropGram - Property Social Media Platform

## Original Problem Statement
Build a mix of Rightmove.com and Instagram - a social media platform with TikTok/Instagram style UI focused on property and real estate. For landlords/vendors and tenants/renters/buyers. Features include:
- Pick an area, join the community to find a place
- Buy/rent/sell integrated with media posting
- Search an area, follow it and see all media posted
- Users as buyer or seller with different account colors
- Verified estate agent profiles
- Content posting, comments, reviews - Instagram for properties

## User Choices
- Authentication: JWT-based custom auth
- Media Upload: Emergent Object Storage
- Payment: Stripe for Pro subscription
- Color Scheme: White and mute green

## User Personas
1. **Explorers (Buyers/Renters)** - Green theme (#7B9681)
   - Looking to buy or rent properties
   - Can browse, like, save, comment on posts
   - Can follow areas and users

2. **Vendors (Sellers/Landlords)** - Sand theme (#C89F82)
   - Own properties to sell or rent
   - Can list properties and create posts
   - PRO subscription for priority listings

3. **Agents** - Blue theme (#4A90E2)
   - Verified estate agent profiles
   - Can list multiple properties
   - PRO subscription for featured posts

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB
- **Storage**: Emergent Object Storage for media
- **Payments**: Stripe for PRO subscriptions

## What's Been Implemented (Jan 2026)

### Core Features
- [x] TikTok-style vertical snap-scroll feed
- [x] 4 feed tabs: Following, For You, Move (rentals), Buy/Sell (sales)
- [x] User authentication (register/login/logout)
- [x] Role-based accounts (Explorer/Vendor/Agent)
- [x] Property listings (buy/rent/sell)
- [x] Media posts with property cards
- [x] Comments system
- [x] Like/Save functionality
- [x] Area search and follow
- [x] Profile pages with role badges
- [x] PRO subscription with Stripe

### Database Seeded
- 24 users (15 vendors, 8 explorers, 1 admin)
- 22 properties (10 for sale, 12 for rent)
- 22 posts with property cards

### API Endpoints
- Auth: /api/auth/register, login, logout, me, refresh
- Properties: /api/properties (CRUD)
- Posts: /api/posts, /api/posts/feed
- Comments: /api/comments
- Areas: /api/areas
- Users: /api/users
- Files: /api/upload, /api/files
- Payments: /api/payments/checkout, status

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Core feed functionality
- [x] Authentication
- [x] Property listings

### P1 (High)
- [ ] Direct messaging between users
- [ ] Property inquiries
- [ ] Advanced search filters
- [ ] User verification workflow

### P2 (Medium)
- [ ] Stories feature
- [ ] Map view for properties
- [ ] Price alerts
- [ ] Saved searches

### P3 (Nice to have)
- [ ] Video tours
- [ ] 3D property walkthroughs
- [ ] Mortgage calculator
- [ ] Push notifications

## Test Credentials
- Admin: admin@propgram.com / admin123
- Vendor: sarah@estates.com / password123
- Explorer: alex@email.com / password123
