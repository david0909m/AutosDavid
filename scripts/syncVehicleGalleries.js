import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const indexPath = path.join(rootDir, "public", "data", "vehiculos", "index.json");
const manifest = JSON.parse(fs.readFileSync(indexPath, "utf8"));

let updatedCount = 0;

for (const entry of manifest) {
  const vehicleId = entry.id;
  const imgDir = path.join(rootDir, "public", "images", "vehiculos", vehicleId);

  if (!fs.existsSync(imgDir)) {
    console.warn(`Directorio no existe: ${imgDir}`);
    continue;
  }

  // Get all images in directory, sorted
  const files = fs.readdirSync(imgDir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && !/-optimized\./i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/-(\d+)\.[^.]+$/)?.[1] || "0", 10);
      const numB = parseInt(b.match(/-(\d+)\.[^.]+$/)?.[1] || "0", 10);
      return numA - numB;
    });

  const relativeGallery = files.map(f => `./images/vehiculos/${vehicleId}/${f}`);
  const optimizedPrimary = fs.readdirSync(imgDir)
    .find(f => /-optimized\.(jpg|jpeg|png|webp)$/i.test(f));
  if (optimizedPrimary && relativeGallery.length > 0) {
    relativeGallery[0] = `./images/vehiculos/${vehicleId}/${optimizedPrimary}`;
  }
  const primaryImage = relativeGallery[0] || entry.image;

  // Update manifest entry
  entry.image = primaryImage;

  // Update vehicle JSON
  const vehicleFilePath = path.join(rootDir, "public", entry.path);
  if (fs.existsSync(vehicleFilePath)) {
    const vehicleData = JSON.parse(fs.readFileSync(vehicleFilePath, "utf8"));
    vehicleData.image = primaryImage;
    vehicleData.gallery = relativeGallery;
    fs.writeFileSync(vehicleFilePath, JSON.stringify(vehicleData, null, 2) + "\n", "utf8");
    updatedCount++;
    console.log(`Updated ${vehicleId}: ${relativeGallery.length} images`);
  }
}

// Save updated index.json
fs.writeFileSync(indexPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`\nGalerías actualizadas: ${updatedCount} archivos de vehículo e index.json.`);
