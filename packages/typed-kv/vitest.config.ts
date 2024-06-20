import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'
import path from 'path'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
  resolve: {
    alias: {
      '@typed-kv': path.resolve(__dirname, './src'),
    },
  },
})
