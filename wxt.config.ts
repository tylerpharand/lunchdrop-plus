import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    // Arc starts, then never answers the Chrome DevTools pipe WXT uses to
    // install the extension, so `yarn dev` hangs. Load the dev build by hand.
    disabled: true,
  },
  manifest: {
    name: 'Lunchdrop+',
    description: 'Tools for Lunchdrop.',
    permissions: ['storage'],
    browser_specific_settings: {
      gecko: {
        id: 'lunchdrop-plus@lunchdrop-plus.local',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
})
