import React, { useState } from 'react';
import { X, Star, Upload, MapPin, Calendar, Camera } from 'lucide-react';
import { placesStayedAPI, filesAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const AddPlaceStayedModal = ({ isOpen, onClose, onPlaceAdded }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  
  const [formData, setFormData] = useState({
    property_name: '',
    location: '',
    stay_date: '',
    rating: 5,
    review: '',
    property_type: 'rental',
    would_recommend: true
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedPhotos = await Promise.all(
        files.slice(0, 5).map(async (file) => {
          const { data } = await filesAPI.upload(file);
          return data.path;
        })
      );
      setPhotos(prev => [...prev, ...uploadedPhotos].slice(0, 5));
    } catch (e) {
      setError('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.property_name || !formData.location || !formData.review) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await placesStayedAPI.create({
        ...formData,
        photos
      });
      onPlaceAdded(data);
      // Reset form
      setFormData({
        property_name: '',
        location: '',
        stay_date: '',
        rating: 5,
        review: '',
        property_type: 'rental',
        would_recommend: true
      });
      setPhotos([]);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to add place');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="add-place-modal">
        <DialogHeader>
          <DialogTitle className="font-outfit text-xl">Share a Place You've Stayed</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <Label>Photos (up to 5)</Label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#7B9681] transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">Add</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Property Name */}
          <div>
            <Label htmlFor="property_name">Property Name *</Label>
            <Input
              id="property_name"
              value={formData.property_name}
              onChange={(e) => setFormData(prev => ({ ...prev, property_name: e.target.value }))}
              placeholder="e.g., Cozy Loft in Shoreditch"
              data-testid="place-name-input"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., London, UK"
                className="pl-10"
                data-testid="place-location-input"
              />
            </div>
          </div>

          {/* Property Type & Stay Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Property Type</Label>
              <Select 
                value={formData.property_type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, property_type: v }))}
              >
                <SelectTrigger data-testid="place-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="hostel">Hostel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stay_date">When did you stay?</Label>
              <Input
                id="stay_date"
                type="month"
                value={formData.stay_date}
                onChange={(e) => setFormData(prev => ({ ...prev, stay_date: e.target.value }))}
                data-testid="place-date-input"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <Label>Your Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                  className="p-1"
                  data-testid={`rating-star-${star}`}
                >
                  <Star 
                    className={`w-8 h-8 transition-colors ${
                      star <= formData.rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review */}
          <div>
            <Label htmlFor="review">Your Review *</Label>
            <Textarea
              id="review"
              value={formData.review}
              onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
              placeholder="Share your experience... What did you love? What could be better?"
              rows={4}
              data-testid="place-review-input"
            />
          </div>

          {/* Would Recommend */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, would_recommend: !prev.would_recommend }))}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                formData.would_recommend 
                  ? 'bg-[#7B9681] border-[#7B9681] text-white' 
                  : 'border-gray-300'
              }`}
            >
              {formData.would_recommend && <span className="text-sm">✓</span>}
            </button>
            <Label className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, would_recommend: !prev.would_recommend }))}>
              I would recommend this place
            </Label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-[#7B9681] hover:bg-[#65806B]"
              disabled={loading}
              data-testid="submit-place-btn"
            >
              {loading ? 'Sharing...' : 'Share Experience'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaceStayedModal;
