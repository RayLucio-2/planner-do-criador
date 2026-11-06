import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// VITE_ROUTER=memory gera a versão de demonstração (um arquivo só, imagens embutidas)
const demo = process.env.VITE_ROUTER === 'memory'
export default defineConfig({ plugins: [react()], base: './', build: { assetsInlineLimit: demo ? 100000000 : 4096 } })
