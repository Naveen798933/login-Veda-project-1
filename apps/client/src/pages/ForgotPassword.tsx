import React, { useState } from 'react';
import { 
  Box, Button, FormControl, FormLabel, Input, 
  Typography, Link, Card, Alert 
} from '@mui/joy';
import { Mail, ShieldAlert } from 'lucide-react';
import api from '../api/axios';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage({ type: 'success', text: 'If that email exists, we have sent a password reset link.' });
      setEmail('');
    } catch {
      // In a real system, you might not want to disclose if an email exists
      setMessage({ type: 'success', text: 'If that email exists, we have sent a password reset link.' });
    } finally {
      setLoading(false);
    }
  };

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
            Reset Password
          </Typography>
          <Typography level="body-sm" sx={{ color: '#e0e0e0', fontSize: '0.95rem', fontWeight: 500 }}>
            Enter your email to receive a recovery link
          </Typography>
        </Box>

        {message && (
          <Alert color={message.type === 'error' ? 'danger' : 'success'} variant="soft" sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl sx={{ mb: 3 }}>
            <FormLabel sx={{ color: '#f5f5f5', fontWeight: 600, fontSize: '0.95rem' }}>Email Address</FormLabel>
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

          <Button 
            type="submit" fullWidth loading={loading}
            startDecorator={!loading && <ShieldAlert size={18} />}
            sx={{ 
              mb: 2, borderRadius: 'md',
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': { opacity: 0.9 }
            }}
          >
            Send Reset Link
          </Button>
          
          <Typography level="body-sm" sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
            Remembered your password? <Link href="/login" sx={{ color: 'primary.300', fontWeight: 'bold' }}>Sign In</Link>
          </Typography>
        </form>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
