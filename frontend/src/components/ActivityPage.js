import React from 'react';
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';

const ActivityPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Sample activities for demo
  const activities = [
    {
      id: 1,
      type: 'like',
      user: 'Sarah Estate',
      action: 'liked your post',
      time: '2h ago',
      image: 'https://images.pexels.com/photos/17174768/pexels-photo-17174768.jpeg?auto=compress&cs=tinysrgb&w=100'
    },
    {
      id: 2,
      type: 'follow',
      user: 'James Property',
      action: 'started following you',
      time: '5h ago'
    },
    {
      id: 3,
      type: 'comment',
      user: 'Emma Homes',
      action: 'commented on your listing',
      content: 'Beautiful property! Is it still available?',
      time: '1d ago'
    },
    {
      id: 4,
      type: 'like',
      user: 'PropGram Pro',
      action: 'liked your property listing',
      time: '2d ago',
      image: 'https://images.pexels.com/photos/6970049/pexels-photo-6970049.jpeg?auto=compress&cs=tinysrgb&w=100'
    }
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-[#7B9681]" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-[#4A90E2]" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="activity-page">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 p-4 border-b">
        <h1 className="font-outfit text-xl font-semibold">Activity</h1>
      </div>

      {/* Activities List */}
      <div className="p-4 space-y-3">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm"
            data-testid={`activity-${activity.id}`}
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{activity.user}</span>{' '}
                <span className="text-gray-600">{activity.action}</span>
              </p>
              {activity.content && (
                <p className="text-sm text-gray-500 mt-1 truncate">{activity.content}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
            </div>
            {activity.image && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img src={activity.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default ActivityPage;
