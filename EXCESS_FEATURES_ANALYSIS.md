# Eksik Özellikler Analizi - Frontend

## ✅ MEVCUT OLAN ÖZELLİKLER

### Academic Management
- ✅ Course Catalog Page (`/courses`) - Liste, arama, filtreleme var
- ✅ Course Detail Page (`/courses/:id`) - Ders bilgileri, prerequisites (link yok), sections, enroll modal var
- ✅ My Courses Page (`/my-courses`) - Kayıtlı dersler, attendance %, drop button var
- ✅ Grades Page (`/grades`) - Notlar listesi, GPA/CGPA gösterimi var (mock data)
- ✅ Gradebook Page (`/gradebook/:sectionId`) - Öğrenci listesi, not girişi var (mock data)

### GPS Attendance
- ✅ Start Attendance Page (`/attendance/start`) - Section seçimi, geofence radius, duration var
- ✅ Give Attendance Page (`/attendance/give/:sessionId`) - GPS izin alma var (map yok)
- ✅ My Attendance Page (`/my-attendance`) - Attendance stats, excuse request modal var
- ✅ Attendance Report Page (`/attendance/report/:sectionId`) - Öğrenci listesi, date filter var (Excel export yok)
- ✅ Excuse Requests Page (`/excuse-requests`) - Talep formu ve listesi var

---

## ❌ EKSİK OLAN ÖZELLİKLER (Backend Olmadan Eklenebilir)

### 1. Course Detail Page - Prerequisites Linkleri
**Mevcut:** Prerequisites chip olarak gösteriliyor
**Eksik:** Prerequisites'lere tıklanınca ilgili course detail sayfasına yönlendirme
**Çözüm:** `<Link>` component'i ekle

### 2. Course Detail Page - Description
**Durum:** Data'da varsa gösteriliyor ✅ (mevcut kodda var)

### 3. Start Attendance Page - QR Code Display
**Mevcut:** QR kodu text olarak gösteriliyor
**Eksik:** Görsel QR code oluşturma ve gösterimi
**Çözüm:** `qrcode` veya `react-qr-code` library ekle

### 4. Start Attendance Page - Real-time Attendance Count
**Mevcut:** Yok
**Eksik:** Oturum başladıktan sonra kaç kişi yoklama verdiğini gösteren sayaç
**Not:** Backend olmadan mock data ile gösterilebilir

### 5. Start Attendance Page - Classroom Auto-select
**Mevcut:** Section seçimi var ama classroom bilgisi yok
**Eksik:** Section seçildiğinde otomatik olarak classroom bilgisi gösterilmesi
**Not:** Backend olmadan mock classroom data eklenebilir

### 6. Give Attendance Page - Session Info (Course, Time, Location)
**Mevcut:** Sadece sessionId gösteriliyor
**Eksik:** Ders adı, zaman, lokasyon bilgileri
**Not:** Backend olmadan mock data ile gösterilebilir

### 7. Give Attendance Page - Mini Map (Leaflet)
**Mevcut:** GPS koordinatları text olarak gösteriliyor
**Eksik:** 
  - Leaflet harita bileşeni
  - Kullanıcının mevcut konumunu gösterme
  - Sınıfın konumunu gösterme
  - Aralarındaki mesafeyi gösterme
**Çözüm:** `react-leaflet` ve `leaflet` library ekle

### 8. Give Attendance Page - Distance Calculator
**Mevcut:** Yok
**Eksik:** Kullanıcı konumu ile sınıf konumu arasındaki mesafeyi metre cinsinden gösterme
**Çözüm:** Haversine formula ile client-side hesaplama

### 9. Give Attendance Page - Location Accuracy Indicator
**Mevcut:** Yok
**Eksik:** GPS doğruluğunu gösteren gösterge (accuracy değeri)
**Çözüm:** `navigator.geolocation.getCurrentPosition` accuracy bilgisini kullan

### 10. Give Attendance Page - Scan QR Code Button (Bonus)
**Mevcut:** Yok
**Eksik:** QR kod okuma özelliği
**Çözüm:** `react-qr-reader` veya `html5-qrcode` library ekle

### 11. My Attendance Page - Attendance Chart
**Mevcut:** Sadece tablo var
**Eksik:** Attendance percentage'in zaman içindeki değişimini gösteren line chart
**Çözüm:** `recharts` veya `chart.js` library ekle

