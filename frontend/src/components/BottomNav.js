import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, PlusSquare, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { isAuthenticated } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/create', icon: PlusSquare, label: 'Post', requireAuth: true },
    { path: '/activity', icon: Bell, label: 'Activity', requireAuth: true },
    { path: isAuthenticated ? '/profile' : '/login', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50" data-testid="bottom-nav">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          if (item.requireAuth && !isAuthenticated) {
            return (
              <NavLink
                key={item.path}
                to="/login"
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#7B9681] transition-colors"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-xs">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-[#7B9681]' : 'text-gray-400 hover:text-[#7B9681]'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              {({ isActive }) => (
                <>
                  {item.label === 'Post' ? (
                    <div className="w-10 h-10 bg-[#7B9681] rounded-xl flex items-center justify-center -mt-4 shadow-lg">
                      <item.icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                  ) : (
                    <item.icon 
                      className="w-6 h-6" 
                      strokeWidth={isActive ? 2 : 1.5}
                      fill={isActive ? 'currentColor' : 'none'}
                    />
                  )}
                  <span className={`text-xs ${item.label === 'Post' ? '-mt-1' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
