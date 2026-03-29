import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Crown, Grid, MapPin, MessageCircle, UserPlus, UserMinus, Star, Heart, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, postsAPI, placesStayedAPI } from '../services/api';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import BottomNav from './BottomNav';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [placesStayed, setPlacesStayed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = currentUser && (currentUser._id === userId || currentUser.id === userId);

  useEffect(() => {
    if (isOwnProfile) {
      navigate('/profile');
      return;
    }
    fetchUserData();
  }, [userId, isOwnProfile, navigate]);

  const fetchUserData = async () => {
    try {
      const [profileRes, postsRes, placesRes] = await Promise.all([
        usersAPI.getProfile(userId),
        postsAPI.getByUser(userId),
        placesStayedAPI.getByUser(userId)
      ]);
      setProfile(profileRes.data);
      setPosts(postsRes.data);
      setPlacesStayed(placesRes.data);
    } catch (e) {
      console.error('Error fetching user data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await usersAPI.follow(userId);
      setFollowing(data.following);
      setProfile(prev => ({
        ...prev,
        followers_count: data.following ? prev.followers_count + 1 : prev.followers_count - 1
      }));
    } catch (e) {
      console.error('Error following user:', e);
    }
  };

  const handleMessage = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/messages/new/${userId}`);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'buyer': return 'border-[#7B9681]';
      case 'seller': return 'border-[#C89F82]';
      case 'agent': return 'border-[#4A90E2]';
      default: return 'border-gray-300';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9F7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F7F9F7] flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">User not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="user-profile-page">
      {/* Header */}
      <div className={`bg-gradient-to-b ${
        profile.role === 'buyer' ? 'from-[#7B9681]/20' : 
        profile.role === 'seller' ? 'from-[#C89F82]/20' : 
        'from-[#4A90E2]/20'
      } to-transparent pt-6 pb-4 px-4`}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-outfit text-xl font-semibold">{profile.name}</h1>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full border-4 ${getRoleColor(profile.role)} overflow-hidden mb-4`}>
            <img
              src={profile.profile_image || `https://ui-avatars.com/api/?name=${profile.name}&background=7B9681&color=fff&size=200`}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-outfit text-xl font-bold">{profile.name}</h2>
            {profile.is_verified && <BadgeCheck className="w-5 h-5 text-[#4A90E2]" />}
            {profile.is_pro && (
              <span className="badge-pro px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" /> PRO
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            {getRoleBadge(profile.role)}
          </div>

          {profile.bio && (
            <p className="text-center text-sm text-gray-600 mb-4 max-w-xs">{profile.bio}</p>
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
              <p className="font-bold text-lg">{profile.followers_count || 0}</p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{profile.following_count || 0}</p>
              <p className="text-xs text-gray-500">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full max-w-xs">
            <Button 
              onClick={handleFollow}
              variant={following ? 'outline' : 'default'}
              className={`flex-1 ${following ? 'border-[#7B9681] text-[#7B9681]' : 'bg-[#7B9681] hover:bg-[#65806B]'}`}
              data-testid="follow-btn"
            >
              {following ? (
                <><UserMinus className="w-4 h-4 mr-2" /> Following</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Follow</>
              )}
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-gray-300"
              onClick={handleMessage}
              data-testid="message-btn"
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Message
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="posts" className="flex-1">
              <Grid className="w-4 h-4 mr-1" /> Posts
            </TabsTrigger>
            <TabsTrigger value="places" className="flex-1">
              <Home className="w-4 h-4 mr-1" /> Places
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <Grid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
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

          {/* Places Tab */}
          <TabsContent value="places" className="mt-4">
            {placesStayed.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No places shared yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {placesStayed.map((place) => (
                  <div 
                    key={place.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm"
                  >
                    {place.photos?.length > 0 && (
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={place.photos[0]} 
                          alt={place.property_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold">{place.property_name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {place.location}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex">{renderStars(place.rating)}</div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">{place.review}</p>
                      {place.would_recommend && (
                        <div className="mt-2 flex items-center gap-1 text-[#7B9681] text-sm">
                          <Heart className="w-4 h-4 fill-current" />
                          <span>Would recommend</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default UserProfilePage;