### 12. Attendance Report Page - Excel Export
**Mevcut:** PDF export butonu var (mock)
**Eksik:** Excel export butonu ve işlevi
**Çözüm:** `xlsx` veya `exceljs` library ekle (client-side export)

### 13. Grades Page - Grade Statistics Chart
**Mevcut:** Sadece tablo var
**Eksik:** 
  - Grade distribution chart (bar chart - A, B, C, D, F dağılımı)
  - GPA trend chart (line chart - dönemler arası GPA değişimi)
**Çözüm:** `recharts` veya `chart.js` library ekle

### 14. Grades Page - Download Transcript PDF
**Mevcut:** Buton var ama sadece toast gösteriyor
**Eksik:** Gerçek PDF oluşturma
**Çözüm:** `jspdf` veya `react-pdf` library ile client-side PDF oluşturma

### 15. Gradebook Page - Auto-calculate Letter Grade
**Mevcut:** Vize ve final notları giriliyor
**Eksik:** Otomatik harf notu hesaplama (A, B, C, D, F)
**Çözüm:** Client-side hesaplama fonksiyonu (vize %40, final %60 gibi)

### 16. Gradebook Page - Bulk Actions (Export, Send Notifications)
**Mevcut:** Yok
**Eksik:** 
  - Excel export butonu
  - Send notifications butonu (mock olarak toast gösterebilir)
**Çözüm:** Excel export için `xlsx`, notifications için mock UI

### 17. GPS & Maps Components (Yeni Component'ler)
**Eksik:**
  - GPS permission handler component (reusable)
  - Map component (Leaflet wrapper)
  - Distance calculator utility
  - Location accuracy indicator component
**Çözüm:** Yeni component'ler oluştur

### 18. Charts & Visualizations (Yeni Component'ler)
**Eksik:**
  - AttendanceChart component (line chart)
  - GradeDistributionChart component (bar chart)
  - GPATrendChart component (line chart)
**Çözüm:** Chart library ile reusable component'ler

---

## 📦 GEREKLİ YENİ KÜTÜPHANELER

### Harita ve GPS
- `leaflet` - Harita library
- `react-leaflet` - Leaflet React wrapper
- `@types/leaflet` (dev) - TypeScript types

### QR Code
- `qrcode` veya `react-qr-code` - QR kod oluşturma
- `react-qr-reader` veya `html5-qrcode` - QR kod okuma (bonus)

### Charts
- `recharts` veya `chart.js` + `react-chartjs-2` - Grafik kütüphanesi

### Export
- `xlsx` veya `exceljs` - Excel export
- `jspdf` - PDF oluşturma

### Utility
- `geolib` (opsiyonel) - GPS mesafe hesaplama için yardımcı

---

## 🎯 ÖNCELİKLENDİRME

### Yüksek Öncelik (Kullanıcı Deneyimi İçin Kritik)
1. ✅ Give Attendance Page - Mini Map (Leaflet)
2. ✅ Give Attendance Page - Distance Calculator
3. ✅ Give Attendance Page - Session Info
4. ✅ Start Attendance Page - QR Code Display
5. ✅ Course Detail Page - Prerequisites Links

### Orta Öncelik (Görselleştirme ve İyileştirmeler)
6. ✅ Grades Page - Grade Statistics Charts
7. ✅ My Attendance Page - Attendance Chart
8. ✅ Gradebook Page - Auto-calculate Letter Grade
9. ✅ Attendance Report Page - Excel Export

### Düşük Öncelik (Nice-to-have)
10. ✅ Give Attendance Page - QR Code Scanner
11. ✅ GPS Components (reusable)
12. ✅ Chart Components (reusable)
13. ✅ Grades Page - PDF Transcript (client-side)

---

## 📝 NOTLAR

- Tüm özellikler backend API'ye bağımlı olmadan, mock data ile implement edilebilir
- Chart'lar için mock data ile örnek grafikler oluşturulabilir
- PDF ve Excel export işlemleri client-side yapılabilir
- GPS mesafe hesaplama Haversine formula ile client-side yapılabilir
- QR code oluşturma ve okuma tamamen client-side yapılabilir

