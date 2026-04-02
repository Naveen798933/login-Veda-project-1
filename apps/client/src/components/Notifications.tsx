import React, { useState, useEffect } from 'react';
import { Box, Stack, Card, Typography, IconButton, Avatar, Badge, Chip, Button } from '@mui/joy';
import { X, Bell } from 'lucide-react';
import io from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

interface Notification {
  id: string;
  type: 'MENTION' | 'INVITE' | 'COMMENT_REPLY' | 'SHARED' | 'PASSWORD_RESET';
  title: string;
  message: string;
  avatar?: string;
  avatarColor?: string;
  timestamp: Date;
  read: boolean;
  action?: { label: string; url: string };
}

interface NotificationsProps {
  compact?: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({ compact = false }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    // Initialize Socket.io connection
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      auth: { token: localStorage.getItem('accessToken') },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join-notifications', user.id);
    });

    newSocket.on('notification:received', (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: Notification = {
        ...data,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50)); // Keep last 50
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDismissAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications = compact ? notifications.slice(0, 3) : notifications;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'MENTION':
        return 'warning';
      case 'INVITE':
        return 'success';
      case 'COMMENT_REPLY':
        return 'primary';
      case 'SHARED':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  if (compact) {
    return (
      <Box sx={{ position: 'relative' }}>
        <Badge
          badgeContent={unreadCount}
          color="danger"
          size="sm"
          sx={{ '--Badge-paddingX': '4px' }}
        >
          <IconButton variant="plain" color="neutral" size="lg">
            <Bell size={20} />
          </IconButton>
        </Badge>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2, px: 2, py: 1 }}
      >
        <Typography level="h4" startDecorator={<Bell size={20} />}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Typography>
        {notifications.length > 0 && (
          <Button variant="plain" size="sm" onClick={handleDismissAll}>
            Clear All
          </Button>
        )}
      </Stack>

      {/* Notifications List */}
      <Stack spacing={1}>
        {visibleNotifications.length === 0 ? (
          <Card variant="soft" sx={{ p: 2, textAlign: 'center' }}>
            <Typography level="body-sm" sx={{ color: '#e0e0e0' }}>
              No notifications yet. Check back soon!
            </Typography>
          </Card>
        ) : (
          visibleNotifications.map((notif) => (
            <Card
              key={notif.id}
              variant={notif.read ? 'outlined' : 'soft'}
              sx={{
                p: 1.5,
                bgcolor: notif.read ? 'background.surface' : 'rgba(99, 102, 241, 0.1)',
                borderColor: notif.read ? 'divider' : 'primary.300',
                position: 'relative',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: 'md',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                {/* Avatar */}
                <Avatar
                  size="sm"
                  sx={{
                    bgcolor: notif.avatarColor || 'primary.500',
                    flexShrink: 0,
                  }}
                >
                  {notif.avatar?.[0] || '◆'}
                </Avatar>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                    <Box>
                      <Typography level="title-sm" noWrap>
                        {notif.title}
                      </Typography>
                      <Typography level="body-xs" sx={{ color: '#a0a0a0', mt: 0.5 }}>
                        {notif.message}
                      </Typography>
                    </Box>

                    {/* Dismiss Button */}
                    <IconButton
                      size="sm"
                      variant="plain"
                      color="neutral"
                      onClick={() => handleDismiss(notif.id)}
                      sx={{ mt: -0.5 }}
                    >
                      <X size={16} />
                    </IconButton>
                  </Stack>

                  {/* Footer */}
                  <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
                    <Typography level="body-xs" sx={{ color: '#808080' }}>
                      {new Date(notif.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>

                    {!notif.read && (
                      <Chip
                        size="sm"
                        variant="soft"
                        color="primary"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        Mark as read
                      </Chip>
                    )}

                    {notif.action && (
                      <Button
                        size="sm"
                        variant="soft"
                        color="primary"
                        onClick={() => {
                          window.location.href = notif.action!.url;
                          handleMarkAsRead(notif.id);
                        }}
                      >
                        {notif.action.label}
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Card>
          ))
        )}
      </Stack>

      {compact && notifications.length > 3 && (
        <Button fullWidth variant="plain" size="sm" sx={{ mt: 1 }}>
          View all {notifications.length} notifications
        </Button>
      )}
    </Box>
  );
};

export default Notifications;
