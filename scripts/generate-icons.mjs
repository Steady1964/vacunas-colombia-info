import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

await mkdir(new URL('../public/icons/', import.meta.url), { recursive: true })
const source = fileURLToPath(new URL('../app/icon.svg', import.meta.url))
for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
  const destination = new URL(`../public/icons/${name}`, import.meta.url)
  await sharp(source).resize(size, size).png().toFile(fileURLToPath(destination))
  console.log(`${name}: ${size} × ${size}`)
}
