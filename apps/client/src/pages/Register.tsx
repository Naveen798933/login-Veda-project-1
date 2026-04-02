import React, { useState } from 'react';
import { 
  Box, Button, FormControl, FormLabel, Input, 
  Typography, Link, Card, Divider, 
  Alert, Stack 
} from '@mui/joy';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('[Register] Submitting form with data:', { ...formData, password: '[REDACTED]' });
    try {
      console.log('[Register] Calling /auth/register API...');
      const { data } = await api.post('/auth/register', formData);
      console.log('[Register] API response:', { user: data.user.id, token: `${data.accessToken.substring(0, 20)}...` });
      console.log('[Register] Calling setAuth with user:', data.user.email);
      setAuth(data.user, data.accessToken);
      console.log('[Register] Auth state updated, navigating to dashboard...');
      navigate('/');
    } catch (err) {
      console.error('[Register] Error occurred:', err);
      const e = err as { response?: { data?: { message?: string } } };
      const errorMsg = e.response?.data?.message || 'Registration failed';
      console.error('[Register] Error message:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)',
      p: 2
    }}>
      <Card sx={{ 
        width: 450, 
        maxWidth: '100%', 
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        p: 4,
        borderRadius: 'xl',
        background: 'rgba(23, 23, 23, 0.8)'
      }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography level="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#ffffff', fontSize: '2rem' }}>
            Join LogicVeda
          </Typography>
          <Typography level="body-sm" sx={{ color: '#e0e0e0', fontSize: '0.95rem', fontWeight: 500 }}>
            Start collaborating in seconds
          </Typography>
        </Box>

        {error && (
          <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel sx={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>First Name</FormLabel>
                <Input
                  name="firstName"
                  placeholder="John"
                  startDecorator={<User size={18} />}
                  onChange={handleChange}
                  required
                  sx={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                />
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel sx={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>Last Name</FormLabel>
                <Input
                  name="lastName"
                  placeholder="Doe"
                  onChange={handleChange}
                  required
                  sx={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                />
              </FormControl>
            </Box>

            <FormControl>
              <FormLabel sx={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>Email</FormLabel>
              <Input
                name="email"
                type="email"
                placeholder="john@example.com"
                startDecorator={<Mail size={18} />}
                onChange={handleChange}
                required
                sx={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
              />
            </FormControl>

            <FormControl sx={{ mb: 1 }}>
              <FormLabel sx={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>Password</FormLabel>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                startDecorator={<Lock size={18} />}
                onChange={handleChange}
                required
                sx={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
              />
            </FormControl>

            <Button 
              type="submit" 
              fullWidth 
              loading={loading}
              startDecorator={!loading && <UserPlus size={18} />}
              sx={{ 
                borderRadius: 'md',
                background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
                '&:hover': { opacity: 0.9 }
              }}
            >
              Create Account
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3, color: 'rgba(255, 255, 255, 0.5)' }}>
          <span style={{ color: '#b0b0b0', fontWeight: 500 }}>OR</span>
        </Divider>

        <Typography level="body-sm" sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
          Already have an account? <Link href="/login" sx={{ color: 'primary.300', fontWeight: 'bold' }}>Sign In</Link>
        </Typography>
      </Card>
    </Box>
  );
};

export default Register;
