import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Crown, BadgeCheck, Grid, Bookmark, MapPin, Edit2, Heart, Star, Home, Camera, Plus, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI, wishlistAPI, placesStayedAPI } from '../services/api';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AddPlaceStayedModal from './AddPlaceStayedModal';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [placesStayed, setPlacesStayed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showAddPlace, setShowAddPlace] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [isAuthenticated, navigate]);

  const fetchUserData = async () => {
    try {
      const userId = user._id || user.id;
      const [postsRes, wishlistRes, placesRes] = await Promise.all([
        postsAPI.getByUser(userId),
        wishlistAPI.getAll(),
        placesStayedAPI.getByUser(userId)
      ]);
      setPosts(postsRes.data);
      setWishlist(wishlistRes.data);
      setPlacesStayed(placesRes.data);
    } catch (e) {
      console.error('Error fetching user data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handlePlaceAdded = (newPlace) => {
    setPlacesStayed(prev => [newPlace, ...prev]);
    setShowAddPlace(false);
  };

  if (!user) {
    return null;
  }

  const getRoleColor = () => {
    switch (user.role) {
      case 'buyer': return 'border-[#7B9681]';
      case 'seller': return 'border-[#C89F82]';
      case 'agent': return 'border-[#4A90E2]';
      default: return 'border-gray-300';
    }
  };

  const getRoleBadge = () => {
    switch (user.role) {
      case 'buyer': return <span className="badge-buyer px-3 py-1 rounded-full text-xs font-bold uppercase">Explorer</span>;
      case 'seller': return <span className="badge-seller px-3 py-1 rounded-full text-xs font-bold uppercase">Vendor</span>;
      case 'agent': return <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Agent</span>;
      default: return null;
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="profile-page">
      {/* Header */}
      <div className={`bg-gradient-to-b ${
        user.role === 'buyer' ? 'from-[#7B9681]/20' : 
        user.role === 'seller' ? 'from-[#C89F82]/20' : 
        'from-[#4A90E2]/20'
      } to-transparent pt-6 pb-4 px-4`}>
        <div className="flex justify-between items-start mb-4">
          <h1 className="font-outfit text-xl font-semibold">Profile</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/messages')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
              data-testid="messages-btn"
            >
              <MessageCircle className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => navigate('/settings')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full border-4 ${getRoleColor()} overflow-hidden mb-4`}>
            <img
              src={user.profile_image || `https://ui-avatars.com/api/?name=${user.name}&background=7B9681&color=fff&size=200`}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-outfit text-xl font-bold">{user.name}</h2>
            {user.is_verified && <BadgeCheck className="w-5 h-5 text-[#4A90E2]" />}
            {user.is_pro && (
              <span className="badge-pro px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" /> PRO
              </span>
            )}
          </div>

          <p className="text-gray-500 text-sm mb-2">{user.email}</p>
          
          <div className="flex items-center gap-2 mb-4">
            {getRoleBadge()}
          </div>

          {user.bio && (
            <p className="text-center text-sm text-gray-600 mb-4 max-w-xs">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-6 mb-4">
            <div className="text-center">
              <p className="font-bold text-lg">{posts.length}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{placesStayed.length}</p>
              <p className="text-xs text-gray-500">Places</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{user.followers_count || 0}</p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{user.following_count || 0}</p>
              <p className="text-xs text-gray-500">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full max-w-xs">
            <Button 
              variant="outline" 
              className="flex-1 border-[#7B9681] text-[#7B9681]"
              onClick={() => navigate('/edit-profile')}
              data-testid="edit-profile-btn"
            >
              <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
            {!user.is_pro && (
              <Button 
                className="flex-1 bg-[#E5B95C] hover:bg-[#d4a84b] text-white"
                onClick={() => navigate('/pro')}
                data-testid="upgrade-pro-btn"
              >
                <Crown className="w-4 h-4 mr-2" /> Go PRO
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="posts" className="flex-1" data-testid="tab-posts">
              <Grid className="w-4 h-4 mr-1" /> Posts
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex-1" data-testid="tab-wishlist">
              <Heart className="w-4 h-4 mr-1" /> Wishlist
            </TabsTrigger>
            <TabsTrigger value="places" className="flex-1" data-testid="tab-places">
              <Home className="w-4 h-4 mr-1" /> Places
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <Grid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet</p>
                <Button 
                  className="mt-4 bg-[#7B9681] hover:bg-[#65806B]"
                  onClick={() => navigate('/create')}
                >
                  Create your first post
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                    data-testid={`post-grid-${post.id}`}
                  >
                    {post.media_urls?.[0] ? (
                      <img 
                        src={post.media_urls[0]} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#E5EBE6]">
                        <MapPin className="w-8 h-8 text-[#7B9681]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist" className="mt-4">
            {wishlist.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved properties yet</p>
                <p className="text-sm text-gray-400 mt-1">Tap the heart on properties you love</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlist.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white rounded-xl p-3 flex gap-3 shadow-sm"
                    data-testid={`wishlist-${item.id}`}
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.property_image ? (
                        <img src={item.property_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{item.property_title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {item.property_city}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-[#7B9681]">
                          £{item.property_price?.toLocaleString()}
                          {item.listing_type === 'rent' && <span className="text-xs font-normal">/mo</span>}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          item.listing_type === 'buy' ? 'bg-[#7B9681] text-white' : 'bg-[#4A90E2] text-white'
                        }`}>
                          {item.listing_type === 'buy' ? 'Sale' : 'Rent'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Places Stayed Tab */}
          <TabsContent value="places" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Places I've Stayed</h3>
              <Button 
                size="sm" 
                className="bg-[#7B9681] hover:bg-[#65806B]"
                onClick={() => setShowAddPlace(true)}
                data-testid="add-place-btn"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Place
              </Button>
            </div>

            {placesStayed.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Share your rental experiences!</p>
                <p className="text-sm text-gray-400 mt-1">Add places you've stayed at - Airbnbs, rentals, hotels</p>
                <Button 
                  className="mt-4 bg-[#7B9681] hover:bg-[#65806B]"
                  onClick={() => setShowAddPlace(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Your First Place
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {placesStayed.map((place) => (
                  <div 
                    key={place.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm"
                    data-testid={`place-${place.id}`}
                  >
                    {/* Photo Gallery */}
                    {place.photos?.length > 0 && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={place.photos[0]} 
                          alt={place.property_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{place.property_name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {place.location}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          place.property_type === 'airbnb' ? 'bg-pink-100 text-pink-600' :
                          place.property_type === 'rental' ? 'bg-blue-100 text-blue-600' :
                          place.property_type === 'hotel' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {place.property_type}
                        </span>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">{renderStars(place.rating)}</div>
                        <span className="text-sm text-gray-500">
                          {new Date(place.stay_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      {/* Review */}
                      <p className="text-sm text-gray-700 line-clamp-3">{place.review}</p>
                      
                      {/* Would Recommend */}
                      {place.would_recommend && (
                        <div className="mt-3 flex items-center gap-1 text-[#7B9681] text-sm">
                          <Heart className="w-4 h-4 fill-current" />
                          <span>Would recommend</span>
                        </div>
                      )}
                      
                      {/* Likes */}
                      <div className="mt-3 pt-3 border-t flex items-center gap-2 text-gray-500 text-sm">
                        <Heart className="w-4 h-4" />
                        <span>{place.likes || 0} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Place Modal */}
      <AddPlaceStayedModal 
        isOpen={showAddPlace}
        onClose={() => setShowAddPlace(false)}
        onPlaceAdded={handlePlaceAdded}
      />
    </div>
  );
};

export default ProfilePage;
