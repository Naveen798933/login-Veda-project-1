import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@tiptap\/pm$/, replacement: '@tiptap/pm/state' },
      { find: /^y-protocols$/, replacement: 'y-protocols/dist/sync.cjs' },
      { find: '@collaboration/shared', replacement: fileURLToPath(new URL('../../packages/shared/index.ts', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@mui/system/Unstable_Grid', replacement: '@mui/system/Grid' },
    ],
    dedupe: [
      'react',
      'react-dom',
      'yjs',
      'prosemirror-model',
      'prosemirror-state',
      'prosemirror-view',
      'prosemirror-transform',
      '@tiptap/pm',
      '@tiptap/core'
    ]
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-cursor',
      '@tiptap/extension-history',
      '@tiptap/y-tiptap',
      'yjs',
      'y-prosemirror',
      'y-protocols',
      'y-websocket',
      '@tiptap/pm',
      '@tiptap/core',
      'prosemirror-model',
      'prosemirror-state',
      'prosemirror-view',
      'prosemirror-transform',
      'socket.io-client',
      '@mui/joy',
      '@emotion/react',
      '@emotion/styled',
      '@mui/system',
      '@mui/utils',
      'y-protocols',
      'y-websocket',
      '@tiptap/react',
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-cursor',
      '@tiptap/pm/state',
      '@tiptap/pm/model',
      '@tiptap/pm/view',
      '@tiptap/pm/transform'
    ],
    exclude: []
  },
  server: {
    port: 5173,
    strictPort: false
  }
})
