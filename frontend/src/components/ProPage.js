import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../services/api';
import { Button } from './ui/button';

const ProPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [sessionId]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      setPaymentStatus('timeout');
      return;
    }

    setCheckingPayment(true);
    try {
      const { data } = await paymentsAPI.getStatus(sessionId);
      if (data.payment_status === 'paid') {
        setPaymentStatus('success');
        // Refresh page after short delay to get updated user
        setTimeout(() => window.location.reload(), 2000);
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch (e) {
      setPaymentStatus('error');
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleSubscribe = async (packageId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await paymentsAPI.createCheckout(packageId);
      window.location.href = data.url;
    } catch (e) {
      console.error('Checkout error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (user?.is_pro) {
    return (
      <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="pro-page">
        <div className="bg-white p-4 border-b flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-outfit text-xl font-semibold">PropGram PRO</h1>
        </div>

        <div className="p-4 text-center mt-8">
          <div className="w-20 h-20 bg-[#FCF5E3] rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-[#E5B95C]" />
          </div>
          <h2 className="font-outfit text-2xl font-bold mb-2">You're a PRO!</h2>
          <p className="text-gray-500">Thank you for supporting PropGram</p>

          <div className="mt-8 bg-white rounded-2xl p-6 text-left">
            <h3 className="font-semibold mb-4">Your PRO benefits:</h3>
            <ul className="space-y-3">
              {[
                'Priority listing placement',
                'Featured posts in feed',
                'PRO badge on profile',
                'Unlimited property listings',
                'Advanced analytics'
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#E5EBE6] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#7B9681]" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Payment status screens
  if (sessionId) {
    return (
      <div className="min-h-screen bg-[#F7F9F7] flex items-center justify-center p-4" data-testid="payment-status">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          {checkingPayment ? (
            <>
              <div className="w-16 h-16 border-4 border-[#7B9681] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="font-outfit text-xl font-bold mb-2">Processing Payment</h2>
              <p className="text-gray-500">Please wait while we confirm your payment...</p>
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-outfit text-xl font-bold mb-2">Welcome to PRO!</h2>
              <p className="text-gray-500">Your subscription is now active</p>
            </>
          ) : paymentStatus === 'expired' || paymentStatus === 'error' ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h2 className="font-outfit text-xl font-bold mb-2">Payment Failed</h2>
              <p className="text-gray-500 mb-4">Something went wrong. Please try again.</p>
              <Button 
                onClick={() => navigate('/pro')}
                className="bg-[#7B9681] hover:bg-[#65806B]"
              >
                Try Again
              </Button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="pro-page">
      {/* Header */}
      <div className="bg-white p-4 border-b flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-outfit text-xl font-semibold">PropGram PRO</h1>
      </div>

      {/* Hero */}
      <div className="p-4 text-center mt-4">
        <div className="w-20 h-20 bg-[#FCF5E3] rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-10 h-10 text-[#E5B95C]" />
        </div>
        <h2 className="font-outfit text-2xl font-bold mb-2">Upgrade to PRO</h2>
        <p className="text-gray-500 max-w-xs mx-auto">
          Get priority placement for your listings and stand out from the crowd
        </p>
      </div>

      {/* Benefits */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-semibold mb-4">PRO Benefits</h3>
          <ul className="space-y-3">
            {[
              'Your posts appear first in feeds',
              'PRO badge on your profile',
              'Featured property listings',
              'Unlimited property posts',
              'Priority support'
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#E5EBE6] rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-[#7B9681]" />
                </div>
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pricing */}
      <div className="px-4 mt-6 space-y-3">
        <div 
          className="bg-white rounded-2xl p-6 border-2 border-[#7B9681] relative"
          data-testid="monthly-plan"
        >
          <span className="absolute -top-3 left-4 bg-[#7B9681] text-white px-3 py-1 rounded-full text-xs font-bold">
            POPULAR
          </span>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold">Monthly</h4>
              <p className="text-sm text-gray-500">Billed monthly</p>
            </div>
            <div className="text-right">
              <p className="font-outfit text-2xl font-bold">$9.99</p>
              <p className="text-xs text-gray-500">/month</p>
            </div>
          </div>
          <Button 
            className="w-full bg-[#7B9681] hover:bg-[#65806B]"
            onClick={() => handleSubscribe('monthly')}
            disabled={loading}
            data-testid="subscribe-monthly-btn"
          >
            {loading ? 'Processing...' : 'Subscribe Monthly'}
          </Button>
        </div>

        <div 
          className="bg-white rounded-2xl p-6"
          data-testid="yearly-plan"
        >
          <span className="absolute -top-3 left-4 bg-[#E5B95C] text-white px-3 py-1 rounded-full text-xs font-bold hidden">
            SAVE 17%
          </span>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold">Yearly</h4>
              <p className="text-sm text-gray-500">Billed annually</p>
            </div>
            <div className="text-right">
              <p className="font-outfit text-2xl font-bold">$99.99</p>
              <p className="text-xs text-gray-500">/year</p>
            </div>
          </div>
          <Button 
            variant="outline"
            className="w-full border-[#7B9681] text-[#7B9681]"
            onClick={() => handleSubscribe('yearly')}
            disabled={loading}
            data-testid="subscribe-yearly-btn"
          >
            {loading ? 'Processing...' : 'Subscribe Yearly'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProPage;
