import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Crown, BadgeCheck, Grid, Bookmark, MapPin, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI, usersAPI } from '../services/api';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [isAuthenticated, navigate]);

  const fetchUserData = async () => {
    try {
      const [postsRes] = await Promise.all([
        postsAPI.getByUser(user._id || user.id)
      ]);
      setPosts(postsRes.data);
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
          <div className="flex gap-8 mb-4">
            <div className="text-center">
              <p className="font-bold text-lg">{posts.length}</p>
              <p className="text-xs text-gray-500">Posts</p>
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
        <Tabs defaultValue="posts">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1" data-testid="tab-posts">
              <Grid className="w-4 h-4 mr-2" /> Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1" data-testid="tab-saved">
              <Bookmark className="w-4 h-4 mr-2" /> Saved
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="saved" className="mt-4">
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Saved posts will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
