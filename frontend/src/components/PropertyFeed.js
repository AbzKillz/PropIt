import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Plus, BadgeCheck, Crown, MapPin, Bed, Bath, Square, Send } from 'lucide-react';
import { postsAPI, wishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CommentsSheet from './CommentsSheet';
import PropertyInquiryModal from './PropertyInquiryModal';

const SAMPLE_IMAGES = [
  "https://images.pexels.com/photos/17174768/pexels-photo-17174768.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/18435276/pexels-photo-18435276.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/6970049/pexels-photo-6970049.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/7511701/pexels-photo-7511701.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.unsplash.com/photo-1691425700585-c108acad6467?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc3NDc5ODQxMHww&ixlib=rb-4.1.0&q=85",
  "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
];

const FeedItem = ({ post, index, onLike, onSave, onComment, onFollow }) => {
  const { user, isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  
  useEffect(() => {
    if (user && post.liked_by) {
      setLiked(post.liked_by.includes(user._id || user.id));
    }
    if (user && post.saved_by) {
      setSaved(post.saved_by.includes(user._id || user.id));
    }
  }, [user, post]);

  const handleLike = async () => {
    if (!isAuthenticated) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    try {
      await postsAPI.like(post.id);
    } catch (e) {
      setLiked(!newLiked);
      setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) return;
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      await postsAPI.save(post.id);
    } catch (e) {
      setSaved(!newSaved);
    }
  };

  const mediaUrl = post.media_urls?.[0] || (post.property?.images?.[0]) || SAMPLE_IMAGES[index % SAMPLE_IMAGES.length];
  const property = post.property;

  return (
    <div className="snap-item h-screen w-full relative bg-black" data-testid={`feed-item-${index}`}>
      {/* Background Image */}
      <img 
        src={mediaUrl} 
        alt={post.content || "Property"} 
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 gradient-overlay-top h-32" />
      <div className="absolute inset-0 gradient-overlay-bottom" />
      
      {/* Right Sidebar Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-5 items-center z-10" data-testid="feed-actions">
        {/* Author Avatar */}
        <div className="relative mb-2">
          <div 
            className={`w-12 h-12 rounded-full border-2 overflow-hidden ${
              post.author_role === 'buyer' ? 'border-[#7B9681]' : 
              post.author_role === 'agent' ? 'border-[#4A90E2]' : 'border-[#C89F82]'
            }`}
          >
            <img 
              src={post.author_image || `https://ui-avatars.com/api/?name=${post.author_name}&background=7B9681&color=fff`}
              alt={post.author_name}
              className="w-full h-full object-cover"
            />
          </div>
          <button 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#7B9681] rounded-full flex items-center justify-center"
            data-testid="follow-author-btn"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
          </button>
        </div>

        {/* Like */}
        <button 
          className={`action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          data-testid="feed-like-button"
        >
          <Heart className="w-6 h-6" fill={liked ? "currentColor" : "none"} strokeWidth={2} />
        </button>
        <span className="text-white text-xs font-semibold -mt-3">{likesCount}</span>

        {/* Comment */}
        <button 
          className="action-btn"
          onClick={() => setShowComments(true)}
          data-testid="feed-comment-button"
        >
          <MessageCircle className="w-6 h-6" strokeWidth={2} />
        </button>
        <span className="text-white text-xs font-semibold -mt-3">{post.comments_count || 0}</span>

        {/* Share */}
        <button className="action-btn" data-testid="feed-share-button">
          <Share2 className="w-6 h-6" strokeWidth={2} />
        </button>

        {/* Save */}
        <button 
          className={`action-btn ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          data-testid="feed-save-button"
        >
          <Bookmark className="w-6 h-6" fill={saved ? "currentColor" : "none"} strokeWidth={2} />
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-4 pb-24 text-white z-10" data-testid="feed-info">
        {/* Author Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-semibold text-sm">{post.author_name}</span>
          {(post.author_role === 'agent' || post.is_verified) && (
            <BadgeCheck className="w-4 h-4 text-[#4A90E2]" />
          )}
          {post.is_pro && (
            <span className="badge-pro px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              <Crown className="w-3 h-3" /> PRO
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            post.author_role === 'buyer' ? 'badge-buyer' : 
            post.author_role === 'agent' ? 'bg-blue-500/20 text-blue-300' : 'badge-seller'
          }`}>
            {post.author_role === 'buyer' ? 'Explorer' : post.author_role === 'agent' ? 'Agent' : 'Vendor'}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm mb-3 line-clamp-2">{post.content}</p>

        {/* Property Details */}
        {property && (
          <div className="glass-dark rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{property.title}</h3>
              <span className="text-[#7B9681] font-bold text-lg">
                {property.listing_type === 'rent' ? '£' : '£'}
                {property.price?.toLocaleString()}
                {property.listing_type === 'rent' && <span className="text-xs font-normal">/mo</span>}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {property.area || property.city}
              </span>
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" /> {property.bedrooms}
                </span>
              )}
              {property.bedrooms === 0 && (
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" /> Studio
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bath className="w-4 h-4" /> {property.bathrooms}
                </span>
              )}
              {property.area_sqft > 0 && (
                <span className="flex items-center gap-1">
                  <Square className="w-4 h-4" /> {property.area_sqft} sqft
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                property.listing_type === 'buy' ? 'bg-[#7B9681] text-white' :
                property.listing_type === 'rent' ? 'bg-[#4A90E2] text-white' :
                'bg-[#C89F82] text-white'
              }`}>
                For {property.listing_type === 'buy' ? 'Sale' : property.listing_type}
              </span>
              <span className="text-xs text-gray-400">{property.city}</span>
              {/* Request Viewing Button */}
              <button
                onClick={() => setShowInquiry(true)}
                className="ml-auto px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-white/30 transition-colors"
                data-testid="request-viewing-btn"
              >
                <Send className="w-3 h-3" /> Request Viewing
              </button>
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
              <span key={i} className="text-xs text-gray-300">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Sheet */}
      <CommentsSheet 
        isOpen={showComments} 
        onClose={() => setShowComments(false)} 
        postId={post.id} 
      />

      {/* Property Inquiry Modal */}
      {property && (
        <PropertyInquiryModal
          isOpen={showInquiry}
          onClose={() => setShowInquiry(false)}
          property={property}
        />
      )}
    </div>
  );
};

const PropertyFeed = ({ feedType = 'foryou', areaId = null }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);

  const fetchPosts = useCallback(async (skip = 0) => {
    try {
      const { data } = await postsAPI.getFeed({ 
        feed_type: feedType, 
        area_id: areaId,
        skip, 
        limit: 10 
      });
      
      if (skip === 0) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 10);
    } catch (e) {
      console.error('Error fetching feed:', e);
    } finally {
      setLoading(false);
    }
  }, [feedType, areaId]);

  useEffect(() => {
    setLoading(true);
    setPosts([]); // Reset posts when feed type changes
    fetchPosts(0);
  }, [fetchPosts]);

  // Sample posts if no real posts - extensive placeholder data
  const SAMPLE_VENDORS = [
    { name: 'Sarah Estate', role: 'agent', is_pro: true, verified: true },
    { name: 'James Property Co', role: 'seller', is_pro: true, verified: false },
    { name: 'Emma Homes Ltd', role: 'agent', is_pro: true, verified: true },
    { name: 'Marcus Realty', role: 'seller', is_pro: false, verified: false },
    { name: 'Olivia Lettings', role: 'agent', is_pro: true, verified: true },
    { name: 'Tom Landlord', role: 'seller', is_pro: false, verified: false },
    { name: 'Sophie Properties', role: 'agent', is_pro: true, verified: true },
    { name: 'David Investments', role: 'seller', is_pro: true, verified: false },
    { name: 'Charlotte Estates', role: 'agent', is_pro: false, verified: true },
    { name: 'William Homes', role: 'seller', is_pro: false, verified: false },
    { name: 'Premier Estates UK', role: 'agent', is_pro: true, verified: true },
    { name: 'City Living Rentals', role: 'agent', is_pro: true, verified: true },
    { name: 'HomeFind Partners', role: 'agent', is_pro: false, verified: true },
    { name: 'Urban Property Group', role: 'seller', is_pro: true, verified: false },
    { name: 'Coastal Homes Agency', role: 'agent', is_pro: true, verified: true },
  ];

  const SAMPLE_EXPLORERS = [
    { name: 'Alex Explorer', role: 'buyer', is_pro: false },
    { name: 'Jessica Hunt', role: 'buyer', is_pro: false },
    { name: 'Ryan Seeker', role: 'buyer', is_pro: true },
    { name: 'Mia FirstTime', role: 'buyer', is_pro: false },
    { name: 'Noah Renter', role: 'buyer', is_pro: false },
    { name: 'Ava Investor', role: 'buyer', is_pro: true },
    { name: 'Liam Student', role: 'buyer', is_pro: false },
    { name: 'Isabella Young', role: 'buyer', is_pro: false },
  ];

  const SAMPLE_PROPERTIES_DATA = [
    // FOR SALE
    { title: 'Victorian Terrace', price: 850000, type: 'buy', city: 'London', area: 'Islington', beds: 3, baths: 2, sqft: 1800, desc: 'Stunning 3-bed Victorian terrace in the heart of London. Period features throughout!', tags: ['victorian', 'london', 'familyhome', 'periodhome'] },
    { title: 'Modern Penthouse', price: 1250000, type: 'buy', city: 'Manchester', area: 'Spinningfields', beds: 2, baths: 2, sqft: 1500, desc: 'Luxury penthouse with panoramic city views. High-spec finish throughout.', tags: ['penthouse', 'luxury', 'cityviews', 'modern'] },
    { title: 'Country Cottage', price: 425000, type: 'buy', city: 'Cotswolds', area: 'Bourton', beds: 2, baths: 1, sqft: 950, desc: 'Charming honey-stone cottage with beautiful gardens. Perfect weekend retreat!', tags: ['cottage', 'countryside', 'cotswolds', 'garden'] },
    { title: 'New Build Apartment', price: 295000, type: 'buy', city: 'Birmingham', area: 'Jewellery Quarter', beds: 1, baths: 1, sqft: 650, desc: 'Brand new apartment with modern kitchen and balcony. Help to Buy available!', tags: ['newbuild', 'firsttimebuyer', 'helptobuy', 'apartment'] },
    { title: 'Georgian Townhouse', price: 1750000, type: 'buy', city: 'Bath', area: 'Royal Crescent', beds: 5, baths: 3, sqft: 3200, desc: 'Magnificent Grade II listed Georgian townhouse. Rare opportunity!', tags: ['georgian', 'listed', 'bath', 'luxury'] },
    { title: 'Seaside Bungalow', price: 375000, type: 'buy', city: 'Brighton', area: 'Hove', beds: 3, baths: 2, sqft: 1100, desc: 'Detached bungalow just 5 mins walk from the beach. South-facing garden!', tags: ['bungalow', 'seaside', 'brighton', 'retirement'] },
    { title: 'Converted Warehouse', price: 550000, type: 'buy', city: 'Leeds', area: 'Calls Landing', beds: 2, baths: 2, sqft: 1400, desc: 'Stunning warehouse conversion with exposed brick and original features.', tags: ['warehouse', 'conversion', 'industrial', 'loft'] },
    { title: 'Family Detached', price: 625000, type: 'buy', city: 'Bristol', area: 'Clifton', beds: 4, baths: 3, sqft: 2100, desc: 'Spacious family home in sought-after Clifton. Great schools nearby!', tags: ['familyhome', 'detached', 'garden', 'schools'] },
    { title: 'Investment Portfolio', price: 2100000, type: 'buy', city: 'Liverpool', area: 'Baltic Triangle', beds: 12, baths: 12, sqft: 4500, desc: '6 apartment investment block. Fully tenanted with 7% yield!', tags: ['investment', 'portfolio', 'yield', 'btl'] },
    { title: 'Riverside Apartment', price: 485000, type: 'buy', city: 'London', area: 'Canary Wharf', beds: 2, baths: 2, sqft: 900, desc: 'Modern apartment with Thames views. 24hr concierge and gym.', tags: ['riverside', 'thames', 'concierge', 'gym'] },
    
    // FOR RENT
    { title: 'City Centre Studio', price: 1200, type: 'rent', city: 'London', area: 'Shoreditch', beds: 0, baths: 1, sqft: 400, desc: 'Trendy studio in the heart of Shoreditch. Bills included! Perfect for young professionals.', tags: ['studio', 'shoreditch', 'billsincluded', 'furnished'] },
    { title: 'Modern 2-Bed Flat', price: 1500, type: 'rent', city: 'Manchester', area: 'Northern Quarter', beds: 2, baths: 1, sqft: 750, desc: 'Stylish apartment above popular coffee shop. Exposed brick walls!', tags: ['modern', 'manchester', 'cityliving', 'quirky'] },
    { title: 'Student House Share', price: 550, type: 'rent', city: 'Leeds', area: 'Headingley', beds: 1, baths: 1, sqft: 200, desc: 'Room in friendly 5-bed student house. Fast WiFi and garden!', tags: ['student', 'houseshare', 'university', 'bills'] },
    { title: 'Executive Apartment', price: 2500, type: 'rent', city: 'London', area: 'Mayfair', beds: 2, baths: 2, sqft: 1100, desc: 'Luxury serviced apartment in prestigious Mayfair. Weekly cleaning included.', tags: ['executive', 'mayfair', 'serviced', 'luxury'] },
    { title: 'Garden Flat', price: 1100, type: 'rent', city: 'Edinburgh', area: 'Stockbridge', beds: 1, baths: 1, sqft: 550, desc: 'Charming ground floor flat with private garden. Pet friendly!', tags: ['garden', 'petfriendly', 'edinburgh', 'cosy'] },
    { title: 'Dockside Loft', price: 1800, type: 'rent', city: 'Liverpool', area: 'Albert Dock', beds: 2, baths: 2, sqft: 1000, desc: 'Stunning waterfront loft apartment. Parking included!', tags: ['dockside', 'waterfront', 'parking', 'loft'] },
    { title: 'Victorian Conversion', price: 1650, type: 'rent', city: 'Bristol', area: 'Redland', beds: 2, baths: 1, sqft: 850, desc: 'Beautiful Victorian flat with high ceilings. Close to Whiteladies Road.', tags: ['victorian', 'highceilings', 'bristol', 'character'] },
    { title: 'New Build with Gym', price: 1950, type: 'rent', city: 'Birmingham', area: 'Brindleyplace', beds: 2, baths: 2, sqft: 800, desc: 'Brand new luxury apartment with gym and rooftop terrace access.', tags: ['newbuild', 'gym', 'rooftop', 'luxury'] },
    { title: 'Cosy Cottage', price: 950, type: 'rent', city: 'York', area: 'Bishopthorpe', beds: 2, baths: 1, sqft: 700, desc: 'Picturesque cottage 10 mins from York Minster. Log burner included!', tags: ['cottage', 'york', 'logburner', 'countryside'] },
    { title: 'Penthouse Suite', price: 3500, type: 'rent', city: 'London', area: 'South Bank', beds: 3, baths: 2, sqft: 1800, desc: 'Spectacular penthouse with wrap-around terrace. Views of the Shard!', tags: ['penthouse', 'terrace', 'views', 'southbank'] },
    { title: 'Artsy Warehouse', price: 1400, type: 'rent', city: 'Glasgow', area: 'Merchant City', beds: 1, baths: 1, sqft: 650, desc: 'Creative space in converted warehouse. Perfect for artists!', tags: ['warehouse', 'creative', 'glasgow', 'unique'] },
    { title: 'Family Townhouse', price: 2200, type: 'rent', city: 'Oxford', area: 'Jericho', beds: 3, baths: 2, sqft: 1300, desc: 'Beautiful townhouse in popular Jericho. Walking distance to city centre.', tags: ['townhouse', 'oxford', 'family', 'jericho'] },
  ];

  const generateSamplePosts = (filterType) => {
    let filteredData = SAMPLE_PROPERTIES_DATA;
    
    if (filterType === 'move') {
      filteredData = SAMPLE_PROPERTIES_DATA.filter(p => p.type === 'rent');
    } else if (filterType === 'buysell') {
      filteredData = SAMPLE_PROPERTIES_DATA.filter(p => p.type === 'buy');
    }
    
    return filteredData.map((prop, index) => {
      const vendor = SAMPLE_VENDORS[index % SAMPLE_VENDORS.length];
      return {
        id: `sample-${index}-${prop.type}`,
        content: prop.desc,
        author_name: vendor.name,
        author_role: vendor.role,
        author_image: `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name)}&background=${vendor.role === 'agent' ? '4A90E2' : 'C89F82'}&color=fff`,
        is_pro: vendor.is_pro,
        is_verified: vendor.verified,
        likes: Math.floor(Math.random() * 500) + 50,
        comments_count: Math.floor(Math.random() * 80) + 5,
        liked_by: [],
        saved_by: [],
        tags: prop.tags,
        property: {
          title: prop.title,
          price: prop.price,
          listing_type: prop.type,
          city: prop.city,
          area: prop.area,
          bedrooms: prop.beds,
          bathrooms: prop.baths,
          area_sqft: prop.sqft
        }
      };
    });
  };

  const displayPosts = posts.length > 0 ? posts : generateSamplePosts(feedType);

  if (loading && posts.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-[#7B9681] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="snap-container scrollbar-hide bg-black"
      data-testid="property-feed"
    >
      {displayPosts.map((post, index) => (
        <FeedItem 
          key={post.id} 
          post={post} 
          index={index}
        />
      ))}
    </div>
  );
};

export default PropertyFeed;
