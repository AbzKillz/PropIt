import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Home, BadgeCheck, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';
import { Input } from './ui/input';
import { Button } from './ui/button';
import BottomNav from './BottomNav';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { conversationId, recipientId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [newRecipient, setNewRecipient] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchConversations();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      fetchMessages(conversationId);
    } else if (recipientId) {
      // Starting a new conversation
      fetchRecipientInfo(recipientId);
    }
  }, [conversationId, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRecipientInfo = async (userId) => {
    try {
      const { data } = await usersAPI.getProfile(userId);
      setNewRecipient(data);
      setActiveConversation({
        other_user: data,
        participants: [user._id || user.id, userId],
        isNew: true
      });
    } catch (e) {
      console.error('Error fetching recipient:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data } = await messagesAPI.getConversations();
      setConversations(data);
      if (conversationId && conversationId !== 'new') {
        const active = data.find(c => c.id === conversationId);
        setActiveConversation(active);
      }
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      if (!recipientId) {
        setLoading(false);
      }
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const { data } = await messagesAPI.getMessages(convId);
      setMessages(data.reverse());
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      // Get recipient ID - either from existing conversation or new recipient
      const recipientIdToUse = newRecipient 
        ? (newRecipient._id || newRecipient.id)
        : activeConversation.participants.find(p => p !== user._id && p !== user.id);
      
      const { data } = await messagesAPI.send({
        recipient_id: recipientIdToUse,
        content: newMessage.trim()
      });
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // If it was a new conversation, clear the new flag
      if (activeConversation.isNew) {
        setActiveConversation(prev => ({ ...prev, isNew: false }));
        // Refresh conversations to get the new one
        fetchConversations();
      }
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString('en-GB', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getRoleBorderColor = (role) => {
    switch (role) {
      case 'buyer': return 'border-[#7B9681]';
      case 'seller': return 'border-[#C89F82]';
      case 'agent': return 'border-[#4A90E2]';
      default: return 'border-gray-300';
    }
  };

  // Conversation List View
  if (!conversationId && !recipientId) {
    return (
      <div className="min-h-screen bg-[#F7F9F7] pb-20" data-testid="messages-page">
        <div className="bg-white sticky top-0 z-10 p-4 border-b">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-600">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-outfit text-xl font-semibold">Messages</h1>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Start a conversation by inquiring about a property</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv);
                    navigate(`/messages/${conv.id}`);
                  }}
                  className="w-full bg-white rounded-xl p-4 flex items-center gap-3 text-left shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`conversation-${conv.id}`}
                >
                  <div className={`w-12 h-12 rounded-full border-2 ${getRoleBorderColor(conv.other_user?.role)} overflow-hidden flex-shrink-0`}>
                    <img
                      src={conv.other_user?.profile_image || `https://ui-avatars.com/api/?name=${conv.other_user?.name || 'User'}&background=7B9681&color=fff`}
                      alt={conv.other_user?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{conv.other_user?.name || 'Unknown'}</span>
                      {conv.other_user?.is_verified && <BadgeCheck className="w-4 h-4 text-[#4A90E2] flex-shrink-0" />}
                      {conv.other_user?.is_pro && (
                        <span className="badge-pro px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 flex-shrink-0">
                          <Crown className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">{formatTime(conv.last_message_at)}</span>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-[#7B9681] text-white rounded-full text-xs flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    );
  }

  // Chat View
  return (
    <div className="h-screen flex flex-col bg-[#F7F9F7]" data-testid="chat-view">
      {/* Header */}
      <div className="bg-white p-4 border-b flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/messages')} className="text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        {activeConversation?.other_user && (
          <>
            <div className={`w-10 h-10 rounded-full border-2 ${getRoleBorderColor(activeConversation.other_user.role)} overflow-hidden`}>
              <img
                src={activeConversation.other_user.profile_image || `https://ui-avatars.com/api/?name=${activeConversation.other_user.name}&background=7B9681&color=fff`}
                alt={activeConversation.other_user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{activeConversation.other_user.name}</span>
                {activeConversation.other_user.is_verified && <BadgeCheck className="w-4 h-4 text-[#4A90E2]" />}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeConversation.other_user.role === 'buyer' ? 'badge-buyer' :
                activeConversation.other_user.role === 'agent' ? 'bg-blue-100 text-blue-600' :
                'badge-seller'
              }`}>
                {activeConversation.other_user.role === 'buyer' ? 'Explorer' : 
                 activeConversation.other_user.role === 'agent' ? 'Agent' : 'Vendor'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user._id || msg.sender_id === user.id;
          return (
            <div 
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${msg.id}`}
            >
              <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                {/* Property Inquiry Badge */}
                {msg.property_id && (
                  <div className={`flex items-center gap-1 text-xs mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <Home className="w-3 h-3 text-[#7B9681]" />
                    <span className="text-[#7B9681]">Property Inquiry</span>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-2 ${
                  isOwn 
                    ? 'bg-[#7B9681] text-white rounded-br-none' 
                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white p-4 border-t flex gap-2 flex-shrink-0">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          data-testid="message-input"
        />
        <Button 
          type="submit" 
          className="bg-[#7B9681] hover:bg-[#65806B]"
          disabled={!newMessage.trim() || sending}
          data-testid="send-message-btn"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default MessagesPage;
