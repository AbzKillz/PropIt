import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, MapPin, X, Upload, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI, propertiesAPI, filesAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const CreatePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('post');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Post form state
  const [postData, setPostData] = useState({
    content: '',
    tags: ''
  });

  // Property form state
  const [propertyData, setPropertyData] = useState({
    title: '',
    description: '',
    price: '',
    property_type: 'house',
    listing_type: 'buy',
    bedrooms: '',
    bathrooms: '',
    area_sqft: '',
    address: '',
    city: '',
    postcode: '',
    features: ''
  });

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const { data } = await filesAPI.upload(file);
          return { id: data.id, path: data.path, url: data.url, name: file.name };
        })
      );
      setUploadedFiles(prev => [...prev, ...uploads]);
    } catch (e) {
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postData.content.trim()) {
      setError('Please add some content');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tags = postData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const mediaUrls = uploadedFiles.map(f => f.path);

      await postsAPI.create({
        content: postData.content,
        tags,
        media_urls: mediaUrls
      });

      navigate('/');
    } catch (e) {
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    if (!propertyData.title || !propertyData.price || !propertyData.city) {
      setError('Please fill in required fields');
      return;
    }

    if (user.role === 'buyer') {
      setError('Only sellers and agents can list properties');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const features = propertyData.features.split(',').map(f => f.trim()).filter(Boolean);
      const images = uploadedFiles.map(f => f.path);

      const property = await propertiesAPI.create({
        ...propertyData,
        price: parseFloat(propertyData.price),
        bedrooms: parseInt(propertyData.bedrooms) || 0,
        bathrooms: parseInt(propertyData.bathrooms) || 0,
        area_sqft: parseInt(propertyData.area_sqft) || 0,
        features,
        images
      });

      // Also create a post for the property
      await postsAPI.create({
        content: `${propertyData.title} - ${propertyData.description}`,
        property_id: property.data.id,
        media_urls: images,
        tags: [propertyData.listing_type, propertyData.property_type, propertyData.city.toLowerCase()]
      });

      navigate('/');
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to list property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="create-page">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 p-4 border-b">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-outfit text-xl font-semibold">Create</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Pro Badge */}
      {user?.is_pro && (
        <div className="mx-4 mt-4 p-3 bg-[#FCF5E3] rounded-xl flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#E5B95C]" />
          <span className="text-sm font-medium text-[#E5B95C]">
            Your posts will be featured as a PRO member
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="post" className="flex-1" data-testid="tab-post">
              Post
            </TabsTrigger>
            <TabsTrigger 
              value="property" 
              className="flex-1" 
              data-testid="tab-property"
              disabled={user?.role === 'buyer'}
            >
              List Property
            </TabsTrigger>
          </TabsList>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* File Upload */}
          <div className="mt-4">
            <Label>Media</Label>
            <div className="mt-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                {uploading ? (
                  <div className="w-8 h-8 border-3 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload images or videos</span>
                  </>
                )}
              </label>
            </div>

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="relative group">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post Tab */}
          <TabsContent value="post">
            <form onSubmit={handlePostSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="content">What's on your mind?</Label>
                <Textarea
                  id="content"
                  value={postData.content}
                  onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your property story, tips, or market insights..."
                  rows={4}
                  data-testid="post-content"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={postData.tags}
                  onChange={(e) => setPostData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="property, london, investment"
                  data-testid="post-tags"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#7B9681] hover:bg-[#65806B]"
                disabled={loading}
                data-testid="submit-post-btn"
              >
                {loading ? 'Posting...' : 'Share Post'}
              </Button>
            </form>
          </TabsContent>

          {/* Property Tab */}
          <TabsContent value="property">
            <form onSubmit={handlePropertySubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    value={propertyData.title}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Beautiful 3-bed Victorian House"
                    data-testid="property-title"
                  />
                </div>

                <div>
                  <Label>Listing Type</Label>
                  <Select 
                    value={propertyData.listing_type} 
                    onValueChange={(v) => setPropertyData(prev => ({ ...prev, listing_type: v }))}
                  >
                    <SelectTrigger data-testid="listing-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                      <SelectItem value="sell">Looking to Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Property Type</Label>
                  <Select 
                    value={propertyData.property_type} 
                    onValueChange={(v) => setPropertyData(prev => ({ ...prev, property_type: v }))}
                  >
                    <SelectTrigger data-testid="property-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="price">Price * {propertyData.listing_type === 'rent' && '(per month)'}</Label>
                  <Input
                    id="price"
                    type="number"
                    value={propertyData.price}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="500000"
                    data-testid="property-price"
                  />
                </div>

                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={propertyData.bedrooms}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: e.target.value }))}
                    placeholder="3"
                    data-testid="property-bedrooms"
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={propertyData.bathrooms}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: e.target.value }))}
                    placeholder="2"
                    data-testid="property-bathrooms"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="area_sqft">Area (sqft)</Label>
                  <Input
                    id="area_sqft"
                    type="number"
                    value={propertyData.area_sqft}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, area_sqft: e.target.value }))}
                    placeholder="1500"
                    data-testid="property-area"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={propertyData.address}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 High Street"
                    data-testid="property-address"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={propertyData.city}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="London"
                    data-testid="property-city"
                  />
                </div>

                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={propertyData.postcode}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, postcode: e.target.value }))}
                    placeholder="SW1 1AA"
                    data-testid="property-postcode"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={propertyData.description}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your property..."
                    rows={3}
                    data-testid="property-description"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="features">Features (comma separated)</Label>
                  <Input
                    id="features"
                    value={propertyData.features}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, features: e.target.value }))}
                    placeholder="Garden, Parking, Modern Kitchen"
                    data-testid="property-features"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#7B9681] hover:bg-[#65806B]"
                disabled={loading}
                data-testid="submit-property-btn"
              >
                {loading ? 'Listing...' : 'List Property'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatePage;
