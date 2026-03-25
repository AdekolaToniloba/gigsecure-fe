import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../public/assets/images');

async function optimizeImages() {
    try {
        const files = await fs.promises.readdir(imagesDir);
        const pngFiles = files.filter(file => file.endsWith('.png'));

        if (pngFiles.length === 0) {
            console.log('No PNG files found to optimize.');
            return;
        }

        console.log(`Found ${pngFiles.length} PNG files. Starting optimization...`);

        for (const file of pngFiles) {
            const inputPath = path.join(imagesDir, file);
            const outputPath = path.join(imagesDir, file.replace('.png', '.webp'));

            // Convert to WebP
            await sharp(inputPath)
                .webp({ quality: 80 })
                .toFile(outputPath);

            console.log(`Converted: ${file} -> ${path.basename(outputPath)}`);

            // Delete the original PNG to save space
            await fs.promises.unlink(inputPath);
            console.log(`Deleted original: ${file}`);
        }

        console.log('Optimization complete!');
    } catch (error) {
        console.error('Error optimizing images:', error);
        process.exit(1);
    }
}

optimizeImages();
