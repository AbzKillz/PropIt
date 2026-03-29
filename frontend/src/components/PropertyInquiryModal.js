import React, { useState } from 'react';
import { Send, Phone, Mail, MessageCircle } from 'lucide-react';
import { inquiriesAPI } from '../services/api';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const PropertyInquiryModal = ({ isOpen, onClose, property }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [contactPreference, setContactPreference] = useState('message');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await inquiriesAPI.create({
        property_id: property.id,
        message: message.trim(),
        contact_preference: contactPreference
      });
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setMessage('');
    setError('');
    onClose();
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" data-testid="inquiry-success">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#E5EBE6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-[#7B9681]" />
            </div>
            <h2 className="font-outfit text-xl font-bold mb-2">Inquiry Sent!</h2>
            <p className="text-gray-500 mb-6">
              The {property?.owner_role === 'agent' ? 'agent' : 'owner'} will get back to you soon.
            </p>
            <Button onClick={handleClose} className="bg-[#7B9681] hover:bg-[#65806B]">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="inquiry-modal">
        <DialogHeader>
          <DialogTitle className="font-outfit text-xl">Request Viewing</DialogTitle>
        </DialogHeader>

        <div className="mt-2 mb-4 p-3 bg-[#E5EBE6] rounded-lg">
          <p className="font-semibold text-sm">{property?.title}</p>
          <p className="text-xs text-gray-600">
            £{property?.price?.toLocaleString()}
            {property?.listing_type === 'rent' && '/mo'} • {property?.city}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <Label>How would you like to be contacted?</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { value: 'message', icon: MessageCircle, label: 'Message' },
                { value: 'email', icon: Mail, label: 'Email' },
                { value: 'phone', icon: Phone, label: 'Phone' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setContactPreference(option.value)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    contactPreference === option.value
                      ? 'border-[#7B9681] bg-[#E5EBE6]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option.icon className={`w-5 h-5 ${
                    contactPreference === option.value ? 'text-[#7B9681]' : 'text-gray-400'
                  }`} />
                  <span className={`text-xs font-medium ${
                    contactPreference === option.value ? 'text-[#7B9681]' : 'text-gray-500'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'm interested in this property. Is it still available? I'd love to schedule a viewing..."
              rows={4}
              data-testid="inquiry-message"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-[#7B9681] hover:bg-[#65806B]"
              disabled={loading}
              data-testid="send-inquiry-btn"
            >
              {loading ? 'Sending...' : 'Send Inquiry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyInquiryModal;
