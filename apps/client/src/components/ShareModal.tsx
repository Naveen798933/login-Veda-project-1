import React, { useState } from 'react';
import { Box, Modal, ModalDialog, Typography, Input, Button, Stack, Select, Option, Divider, IconButton, Alert } from '@mui/joy';
import { Copy, Mail } from 'lucide-react';
import api from '../api/axios';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  docId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, docId }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post(`/documents/${docId}/invite`, { email, role });
      setStatus({ type: 'success', text: `Invitation sent to ${email}` });
      setEmail('');
    } catch {
      setStatus({ type: 'error', text: 'Failed to send invite' });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/document/${docId}`;
    navigator.clipboard.writeText(link);
    setStatus({ type: 'success', text: 'Link copied to clipboard!' });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog variant="outlined" sx={{ width: 450, borderRadius: 'md', bgcolor: 'background.surface' }}>
        <Typography level="h4" sx={{ mb: 0.5 }}>Share Document</Typography>
        <Typography level="body-sm" sx={{ mb: 2, color: '#e0e0e0' }}>
          Invite collaborators or share a public link.
        </Typography>

        {status && (
          <Alert color={status.type === 'error' ? 'danger' : 'success'} variant="soft" sx={{ mb: 2 }}>
            {status.text}
          </Alert>
        )}

        <form onSubmit={handleShare}>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Input
              type="email"
              placeholder="Add people by email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startDecorator={<Mail size={16} />}
              sx={{ flex: 1 }}
            />
            <Select value={role} onChange={(_, newValue) => setRole(newValue as 'editor'|'viewer')} sx={{ width: 110 }}>
              <Option value="viewer">Viewer</Option>
              <Option value="editor">Editor</Option>
            </Select>
            <Button type="submit" loading={loading} disabled={!email.trim()}>Invite</Button>
          </Stack>
        </form>

        <Divider sx={{ mb: 2 }} />

        <Typography level="title-sm" sx={{ mb: 1 }}>General Access</Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: 'background.level1', borderRadius: 'sm' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton variant="soft" color="neutral" size="sm" onClick={copyLink}>
              <Copy size={16} />
            </IconButton>
            <Box>
              <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>Copy Link</Typography>
              <Typography level="body-xs" sx={{ color: '#a0a0a0' }}>Anyone with this link can view</Typography>
            </Box>
          </Stack>
          <Button size="sm" variant="outlined" color="primary" onClick={copyLink}>
            Copy
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
};

export default ShareModal;
