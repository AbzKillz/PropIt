# PropGram - Property Social Media Platform

## Original Problem Statement
Build a mix of Rightmove.com and Instagram - a social media platform with TikTok/Instagram style UI focused on property and real estate. For landlords/vendors and tenants/renters/buyers.

## User Choices
- Authentication: JWT-based custom auth
- Media Upload: Emergent Object Storage
- Payment: Stripe for Pro subscription
- Color Scheme: White and mute green

## User Personas
1. **Explorers (Buyers/Renters)** - Green theme (#7B9681)
2. **Vendors (Sellers/Landlords)** - Sand theme (#C89F82)
3. **Agents** - Blue theme (#4A90E2) with verified badges

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
- [x] PRO subscription with Stripe

### Phase 2 Features (New!)
- [x] **Direct Messaging** - Conversations between users
- [x] **Property Inquiries** - "Request Viewing" button on property cards
- [x] **Stories Feature** - 24-hour expiring stories with viewer tracking
- [x] **Wishlist** - Save properties to profile wishlist tab
- [x] **Places I've Stayed** - Review places you've rented (Airbnb-style)
  - Add photos and star ratings
  - Property types: Airbnb, Rental, Hotel, Hostel
  - "Would recommend" feature
  - Community feed of all reviews
- [x] **Enhanced Profile**
  - 3 tabs: Posts, Wishlist, Places
  - Stats: Posts, Places stayed, Followers, Following
  - Messages button in header

### Database Collections
- users, posts, properties, comments, areas, follows
- messages, conversations, inquiries
- stories, wishlist, places_stayed
- payment_transactions, files

### API Endpoints (New)
- Messages: /api/messages, /api/messages/conversations
- Inquiries: /api/inquiries
- Stories: /api/stories
- Wishlist: /api/wishlist/{property_id}
- Places Stayed: /api/places-stayed, /api/places-stayed/feed

## Test Credentials
- Admin: admin@propgram.com / admin123
- Vendor: sarah@estates.com / password123
- Explorer: alex@email.com / password123

## Prioritized Backlog

### P1 (Next)
- [ ] Map view for properties
- [ ] Push notifications for messages
- [ ] Advanced search filters
- [ ] User verification workflow

### P2
- [ ] Video tours
- [ ] 3D property walkthroughs
- [ ] Mortgage calculator
- [ ] Price alerts

### P3
- [ ] Saved searches
- [ ] Property comparison tool
- [ ] Neighborhood guides
- [ ] School ratings integration
