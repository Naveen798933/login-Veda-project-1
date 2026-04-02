import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack, Card, Avatar, Divider, Alert } from '@mui/joy';
import { Save, History, RotateCcw } from 'lucide-react';
import api from '../api/axios';

interface Version {
  _id: string;
  document: string;
  versionName: string;
  author: { firstName: string; lastName: string; avatarColor: string; email: string };
  createdAt: string;
}

interface HistoryTimelineProps {
  docId: string;
}

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ docId }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    fetchVersions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const fetchVersions = async () => {
    try {
      const { data } = await api.get(`/documents/${docId}/versions`);
      setVersions(data);
    } catch {
      console.error('Failed to fetch versions');
    }
  };

  const handleCreateSnapshot = async () => {
    setLoading(true);
    try {
      const versionName = prompt('Enter a name for this snapshot (e.g. "Draft v1"):') || `Snapshot ${new Date().toLocaleTimeString()}`;
      await api.post(`/documents/${docId}/snapshots`, { versionName });
      setStatus({ type: 'success', text: 'Snapshot saved successfully' });
      fetchVersions();
    } catch {
      setStatus({ type: 'error', text: 'Failed to create snapshot' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string, versionName: string) => {
    if (!window.confirm(`Restore to "${versionName}"? Current version will be saved as backup.`)) return;
    setLoading(true);
    try {
      await api.post(`/documents/${docId}/versions/${versionId}/restore`);
      setStatus({ type: 'success', text: `Restored to "${versionName}". Current version saved as backup.` });
      fetchVersions();
      // Trigger reload in parent component
      window.dispatchEvent(new CustomEvent('document:restored'));
    } catch {
      setStatus({ type: 'error', text: 'Failed to restore version' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography level="title-md" startDecorator={<History size={18} />}>
          Version History
        </Typography>
        <Button size="sm" startDecorator={<Save size={16} />} loading={loading} onClick={handleCreateSnapshot}>
          Save Snapshot
        </Button>
      </Stack>

      {status && (
        <Alert color={status.type === 'error' ? 'danger' : 'success'} variant="soft" sx={{ mb: 2 }}>
          {status.text}
        </Alert>
      )}

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {versions.length === 0 ? (
          <Typography level="body-sm" sx={{ color: '#e0e0e0', textAlign: 'center', mt: 4 }}>
            No snapshots found. Save one to track changes.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {versions.map((ver, idx) => (
              <Card key={ver._id} variant="outlined" sx={{ p: 2, bgcolor: 'background.surface' }}>
                <Typography level="title-sm" sx={{ mb: 1 }}>
                  {ver.versionName} {idx === 0 && '(Current)'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar size="sm" sx={{ bgcolor: ver.author.avatarColor }}>
                    {ver.author.firstName[0]}
                  </Avatar>
                  <Box>
                    <Typography level="body-xs" sx={{ fontWeight: 'bold' }}>{ver.author.firstName} {ver.author.lastName}</Typography>
                    <Typography level="body-xs" sx={{ color: '#a0a0a0' }}>
                      {new Date(ver.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
                <Button size="sm" variant="soft" color="neutral" startDecorator={<RotateCcw size={16} />} onClick={() => handleRestore(ver._id, ver.versionName)} loading={loading}>
                  Restore this version
                </Button>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default HistoryTimeline;
