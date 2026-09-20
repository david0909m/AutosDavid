import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

function createNotFoundPage() {
  return {
    name: 'create-not-found-page',
    closeBundle() {
      const distDirectory = resolve(process.cwd(), 'dist')
      const indexPath = resolve(distDirectory, 'index.html')
      const notFoundPath = resolve(distDirectory, '404.html')
      const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').pop() || 'AutosDavid'
      const baseHref = `/${repositoryName}/`
      const indexContent = readFileSync(indexPath, 'utf8')
      const notFoundContent = indexContent.replace(
        '<head>',
        `<head>\n    <base href="${baseHref}">`,
      )

      writeFileSync(notFoundPath, notFoundContent, 'utf8')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), createNotFoundPage()],
  base: './',
})
