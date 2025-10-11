import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import fs from 'fs'


// https://vite.dev/config/
export default defineConfig((mode) => {

  const candidates = [
    '/home/naeem-md93/Shared',
    '/run/user/1000/gvfs/smb-share:server=an515-55.local,share=shared'
  ]

  const chosenDir = candidates.find(dir => {
    try {
      return fs.existsSync(dir) && (
        fs.existsSync(resolve(dir, '.env')) ||
        fs.existsSync(resolve(dir, `.env.${mode}`))
      )
    } catch (err) {
      console.log(err);
      return false
    }
  }) || process.cwd() // fallback to project root

  // load all env vars from chosenDir; passing '' as prefix returns all keys
  const env = loadEnv(mode, chosenDir, '')

  const host = env.VITE_CLIENT_ADDR || env.VITE_HOST || 'localhost'
  const port = Number(env.VITE_CLIENT_PORT || env.VITE_PORT) || 5173

  return {
    plugins: [
      react(),
      tailwindcss()
    ],

    envDir: resolve(chosenDir),
    envPrefix: "VITE_",
    server: {
      host,
      port,
    }
  }
})