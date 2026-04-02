import React, { useEffect, useState } from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/joy';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineDetectionProps {
  show?: boolean;
}

const OfflineDetection: React.FC<OfflineDetectionProps> = ({ show = true }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(false);
      setReconnectAttempts(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
      setReconnectAttempts(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-retry reconnection
  useEffect(() => {
    if (!isOnline && showAlert) {
      const timer = setTimeout(() => {
        setReconnectAttempts((prev) => prev + 1);
        // Attempt to reconnect by fetching a simple resource
        fetch('/ping', { method: 'GET' }).then(
          () => {
            setIsOnline(true);
            setShowAlert(false);
          },
          () => {
            // Stay offline
          }
        );
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, showAlert, reconnectAttempts]);

  if (!show || isOnline) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        bgcolor: 'danger.900',
        borderBottom: '2px solid',
        borderColor: 'danger.500',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Stack spacing={1} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <WifiOff size={20} color="white" />
          <Box sx={{ flex: 1 }}>
            <Typography level="title-sm" sx={{ color: 'white', fontWeight: 'bold' }}>
              You're offline
            </Typography>
            <Typography level="body-xs" sx={{ color: '#ffffff' }}>
              {reconnectAttempts > 0
                ? `Reconnection attempt ${reconnectAttempts}... (waiting ${3}s)`
                : 'Attempting to reconnect...'}
            </Typography>
          </Box>
          <Wifi size={16} color="rgba(255, 255, 255, 0.5)" className="opacity-50" />
        </Stack>
        <LinearProgress
          determinate
          value={(reconnectAttempts % 3) * 33.33}
          variant="soft"
          sx={{ bgcolor: 'danger.800', height: 3 }}
        />
      </Stack>
    </Box>
  );
};

export default OfflineDetection;
