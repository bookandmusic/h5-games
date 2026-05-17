/* eslint-disable no-undef */
import imagemin from 'imagemin'
import imageminPngquant from 'imagemin-pngquant'
import fs from 'fs'
import path from 'path'

const glob = await import('glob')

const files = await glob.glob(['src/**/*.png', 'public/**/*.png'])

console.log(`Found ${files.length} PNG files to optimize`)

let totalSaved = 0

for (const file of files) {
  const originalSize = fs.statSync(file).size

  try {
    await imagemin([file], {
      destination: path.dirname(file),
      plugins: [
        imageminPngquant({
          quality: [0.85, 1],
          speed: 1,
        }),
      ],
    })

    const newSize = fs.statSync(file).size
    const saved = originalSize - newSize
    totalSaved += saved

    if (saved > 0) {
      const percent = ((saved / originalSize) * 100).toFixed(1)
      console.log(
        `  ✓ ${file} (${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB, -${percent}%)`
      )
    }
  } catch (error) {
    console.log(`  ✗ ${file} (skipped: ${error.message})`)
  }
}

console.log(`\nTotal saved: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`)
