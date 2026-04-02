import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, IconButton, 
  Stack, Avatar, Button, 
  Divider, Input, 
  CircularProgress, Sheet
} from '@mui/joy';
import { 
  ChevronLeft, Share2, MoreHorizontal, 
  Cloud, Loader2, MessageSquare, History
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import CollaborativeEditor from '../components/CollaborativeEditor';
import CommentsPanel from '../components/CommentsPanel';
import HistoryTimeline from '../components/HistoryTimeline';
import ShareModal from '../components/ShareModal';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const DocumentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
    const { user } = useAuthStore();

    useEffect(() => {
        if (id) fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchDocument = async () => {
        try {
            const { data } = await api.get(`/documents/${id}`);
            setTitle(data.title);
        } catch {
            console.error('Document not found');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleTitleChange = async (newTitle: string) => {
        setTitle(newTitle);
        setSaving(true);
        try {
            await api.patch(`/documents/${id}`, { title: newTitle });
        } catch {
            console.error('Failed to update title');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.body' }}>
            <CircularProgress variant="soft" color="primary" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.body' }}>
            {/* Header */}
            <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ 
                    px: 3, py: 1.5, 
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    bgcolor: 'rgba(23, 23, 23, 0.5)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton size="sm" onClick={() => navigate('/')} variant="plain" color="neutral">
                        <ChevronLeft />
                    </IconButton>
                    <Divider orientation="vertical" />
                    <Box sx={{ minWidth: 200 }}>
                        <Input
                            variant="plain"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            sx={{ 
                                fontSize: 'lg', 
                                fontWeight: 'bold', 
                                color: 'white',
                                '--Input-focusedHighlight': 'transparent',
                                p: 0,
                                mb: -0.5,
                                bgcolor: 'transparent',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                            }}
                        />
                        <Stack direction="row" spacing={1} alignItems="center">
                            {saving ? <Loader2 size={12} className="animate-spin" color="gray" /> : <Cloud size={12} color="gray" />}
                            <Typography level="body-xs" sx={{ color: '#e0e0e0' }}>
                                {saving ? 'Saving...' : 'All changes saved'}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Button 
                        variant="soft" size="sm"
                        startDecorator={<Share2 size={16} />}
                        onClick={() => setShareOpen(true)}
                        sx={{ borderRadius: 'md', bgcolor: 'primary.900' }}
                    >
                        Share
                    </Button>
                    <Avatar variant="soft" size="sm" sx={{ bgcolor: user?.avatarColor }}>
                        {user?.firstName[0]}
                    </Avatar>
                    <IconButton size="sm" variant="plain" color="neutral">
                        <MoreHorizontal />
                    </IconButton>
                </Stack>
            </Stack>

            {/* Main Area */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Editor Area */}
                <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, md: 4 } }}>
                    {id && <CollaborativeEditor docId={id} />}
                </Box>

                {/* Sidebars (Comments/Versions) */}
                <Sheet
                    sx={{
                        width: 300,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        display: { xs: 'none', lg: 'flex' },
                        flexDirection: 'column',
                        bgcolor: 'rgba(23, 23, 23, 0.5)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" spacing={2}>
                            <Button 
                                size="sm" variant={activeTab === 'comments' ? 'soft' : 'plain'} 
                                onClick={() => setActiveTab('comments')}
                                startDecorator={<MessageSquare size={18} />}
                            >
                                Comments
                            </Button>
                            <Button 
                                size="sm" variant={activeTab === 'history' ? 'soft' : 'plain'} 
                                onClick={() => setActiveTab('history')}
                                startDecorator={<History size={18} />}
                            >
                                History
                            </Button>
                        </Stack>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        {activeTab === 'comments' ? (
                            <CommentsPanel docId={id || ''} />
                        ) : (
                            <HistoryTimeline docId={id || ''} />
                        )}
                    </Box>
                </Sheet>
            </Box>

            <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} docId={id || ''} />
        </Box>
    );
};

export default DocumentDetail;
