import React, { useState } from 'react';
import { 
  Box, Button, FormControl, FormLabel, Input, 
  Typography, Card, Alert, Link 
} from '@mui/joy';
import { Lock, KeyRound } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      await api.post('/auth/reset-password', { email, token, newPassword: password });
      setStatus({ type: 'success', text: 'Password reset successful. You can now login.' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setStatus({ type: 'error', text: error.response?.data?.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <Alert color="danger">Invalid password reset link.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #171717 100%)', p: 2
    }}>
      <Card sx={{ 
        width: 400, maxWidth: '100%', 
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        p: 4, borderRadius: 'xl', background: 'rgba(23, 23, 23, 0.8)'
      }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography level="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#ffffff', fontSize: '2rem' }}>
            Set New Password
          </Typography>
          <Typography level="body-sm" sx={{ color: '#e0e0e0', fontSize: '0.95rem', fontWeight: 500 }}>
            Enter your new secure password below
          </Typography>
        </Box>

        {status && (
          <Alert color={status.type === 'error' ? 'danger' : 'success'} variant="soft" sx={{ mb: 2 }}>
            {status.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel sx={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>New Password</FormLabel>
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

          <FormControl sx={{ mb: 3 }}>
            <FormLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Confirm Password</FormLabel>
            <Input
              type="password"
              placeholder="••••••••"
              startDecorator={<KeyRound size={18} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              sx={{ 
                '--Input-focusedHighlight': 'rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
              }}
            />
          </FormControl>

          <Button 
            type="submit" fullWidth loading={loading}
            disabled={status?.type === 'success'}
            sx={{ 
              mb: 2, borderRadius: 'md',
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': { opacity: 0.9 }
            }}
          >
            Update Password
          </Button>

          <Typography level="body-sm" sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
            <Link href="/login" sx={{ color: 'primary.300' }}>Back to Sign In</Link>
          </Typography>
        </form>
      </Card>
    </Box>
  );
};

export default ResetPassword;
