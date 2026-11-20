import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/**
 * Subsets the Arabic + Urdu web fonts to exactly the letters used in
 * src/config/wedding.ts (Google Fonts `text=`), so they cost a few KB
 * instead of hundreds. Edit the config and the subset follows.
 */
function scriptFontSubset(): Plugin {
  const css = () => {
    const src = readFileSync(new URL('./src/config/wedding.ts', import.meta.url), 'utf8')
    // Arabic, Arabic Supplement, presentation forms A/B, ZWNJ/ZWJ
    const chars = new Set(src.match(/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻾‌‍]/gu) ?? [])
    const text = encodeURIComponent([...chars].sort().join('') + ' ')
    return `https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Nastaliq+Urdu:wght@500&display=swap&text=${text}`
  }
  return {
    name: 'script-font-subset',
    transformIndexHtml: (html) => html.replace('%SCRIPT_FONTS%', css()),
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), scriptFontSubset()],
})
