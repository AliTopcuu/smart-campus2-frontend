# Give Attendance Page - Test Talimatları

## Ekran Görüntüsü İçin Manuel Test

Sayfayı görmek için tarayıcı console'unda şu adımları izleyin:

### 1. Tarayıcı Console'unu Açın (F12)

### 2. Console'a şu kodu yapıştırın (satır satır çalıştırın):

```javascript
// Mock authentication data
const userData = {
  id: '1',
  email: 'student@test.com',
  role: 'student',
  name: 'Test Student',
  studentNumber: '20201234'
};

localStorage.setItem('smartcampus.auth:access', 'mock-access-token');
localStorage.setItem('smartcampus.auth:refresh', 'mock-refresh-token');
localStorage.setItem('smartcampus.auth:user', JSON.stringify(userData));
localStorage.setItem('smartcampus.auth:rememberMe', 'true');

// Sayfayı yenile (location.href yerine reload kullanın)
window.location.reload();
```

### 2b. Sayfa yüklendikten sonra (hala login sayfasındaysanız):

```javascript
// Tekrar localStorage'a user ekleyin ve direkt sayfaya gidin
const userData = JSON.parse(localStorage.getItem('smartcampus.auth:user') || '{"role":"student"}');
if (userData.role === 'student') {
  window.location.href = '/attendance/give/test-session-123';
}
```

### 3. Sayfa yüklendikten sonra:

- **Session Info Card** göreceksiniz (Ders bilgileri, zaman, sınıf)
- **Location Map Card** göreceksiniz (Leaflet haritası - sınıf konumu kırmızı marker ile)
- **"Konumumu Al"** butonuna tıklayın (GPS izni isteyecek)
- Konum alındıktan sonra:
  - Haritada mavi marker (sizin konumunuz) görünecek
  - Mesafe hesaplanacak
  - Geofence içinde/dışında durumu gösterilecek
  - Accuracy değeri gösterilecek
  - "Yoklamayı Gönder" butonu aktif olacak

### 4. Ekran Görüntüsü Alın

- F12 ile Developer Tools'u kapatın
- Sayfanın ekran görüntüsünü alın (Windows: Win+Shift+S, Mac: Cmd+Shift+4)

## Sayfa İçeriği Özeti

### Üst Kısım:
- **Başlık:** "Yoklama Ver"

### 1. Session Info Card:
- Ders kodu ve adı (CENG204 - Veri Yapıları ve Algoritmalar)
- Başlangıç - Bitiş saati
- Sınıf adı (B Blok 101)
- Oturum ID

### 2. Location Map Card:
- İnteraktif Leaflet haritası
- Kırmızı marker: Sınıf konumu
- Kırmızı daire: Geofence (15m radius)
- Mavi marker: Kullanıcı konumu (konum alındığında)

### 3. Actions Card:
- "Konumumu Al" butonu
- Konum bilgileri (koordinatlar, accuracy, mesafe)
- Geofence durumu (chip)
- "Yoklamayı Gönder" butonu

## Özellikler

✅ Session bilgileri gösterimi
✅ İnteraktif harita (Leaflet)
✅ GPS konum alma
✅ Mesafe hesaplama (Haversine)
✅ Geofence kontrolü
✅ Location accuracy gösterimi
✅ Loading states
✅ Error handling

