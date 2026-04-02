import React, { useEffect, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { Box, Typography, Avatar, Stack, Tooltip, Alert } from '@mui/joy';
import { WifiOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface EditorProps {
  docId: string;
}

const CollaborativeEditor: React.FC<EditorProps> = ({ docId }) => {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [users, setUsers] = useState<{name: string; color: string}[]>([]);

  // Initialize Yjs document, awareness, and socket
  const { ydoc, socket, awareness, provider } = useMemo(() => {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);
    const provider = { awareness };
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { 
        docId, 
        userId: user?.id,
        userName: `${user?.firstName} ${user?.lastName}`,
        userColor: user?.avatarColor 
      },
      transports: ['websocket'],
    });
    return { ydoc, socket, awareness, provider };
  }, [docId, user]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider,
        user: { 
          name: `${user?.firstName} ${user?.lastName}`, 
          color: user?.avatarColor || '#bcbcbc'
        },
      }),
    ],
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] text-white p-4',
        },
    },
  });

  useEffect(() => {
    if (!socket || !ydoc) return;

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));

    // Handle incoming Yjs updates
    socket.on('sync-update', (update: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    socket.on('sync-step-1', (stateVector: ArrayBuffer) => {
      socket.emit('sync-step-2', Y.encodeStateAsUpdate(ydoc, new Uint8Array(stateVector)));
    });

    // Send outgoing Yjs updates
    ydoc.on('update', (update, origin) => {
      if (origin !== 'socket') {
        socket.emit('sync-update', update);
      }
    });

    // Handle Awareness (Cursors)
    awareness.on('update', ({ added, updated, removed }: { added: Set<number>; updated: Set<number>; removed: Set<number> }, origin: string) => {
      if (origin === 'local') {
        const changedClients = Array.from(added).concat(Array.from(updated)).concat(Array.from(removed));
        const update = encodeAwarenessUpdate(awareness, changedClients);
        socket.emit('awareness-update', update);
      }
    });

    socket.on('awareness-update', (update: ArrayBuffer) => {
      applyAwarenessUpdate(awareness, new Uint8Array(update), 'socket');
    });

    // Track active users
    const updateUsersList = () => {
      const states = Array.from(awareness.getStates().values()) as { user?: { name: string; color: string } }[];
      const activeUsers = states.map(s => s.user).filter((u): u is {name: string, color: string} => !!u);
      setUsers(activeUsers);
    };

    awareness.on('change', updateUsersList);

    return () => {
      socket.disconnect();
      ydoc.destroy();
      awareness.destroy();
    };
  }, [socket, ydoc, awareness]);

  if (!editor) return null;

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', p: 3 }}>
      {status === 'disconnected' && (
        <Alert 
          color="danger" 
          variant="solid" 
          startDecorator={<WifiOff />}
          sx={{ mb: 2, borderRadius: 'md', display: 'flex', justifyContent: 'center' }}
        >
          Connection Lost - Changes will be saved locally and synced when reconnected.
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
        <Typography level="body-xs" sx={{ color: status === 'connected' ? 'success.300' : 'danger.300', mr: 1 }}>
          ● {status.toUpperCase()}
        </Typography>
        {users.map((u, i) => (
          <Tooltip key={i} title={u.name} variant="soft">
            <Avatar variant="solid" size="sm" sx={{ bgcolor: u.color }}>{u.name[0]}</Avatar>
          </Tooltip>
        ))}
      </Stack>
      
      <Box sx={{ 
        bgcolor: 'rgba(255,255,255,0.03)', 
        borderRadius: 'xl', 
        border: '1px solid rgba(255,255,255,0.1)',
        minHeight: 600,
        boxShadow: 'md',
        transition: 'all 0.3s',
        '&:focus-within': { borderColor: 'primary.500', bgcolor: 'rgba(255,255,255,0.05)' }
      }}>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default CollaborativeEditor;
