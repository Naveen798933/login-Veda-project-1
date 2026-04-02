import React, { useState } from 'react';
import { 
  Box, Button, FormControl, FormLabel, Input, 
  Typography, Link, Card, Divider, Checkbox, 
  Alert 
} from '@mui/joy';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('[Login] Submitting login with email:', email);
    try {
      console.log('[Login] Calling /auth/login API...');
      const { data } = await api.post('/auth/login', { email, password });
      console.log('[Login] API response:', { user: data.user.id, token: `${data.accessToken.substring(0, 20)}...` });
      console.log('[Login] Calling setAuth with user:', data.user.email);
      setAuth(data.user, data.accessToken);
      console.log('[Login] Auth state updated, navigating to dashboard...');
      navigate('/');
    } catch (err) {
      console.error('[Login] Error occurred:', err);
      const e = err as { response?: { data?: { message?: string } } };
      const errorMsg = e.response?.data?.message || 'Login failed';
      console.error('[Login] Error message:', errorMsg);
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
      background: 'linear-gradient(135deg, #09090b 0%, #171717 100%)',
      p: 2
    }}>
      <Card sx={{ 
        width: 400, 
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
            Welcome Back
          </Typography>
          <Typography level="body-sm" sx={{ color: '#e0e0e0', fontSize: '0.95rem', fontWeight: 500 }}>
            Collaborate in real-time with LogicVeda
          </Typography>
        </Box>

        {error && (
          <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel sx={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>Email</FormLabel>
            <Input
              type="email"
              placeholder="name@company.com"
              startDecorator={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ 
                '--Input-focusedHighlight': 'rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
              }}
            />
          </FormControl>

          <FormControl sx={{ mb: 2 }}>
            <FormLabel sx={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>Password</FormLabel>
            <Input
              type="password"
              placeholder="••••••••"
              startDecorator={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
               sx={{ 
                '--Input-focusedHighlight': 'rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
              }}
            />
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Checkbox label="Remember me" size="sm" sx={{ color: '#e0e0e0', '& .MuiCheckbox-root': { color: '#e0e0e0' } }} />
            <Link href="/forgot-password" level="body-sm" sx={{ color: '#60a5fa', fontWeight: 600 }}>Forgot password?</Link>
          </Box>

          <Button 
            type="submit" 
            fullWidth 
            loading={loading}
            startDecorator={!loading && <LogIn size={18} />}
            sx={{ 
              borderRadius: 'md',
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': { opacity: 0.9 }
            }}
          >
            Sign In
          </Button>
        </form>

        <Divider sx={{ my: 3, color: 'rgba(255, 255, 255, 0.5)' }}>
          <span style={{ color: '#b0b0b0', fontWeight: 500 }}>OR</span>
        </Divider>

        <Typography level="body-sm" sx={{ textAlign: 'center', color: '#d0d0d0' }}>
          New to LogicVeda? <Link href="/register" sx={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.95rem' }}>Create account</Link>
        </Typography>
      </Card>
    </Box>
  );
};

export default Login;
