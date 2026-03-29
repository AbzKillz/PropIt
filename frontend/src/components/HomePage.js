import React, { useState } from 'react';
import PropertyFeed from './PropertyFeed';
import BottomNav from './BottomNav';

const HomePage = () => {
  const [feedType, setFeedType] = useState('foryou');

  const tabs = [
    { id: 'following', label: 'Following' },
    { id: 'foryou', label: 'For You' },
    { id: 'move', label: 'Move' },
    { id: 'buysell', label: 'Buy/Sell' }
  ];

  return (
    <div className="relative h-screen w-full bg-black" data-testid="home-page">
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
