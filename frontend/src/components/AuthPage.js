import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Home, User, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const AuthPage = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'buyer'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] flex flex-col" data-testid="auth-page">
      {/* Header */}
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2 text-[#7B9681]">
          <Home className="w-5 h-5" />
          <span className="font-outfit font-semibold">PropGram</span>
        </Link>
      </div>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8" data-testid="auth-form-container">
            {/* Title */}
            <h1 className="font-outfit text-2xl font-bold text-center mb-2">
              {isLogin ? 'Welcome back' : 'Join PropGram'}
            </h1>
            <p className="text-gray-500 text-center text-sm mb-6">
              {isLogin 
                ? 'Sign in to continue exploring properties' 
                : 'Create an account to start your property journey'}
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm" data-testid="auth-error">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (Register only) */}
              {!isLogin && (
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required={!isLogin}
                    data-testid="name-input"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  data-testid="email-input"
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection (Register only) */}
              {!isLogin && (
                <div>
                  <Label>I am a</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'buyer' }))}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        formData.role === 'buyer' 
                          ? 'border-[#7B9681] bg-[#E5EBE6]' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid="role-buyer-btn"
                    >
                      <User className={`w-5 h-5 ${formData.role === 'buyer' ? 'text-[#7B9681]' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${formData.role === 'buyer' ? 'text-[#7B9681]' : 'text-gray-500'}`}>
                        Explorer
                      </span>
                      <span className="text-[10px] text-gray-400">Rent/Buy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'seller' }))}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        formData.role === 'seller' 
                          ? 'border-[#C89F82] bg-[#F7EFEA]' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid="role-seller-btn"
                    >
                      <Home className={`w-5 h-5 ${formData.role === 'seller' ? 'text-[#C89F82]' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${formData.role === 'seller' ? 'text-[#C89F82]' : 'text-gray-500'}`}>
                        Vendor
                      </span>
                      <span className="text-[10px] text-gray-400">Sell/Let</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'agent' }))}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        formData.role === 'agent' 
                          ? 'border-[#4A90E2] bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid="role-agent-btn"
                    >
                      <Building2 className={`w-5 h-5 ${formData.role === 'agent' ? 'text-[#4A90E2]' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${formData.role === 'agent' ? 'text-[#4A90E2]' : 'text-gray-500'}`}>
                        Agent
                      </span>
                      <span className="text-[10px] text-gray-400">Professional</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-[#7B9681] hover:bg-[#65806B] h-12 text-base"
                disabled={loading}
                data-testid="auth-submit-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            {/* Toggle Login/Register */}
            <p className="text-center text-sm text-gray-500 mt-6">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-[#7B9681] font-medium hover:underline"
                data-testid="auth-toggle-btn"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
