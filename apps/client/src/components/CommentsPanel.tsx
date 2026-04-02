import React, { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Textarea,
  Avatar,
  IconButton,
  Badge,
  Card,
} from '@mui/joy';
import {
  Send,
  Check,
  Trash2,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarColor: string;
  };
  document: string;
  parentId?: string;
  isResolved: boolean;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface CommentsPanelProps {
  docId: string;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ docId }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/comments/${docId}`);
      setComments(data);
    } catch {
      console.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/comments', {
        documentId: docId,
        content: newComment,
        parentId: null,
      });
      setNewComment('');
      await fetchComments();
    } catch {
      console.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await api.patch(`/comments/${commentId}/resolve`);
      setComments(comments.map(c => c._id === commentId ? { ...c, isResolved: true } : c));
    } catch {
      console.error('Failed to resolve comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    
    try {
      await api.delete(`/comments/${commentId}`);
      await fetchComments();
    } catch {
      console.error('Failed to delete comment');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Typography level="body-sm" sx={{ color: '#e0e0e0', textAlign: 'center' }}>
            Loading comments...
          </Typography>
        ) : comments.length === 0 ? (
          <Typography level="body-sm" sx={{ color: '#e0e0e0', textAlign: 'center', mt: 10 }}>
            No comments yet. Be the first to start a discussion!
          </Typography>
        ) : (
          <Stack spacing={2}>
            {comments.map(comment => (
              <Card key={comment._id} variant="outlined" sx={{ p: 2, bgcolor: 'background.surface', opacity: comment.isResolved ? 0.6 : 1 }}>
                <Stack direction="row" spacing={1.5}>
                  <Avatar size="sm" sx={{ bgcolor: comment.author.avatarColor }}>
                    {comment.author.firstName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography level="title-sm">{comment.author.firstName} {comment.author.lastName}</Typography>
                      <Stack direction="row" spacing={0.5}>
                        {!comment.isResolved && user?.id === comment.author._id && (
                          <Badge badgeContent="✓" color="success">
                            <IconButton size="sm" variant="plain" onClick={() => handleResolve(comment._id)}>
                              <Check size={16} />
                            </IconButton>
                          </Badge>
                        )}
                        {user?.id === comment.author._id && (
                          <IconButton size="sm" variant="plain" color="danger" onClick={() => handleDelete(comment._id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </Stack>
                    </Stack>
                    <Typography level="body-sm" sx={{ mt: 0.5 }}>{comment.content}</Typography>
                    <Typography level="body-xs" sx={{ mt: 1, color: '#a0a0a0' }}>
                      {new Date(comment.createdAt).toLocaleString()} {comment.isResolved && '• (Resolved)'}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <form onSubmit={handleAddComment}>
          <Stack direction="row" spacing={1}>
            <Textarea
              placeholder="Write a comment..."
              minRows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              type="submit"
              variant="solid"
              color="primary"
              disabled={submitting || !newComment.trim()}
              loading={submitting}
              startDecorator={<Send size={16} />}
              sx={{ alignSelf: 'flex-end' }}
            >
              Send
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};

export default CommentsPanel;
