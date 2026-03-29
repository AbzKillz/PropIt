import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, BadgeCheck, Crown, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storiesAPI } from '../services/api';

const StoriesBar = ({ onCreateStory }) => {
  const { user, isAuthenticated } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (activeStory) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [activeStory, activeStoryIndex]);

  const fetchStories = async () => {
    try {
      const { data } = await storiesAPI.getAll();
      setStoryGroups(data);
    } catch (e) {
      console.error('Error fetching stories:', e);
    }
  };

  const handleStoryClick = async (group) => {
    setActiveStory(group);
    setActiveStoryIndex(0);
    setProgress(0);
    
    // Mark as viewed
    if (group.stories[0]) {
      try {
        await storiesAPI.view(group.stories[0].id);
      } catch (e) {}
    }
  };

  const handleNextStory = async () => {
    if (!activeStory) return;
    
    if (activeStoryIndex < activeStory.stories.length - 1) {
      const nextIndex = activeStoryIndex + 1;
      setActiveStoryIndex(nextIndex);
      setProgress(0);
      try {
        await storiesAPI.view(activeStory.stories[nextIndex].id);
      } catch (e) {}
    } else {
      // Move to next group
      const currentGroupIndex = storyGroups.findIndex(g => g.author_id === activeStory.author_id);
      if (currentGroupIndex < storyGroups.length - 1) {
        const nextGroup = storyGroups[currentGroupIndex + 1];
        setActiveStory(nextGroup);
        setActiveStoryIndex(0);
        setProgress(0);
        try {
          await storiesAPI.view(nextGroup.stories[0].id);
        } catch (e) {}
      } else {
        setActiveStory(null);
      }
    }
  };

  const handlePrevStory = () => {
    if (!activeStory) return;
    
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Move to previous group
      const currentGroupIndex = storyGroups.findIndex(g => g.author_id === activeStory.author_id);
      if (currentGroupIndex > 0) {
        const prevGroup = storyGroups[currentGroupIndex - 1];
        setActiveStory(prevGroup);
        setActiveStoryIndex(prevGroup.stories.length - 1);
        setProgress(0);
      }
    }
  };

  const getRoleBorderColor = (role) => {
    switch (role) {
      case 'buyer': return 'from-[#7B9681] to-[#5a7d61]';
      case 'seller': return 'from-[#C89F82] to-[#a87d62]';
      case 'agent': return 'from-[#4A90E2] to-[#2a70c2]';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <>
      {/* Stories Bar */}
      <div className="bg-white border-b py-3 px-4 overflow-x-auto scrollbar-hide" data-testid="stories-bar">
        <div className="flex gap-4">
          {/* Add Story Button */}
          {isAuthenticated && (
            <button 
              onClick={onCreateStory}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              data-testid="add-story-btn"
            >
              <div className="w-16 h-16 rounded-full bg-[#E5EBE6] flex items-center justify-center relative">
                {user?.profile_image ? (
                  <img 
                    src={user.profile_image}
                    alt="Your story"
                    className="w-full h-full rounded-full object-cover opacity-50"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-[#7B9681] rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-600">Your story</span>
            </button>
          )}

          {/* Story Groups */}
          {storyGroups.map((group) => (
            <button
              key={group.author_id}
              onClick={() => handleStoryClick(group)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              data-testid={`story-${group.author_id}`}
            >
              <div className={`w-16 h-16 rounded-full p-0.5 bg-gradient-to-br ${
                group.has_unseen ? getRoleBorderColor(group.author_role) : 'from-gray-200 to-gray-300'
              }`}>
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <img
                    src={group.author_image || `https://ui-avatars.com/api/?name=${group.author_name}&background=7B9681&color=fff`}
                    alt={group.author_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs text-gray-600 truncate max-w-[64px]">
                {group.author_name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer */}
      {activeStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" data-testid="story-viewer">
          <div className="relative w-full h-full max-w-lg mx-auto">
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {activeStory.stories.map((_, index) => (
                <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100"
                    style={{ 
                      width: index < activeStoryIndex ? '100%' : 
                             index === activeStoryIndex ? `${progress}%` : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full border-2 ${
                  activeStory.author_role === 'buyer' ? 'border-[#7B9681]' :
                  activeStory.author_role === 'agent' ? 'border-[#4A90E2]' : 'border-[#C89F82]'
                } overflow-hidden`}>
                  <img
                    src={activeStory.author_image || `https://ui-avatars.com/api/?name=${activeStory.author_name}&background=7B9681&color=fff`}
                    alt={activeStory.author_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{activeStory.author_name}</span>
                    {activeStory.author_role === 'agent' && <BadgeCheck className="w-4 h-4 text-[#4A90E2]" />}
                    {activeStory.is_pro && <Crown className="w-4 h-4 text-[#E5B95C]" />}
                  </div>
                  <span className="text-white/60 text-xs">
                    {new Date(activeStory.stories[activeStoryIndex]?.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Story Content */}
            <div className="w-full h-full">
              <img
                src={activeStory.stories[activeStoryIndex]?.media_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* Caption */}
            {activeStory.stories[activeStoryIndex]?.caption && (
              <div className="absolute bottom-20 left-4 right-4 z-10">
                <p className="text-white text-sm bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                  {activeStory.stories[activeStoryIndex].caption}
                </p>
              </div>
            )}

            {/* Location */}
            {activeStory.stories[activeStoryIndex]?.location && (
              <div className="absolute bottom-32 left-4 z-10">
                <span className="text-white/80 text-xs flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                  <MapPin className="w-3 h-3" />
                  {activeStory.stories[activeStoryIndex].location}
                </span>
              </div>
            )}

            {/* Navigation */}
            <button
              onClick={handlePrevStory}
              className="absolute left-0 top-0 w-1/3 h-full"
            />
            <button
              onClick={handleNextStory}
              className="absolute right-0 top-0 w-2/3 h-full"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default StoriesBar;
