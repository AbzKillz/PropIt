import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Heart, MessageCircle, Share2, Camera, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { placesStayedAPI } from '../services/api';
import { Button } from './ui/button';
import BottomNav from './BottomNav';

const PlacesFeedPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const { data } = await placesStayedAPI.getFeed();
      setPlaces(data);
    } catch (e) {
      console.error('Error fetching places:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (placeId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      const { data } = await placesStayedAPI.like(placeId);
      setPlaces(prev => prev.map(p => 
        p.id === placeId 
          ? { ...p, likes: data.liked ? p.likes + 1 : p.likes - 1, isLiked: data.liked }
          : p
      ));
    } catch (e) {
      console.error('Error liking place:', e);
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

  const getRoleBorderColor = (role) => {
    switch (role) {
      case 'buyer': return 'border-[#7B9681]';
      case 'seller': return 'border-[#C89F82]';
      case 'agent': return 'border-[#4A90E2]';
      default: return 'border-gray-300';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'airbnb': return 'bg-pink-100 text-pink-600';
      case 'rental': return 'bg-blue-100 text-blue-600';
      case 'hotel': return 'bg-purple-100 text-purple-600';
      case 'hostel': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Sample data for empty state
  const SAMPLE_PLACES = [
    {
      id: 'sample-1',
      user_name: 'Alex Explorer',
      user_role: 'buyer',
      user_image: '',
      property_name: 'Charming Loft in Shoreditch',
      location: 'London, UK',
      stay_date: '2025-12-01',
      rating: 5,
      review: 'Amazing location! Right in the heart of Shoreditch with amazing coffee shops and bars nearby. The host was super responsive and the loft had everything I needed. Would definitely stay again!',
      photos: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600'],
      property_type: 'airbnb',
      would_recommend: true,
      likes: 42
    },
    {
      id: 'sample-2',
      user_name: 'Jessica Hunt',
      user_role: 'buyer',
      user_image: '',
      property_name: 'Modern Studio with City Views',
      location: 'Manchester, UK',
      stay_date: '2025-11-15',
      rating: 4,
      review: 'Great little studio perfect for a weekend getaway. The views of the city were stunning, especially at night. Only downside was the lift was sometimes slow.',
      photos: ['https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=600'],
      property_type: 'rental',
      would_recommend: true,
      likes: 28
    },
    {
      id: 'sample-3',
      user_name: 'Ryan Seeker',
      user_role: 'buyer',
      user_image: '',
      property_name: 'Cozy Cottage in the Cotswolds',
      location: 'Bourton-on-the-Water, UK',
      stay_date: '2025-10-20',
      rating: 5,
      review: 'A truly magical stay! The cottage was picture-perfect with a roaring fire and beautiful garden. We spent hours exploring the local villages. This is what English countryside living is all about!',
      photos: ['https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=600'],
      property_type: 'airbnb',
      would_recommend: true,
      likes: 67
    }
  ];

  const displayPlaces = places.length > 0 ? places : SAMPLE_PLACES;

  return (
    <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="places-feed-page">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-600">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-outfit text-xl font-semibold">Places People Stayed</h1>
              <p className="text-xs text-gray-500">Real reviews from the community</p>
            </div>
          </div>
          {isAuthenticated && (
            <Button 
              size="sm"
              className="bg-[#7B9681] hover:bg-[#65806B]"
              onClick={() => navigate('/profile')}
            >
              <Plus className="w-4 h-4 mr-1" /> Share
            </Button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          displayPlaces.map((place) => (
            <div 
              key={place.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
              data-testid={`place-card-${place.id}`}
            >
              {/* User Header */}
              <div className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full border-2 ${getRoleBorderColor(place.user_role)} overflow-hidden`}>
                  <img
                    src={place.user_image || `https://ui-avatars.com/api/?name=${place.user_name}&background=7B9681&color=fff`}
                    alt={place.user_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{place.user_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      place.user_role === 'buyer' ? 'badge-buyer' : 'badge-seller'
                    }`}>
                      Explorer
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Stayed {new Date(place.stay_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(place.property_type)}`}>
                  {place.property_type}
                </span>
              </div>

              {/* Photo */}
              {place.photos?.length > 0 && (
                <div className="aspect-video">
                  <img 
                    src={place.photos[0]} 
                    alt={place.property_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{place.property_name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-4 h-4" /> {place.location}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">{renderStars(place.rating)}</div>
                  {place.would_recommend && (
                    <span className="text-xs text-[#7B9681] flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-current" /> Recommends
                    </span>
                  )}
                </div>

                {/* Review */}
                <p className="text-sm text-gray-700 leading-relaxed">{place.review}</p>

                {/* Actions */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                  <button 
                    onClick={() => handleLike(place.id)}
                    className={`flex items-center gap-2 text-sm ${place.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                    data-testid={`like-place-${place.id}`}
                  >
                    <Heart className={`w-5 h-5 ${place.isLiked ? 'fill-current' : ''}`} />
                    <span>{place.likes || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-gray-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>Comment</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-gray-500">
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default PlacesFeedPage;
