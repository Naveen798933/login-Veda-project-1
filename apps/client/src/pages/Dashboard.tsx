import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Card, Grid, 
  IconButton, Input, Stack, Avatar, 
  List, ListItem, ListItemDecorator, ListItemButton,
  Sheet, Skeleton
} from '@mui/joy';
import { 
  Plus, Search, FileText, MoreVertical, 
  LogOut, Settings, Clock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<{_id: string, title: string, updatedAt: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDocuments(search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchDocuments = async (searchQuery: string = '') => {
    setLoading(true);
    try {
      const endpoint = searchQuery.trim() 
        ? `/documents/search?q=${encodeURIComponent(searchQuery)}`
        : '/documents';
      const { data } = await api.get(endpoint);
      setDocuments(data);
    } catch {
      console.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    try {
      const { data } = await api.post('/documents', { title: 'Untitled Document' });
      navigate(`/document/${data._id}`);
    } catch {
      console.error('Failed to create document');
    }
  };

  const filteredDocs = documents; // Now handled by backend

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body' }}>
      {/* Sidebar Placeholder (Can be modularized later) */}
      <Sheet
        sx={{
          width: 260,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          p: 2,
          gap: 2,
          bgcolor: 'rgba(23, 23, 23, 0.5)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography level="h4" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.400' }}>
          LogicVeda
        </Typography>
        
        <List size="sm" sx={{ '--ListItem-radius': '8px', gap: 0.5 }}>
          <ListItem>
            <ListItemButton selected variant="soft" color="primary">
              <ListItemDecorator><FileText size={18} /></ListItemDecorator>
              All Documents
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton>
              <ListItemDecorator><Clock size={18} /></ListItemDecorator>
              Recent
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton>
              <ListItemDecorator><Settings size={18} /></ListItemDecorator>
              Settings
            </ListItemButton>
          </ListItem>
        </List>

        <Box sx={{ mt: 'auto', p: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar variant="soft" sx={{ bgcolor: user?.avatarColor }}>
            {user?.firstName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography level="title-sm" noWrap sx={{ color: 'white' }}>{user?.firstName} {user?.lastName}</Typography>
            <Typography level="body-xs" noWrap sx={{ color: '#e0e0e0' }}>{user?.email}</Typography>
          </Box>
          <IconButton size="sm" variant="plain" color="neutral" onClick={logout}>
            <LogOut size={16} />
          </IconButton>
        </Box>
      </Sheet>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography level="h2" sx={{ color: 'white' }}>My Documents</Typography>
          <Button 
            startDecorator={<Plus size={20} />} 
            onClick={createDocument}
            sx={{ 
                borderRadius: 'md',
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                '&:hover': { opacity: 0.9 }
            }}
          >
            New Document
          </Button>
        </Stack>

        <Box sx={{ mb: 4 }}>
          <Input
            placeholder="Search documents..."
            startDecorator={<Search size={18} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              maxWidth: 400,
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              '--Input-focusedHighlight': 'rgba(255,255,255,0.2)'
            }}
          />
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map(i => (
              <Grid xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 'md' }} />
              </Grid>
            ))}
          </Grid>
        ) : filteredDocs.length > 0 ? (
          <Grid container spacing={3}>
            {filteredDocs.map((doc) => (
              <Grid xs={12} sm={6} md={4} key={doc._id}>
                <Card 
                  variant="outlined" 
                  onClick={() => navigate(`/document/${doc._id}`)}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      borderColor: 'primary.500',
                      bgcolor: 'rgba(99, 102, 241, 0.05)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <FileText size={24} color="#6366f1" />
                    <IconButton size="sm" variant="plain" color="neutral">
                      <MoreVertical size={16} />
                    </IconButton>
                  </Box>
                  <Typography level="title-md" sx={{ color: 'white', mb: 0.5 }}>{doc.title}</Typography>
                  <Typography level="body-xs" sx={{ color: '#e0e0e0' }}>
                    Last edited {new Date(doc.updatedAt).toLocaleDateString()}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography level="body-lg" sx={{ color: '#e0e0e0' }}>
              No documents found. Create your first one!
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
