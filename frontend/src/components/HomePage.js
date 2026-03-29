import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropertyFeed from './PropertyFeed';
import BottomNav from './BottomNav';

const HomePage = () => {
  const navigate = useNavigate();
  const [feedType, setFeedType] = useState('foryou');
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const tabs = [
    { id: 'following', label: 'Following' },
    { id: 'foryou', label: 'For You' },
    { id: 'move', label: 'Move' },
    { id: 'buysell', label: 'Buy/Sell' }
  ];

  const navPages = ['/', '/search', '/create', '/places', '/profile'];

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    // Only trigger if horizontal swipe is dominant and significant
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const currentTabIndex = tabs.findIndex(t => t.id === feedType);
      
      if (deltaX < 0) {
        // Swipe left - next tab
        if (currentTabIndex < tabs.length - 1) {
          setFeedType(tabs[currentTabIndex + 1].id);
        } else {
          // At last tab, go to next page (Search)
          navigate('/search');
        }
      } else {
        // Swipe right - previous tab
        if (currentTabIndex > 0) {
          setFeedType(tabs[currentTabIndex - 1].id);
        }
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  }, [feedType, tabs, navigate]);

  return (
    <div 
      className="relative h-screen w-full bg-black" 
      data-testid="home-page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-center items-center z-20 safe-top" data-testid="feed-nav">
        <div className="flex gap-4 bg-black/30 backdrop-blur-md rounded-full px-4 py-2">
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.id}>
              {index > 0 && <span className="text-white/40">|</span>}
              <button 
                onClick={() => setFeedType(tab.id)}
                className={`text-sm font-semibold transition-all ${
                  feedType === tab.id 
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white/80'
                }`}
                data-testid={`feed-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Property Feed */}
      <PropertyFeed feedType={feedType} />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default HomePage;
