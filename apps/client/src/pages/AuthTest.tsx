import React, { useState } from 'react';
import { Box, Button, Input, Stack, Typography, Alert, Card } from '@mui/joy';
import api from '../api/axios';

const AuthTest: React.FC = () => {
  const [testEmail, setTestEmail] = useState(`test_${Date.now()}@example.com`);
  const [testPassword] = useState('TestPass123!');
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    console.log(msg);
    setOutput(prev => [...prev, msg]);
  };

  const clearLog = () => {
    setOutput([]);
  };

  const testRegister = async () => {
    setLoading(true);
    clearLog();
    addLog('🔍 Starting Registration Test...');
    addLog(`Email: ${testEmail}`);
    addLog(`Password: [REDACTED]`);
    
    try {
      addLog('📤 Sending POST /auth/register...');
      const response = await api.post('/auth/register', {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
      });
      
      addLog('✅ Registration Successful!');
      addLog(`User ID: ${response.data.user.id}`);
      addLog(`User Email: ${response.data.user.email}`);
      addLog(`Token: ${response.data.accessToken.substring(0, 30)}...`);
      addLog('✅ API Response received correctly');
      
      // Try to access token from response
      if (response.data.accessToken) {
        addLog('✅ Access token found in response');
      }
    } catch (error: any) {
      addLog('❌ Registration Failed!');
      addLog(`Error Type: ${error.name}`);
      addLog(`Error Message: ${error.message}`);
      if (error.response) {
        addLog(`Status Code: ${error.response.status}`);
        addLog(`Response: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    clearLog();
    addLog('🔍 Starting Login Test...');
    addLog(`Email: ${testEmail}`);
    addLog(`Password: [REDACTED]`);
    
    try {
      addLog('📤 Sending POST /auth/login...');
      const response = await api.post('/auth/login', {
        email: testEmail,
        password: testPassword,
      });
      
      addLog('✅ Login Successful!');
      addLog(`User ID: ${response.data.user.id}`);
      addLog(`User Email: ${response.data.user.email}`);
      addLog(`Token: ${response.data.accessToken.substring(0, 30)}...`);
      addLog('✅ API Response received correctly');
    } catch (error: any) {
      addLog('❌ Login Failed!');
      addLog(`Error Type: ${error.name}`);
      addLog(`Error Message: ${error.message}`);
      if (error.response) {
        addLog(`Status Code: ${error.response.status}`);
        addLog(`Response: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testProtectedRoute = async () => {
    setLoading(true);
    clearLog();
    addLog('🔍 Starting Protected Route Test...');
    
    try {
      addLog('📤 Sending GET /documents...');
      const response = await api.get('/documents');
      
      addLog('✅ Protected Route Accessible!');
      addLog(`Documents: ${response.data.length}`);
      addLog('✅ Token is valid');
    } catch (error: any) {
      addLog('❌ Protected Route Test Failed!');
      addLog(`Error Message: ${error.message}`);
      if (error.response) {
        addLog(`Status Code: ${error.response.status}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testFullFlow = async () => {
    setLoading(true);
    clearLog();
    const email = `test_${Date.now()}@example.com`;
    setTestEmail(email);
    
    addLog('🔍 Starting Full Authentication Flow Test...');
    addLog(`Test Email: ${email}`);
    
    try {
      // Register
      addLog('\n📝 Step 1: Registering...');
      await api.post('/auth/register', {
        firstName: 'Test',
        lastName: 'User',
        email: email,
        password: testPassword,
      });
      addLog('✅ Registration successful');
      
      // Login
      addLog('\n🔐 Step 2: Logging in...');
      await api.post('/auth/login', {
        email: email,
        password: testPassword,
      });
      addLog('✅ Login successful');
      
      // Protected Route
      addLog('\n🔒 Step 3: Accessing protected route...');
      const docsResponse = await api.get('/documents');
      addLog(`✅ Protected route accessible (${docsResponse.data.length} documents)`);
      
      addLog('\n🎉 FULL FLOW TEST PASSED!');
    } catch (error: any) {
      addLog(`\n❌ Test Failed: ${error.message}`);
      if (error.response) {
        addLog(`Status: ${error.response.status}`);
        addLog(`Details: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Card sx={{ p: 3, mb: 2 }}>
        <Typography level="h2" sx={{ mb: 2 }}>🧪 Authentication Test Suite</Typography>
        
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography level="body-sm" sx={{ mb: 1 }}>Test Email (auto-generated for each test):</Typography>
            <Input 
              value={testEmail} 
              onChange={(e) => setTestEmail(e.target.value)} 
              placeholder="test@example.com"
            />
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button 
              onClick={testRegister} 
              loading={loading}
              color="success"
            >
              1️⃣ Test Register
            </Button>
            <Button 
              onClick={testLogin} 
              loading={loading}
              color="warning"
            >
              2️⃣ Test Login
            </Button>
            <Button 
              onClick={testProtectedRoute} 
              loading={loading}
              color="warning"
            >
              3️⃣ Test Protected Route
            </Button>
            <Button 
              onClick={testFullFlow} 
              loading={loading}
              color="primary"
              sx={{ fontWeight: 'bold' }}
            >
              🚀 Full Flow
            </Button>
            <Button 
              onClick={clearLog}
              variant="plain"
            >
              Clear Log
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ 
          bgcolor: '#1a1a1a', 
          p: 2, 
          borderRadius: 'md',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          maxHeight: 400,
          overflow: 'auto',
          border: '1px solid #444'
        }}>
          {output.length === 0 ? (
            <Typography sx={{ color: '#888' }}>
              Click a button above to start testing...
            </Typography>
          ) : (
            output.map((line, i) => (
              <div key={i} style={{ color: line.includes('✅') ? '#00ff00' : line.includes('❌') ? '#ff0000' : '#0ff' }}>
                {line}
              </div>
            ))
          )}
        </Box>
      </Card>

      <Alert color="warning" variant="soft">
        <Typography level="body-sm">
          <strong>Instructions:</strong> Open browser DevTools (F12) and go to Console tab to see detailed logs.
          This test page helps diagnose authentication issues by testing each step independently.
        </Typography>
      </Alert>
    </Box>
  );
};

export default AuthTest;
