import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs'; // Dosya sistemi modülünü ekledik

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = join(__dirname, 'dist');

console.log(`🔍 Başlangıç Kontrolleri:`);
console.log(`📂 Hedeflenen Static Klasörü: ${DIST_DIR}`);

// Debug: Build klasörü var mı kontrol et
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ HATA: "dist" klasörü bulunamadı! Railway Build Command çalışmamış olabilir.');
  console.error('💡 ÇÖZÜM: Railway -> Settings -> Build Command kısmına "npm run build" yazın.');
} else {
  console.log('✅ "dist" klasörü mevcut.');
  
  if (fs.existsSync(join(DIST_DIR, 'index.html'))) {
    console.log('✅ "index.html" dosyası bulundu.');
  } else {
    console.error('❌ HATA: "dist" klasörü var ama içinde "index.html" yok!');
  }
}

// Static dosyaları sun
app.use(express.static(DIST_DIR));

// Health check endpoint'i (Bad Gateway alıp almadığını test etmek için)
app.get('/health', (req, res) => {
  res.status(200).send('OK - Server is healthy');
});

// SPA Routing
app.get('*', (req, res) => {
  const indexPath = join(DIST_DIR, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ 404 HATA: İstenen dosya yok: ${indexPath}`);
    return res.status(500).send('Build files not found. Check server logs.');
  }

  res.sendFile(indexPath);
});

// Global hata yakalayıcı
app.use((err, req, res, next) => {
  console.error('🔥 Sunucu Hatası:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});