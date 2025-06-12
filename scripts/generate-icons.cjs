// scripts/generate-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Common icon sizes for web apps
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 1024, name: 'icon-1024x1024.png' },
];

async function generateIcons() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🎨 Generating PNG icons from SVG...');

    // Read the SVG file
    const svgBuffer = fs.readFileSync(inputSvg);

    // Generate each size
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);

      await sharp(svgBuffer)
        .resize(size, size)
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toFile(outputPath);

      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    // Also generate a general icon.png (192x192 is good default)
    await sharp(svgBuffer)
      .resize(192, 192)
      .png({
        quality: 100,
        compressionLevel: 9,
      })
      .toFile(path.join(outputDir, 'icon.png'));

    console.log('✅ Generated icon.png (192x192)');

    console.log('🎉 All icons generated successfully!');

    // List all generated files
    console.log('\n📁 Generated files:');
    sizes.forEach(({ name }) => console.log(`   ${name}`));
    console.log('   icon.png');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
