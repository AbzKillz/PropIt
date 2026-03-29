import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Search as SearchIcon } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { areasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SAMPLE_AREAS = [
  { id: 'london', name: 'London', city: 'London', postcode: 'SW1', followers_count: 15420 },
  { id: 'manchester', name: 'Manchester City Centre', city: 'Manchester', postcode: 'M1', followers_count: 8230 },
  { id: 'birmingham', name: 'Birmingham', city: 'Birmingham', postcode: 'B1', followers_count: 6150 },
  { id: 'leeds', name: 'Leeds', city: 'Leeds', postcode: 'LS1', followers_count: 4890 },
  { id: 'bristol', name: 'Bristol', city: 'Bristol', postcode: 'BS1', followers_count: 5620 },
  { id: 'edinburgh', name: 'Edinburgh', city: 'Edinburgh', postcode: 'EH1', followers_count: 4210 }
];

const SearchPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [areas, setAreas] = useState(SAMPLE_AREAS);
  const [loading, setLoading] = useState(false);
  const [followedAreas, setFollowedAreas] = useState([]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setAreas(SAMPLE_AREAS);
      return;
    }

    setLoading(true);
    try {
      const { data } = await areasAPI.getAll({ search: searchQuery });
      setAreas(data.length > 0 ? data : SAMPLE_AREAS.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } catch (e) {
      console.error('Search error:', e);
      setAreas(SAMPLE_AREAS.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (areaId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await areasAPI.follow(areaId);
      if (data.following) {
        setFollowedAreas(prev => [...prev, areaId]);
      } else {
        setFollowedAreas(prev => prev.filter(id => id !== areaId));
      }
    } catch (e) {
      console.error('Follow error:', e);
      // Toggle locally for demo
      setFollowedAreas(prev => 
        prev.includes(areaId) 
          ? prev.filter(id => id !== areaId)
          : [...prev, areaId]
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="search-page">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 p-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-outfit text-xl font-semibold">Explore Areas</h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search areas, cities, postcodes..."
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Button type="submit" className="bg-[#7B9681] hover:bg-[#65806B]" data-testid="search-btn">
            Search
          </Button>
        </form>
      </div>

      {/* Results */}
      <div className="p-4">
        <h2 className="font-outfit font-semibold text-lg mb-4">
          {searchQuery ? 'Search Results' : 'Popular Areas'}
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {areas.map((area) => (
              <div 
                key={area.id}
                className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm"
                data-testid={`area-${area.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#E5EBE6] rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#7B9681]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{area.name}</h3>
                    <p className="text-sm text-gray-500">
                      {area.city} • {area.postcode} • {area.followers_count?.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleFollow(area.id)}
                  variant={followedAreas.includes(area.id) ? 'outline' : 'default'}
                  className={followedAreas.includes(area.id) 
                    ? 'border-[#7B9681] text-[#7B9681]' 
                    : 'bg-[#7B9681] hover:bg-[#65806B]'
                  }
                  data-testid={`follow-area-${area.id}`}
                >
                  {followedAreas.includes(area.id) ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
