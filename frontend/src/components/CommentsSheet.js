import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { commentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Input } from './ui/input';
import { Button } from './ui/button';

const CommentsSheet = ({ isOpen, onClose, postId }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data } = await commentsAPI.getByPost(postId);
      setComments(data);
    } catch (e) {
      console.error('Error fetching comments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const { data } = await commentsAPI.create({ 
        content: newComment.trim(), 
        post_id: postId 
      });
      setComments(prev => [data, ...prev]);
      setNewComment('');
    } catch (e) {
      console.error('Error posting comment:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl" data-testid="comments-sheet">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-center font-outfit">
            {comments.length} Comments
          </SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[calc(70vh-140px)]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                <div 
                  className={`w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 ${
                    comment.author_role === 'buyer' ? 'border-[#7B9681]' : 
                    comment.author_role === 'agent' ? 'border-[#4A90E2]' : 'border-[#C89F82]'
                  }`}
                >
                  <img 
                    src={comment.author_image || `https://ui-avatars.com/api/?name=${comment.author_name}&background=7B9681&color=fff`}
                    alt={comment.author_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.author_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      comment.author_role === 'buyer' ? 'badge-buyer' : 
                      comment.author_role === 'agent' ? 'bg-blue-100 text-blue-600' : 'badge-seller'
                    }`}>
                      {comment.author_role}
                    </span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1 text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="border-t pt-4 flex gap-2" data-testid="comment-form">
          {isAuthenticated ? (
            <>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1"
                data-testid="comment-input"
              />
              <Button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className="bg-[#7B9681] hover:bg-[#65806B]"
                data-testid="comment-submit-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <p className="text-center w-full text-gray-500 text-sm">
              Please log in to comment
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;
