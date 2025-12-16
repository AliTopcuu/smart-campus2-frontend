import * as XLSX from 'xlsx';

/**
 * Yoklama raporlarını Excel formatında export eder
 * @param {Array} sessions - Yoklama oturumları listesi
 * @param {string} filename - İndirilecek dosya adı (opsiyonel)
 */
export const exportAttendanceReportToExcel = (sessions, filename = 'yoklama-raporu') => {
  if (!sessions || sessions.length === 0) {
    throw new Error('Export edilecek yoklama oturumu bulunamadı');
  }

  // Excel workbook oluştur
  const workbook = XLSX.utils.book_new();

  // Her session için ayrı sheet oluştur
  const usedSheetNames = new Set();
  sessions.forEach((session, index) => {
    // Sheet adı: Ders kodu ve section numarası (max 31 karakter - Excel limiti)
    let sectionName = session.sectionName || `Session ${session.id}`;
    
    // Session kodu veya ID ekleyerek benzersizlik sağla
    if (session.code) {
      sectionName = `${sectionName} (${session.code})`;
    } else if (session.id) {
      sectionName = `${sectionName} (#${session.id})`;
    }
    
    // Eğer aynı isim varsa, index ekle
    let sheetName = sectionName;
    let counter = 1;
    while (usedSheetNames.has(sheetName)) {
      sheetName = `${sectionName.substring(0, 25)}_${counter}`;
      counter++;
    }
    usedSheetNames.add(sheetName);
    
    // Excel'in 31 karakter limitini kontrol et
    if (sheetName.length > 31) {
      sheetName = sheetName.substring(0, 28) + '...';
    }

    // Başlık satırları
    const headers = [
      ['Yoklama Raporu'],
      [`Ders: ${session.sectionName || 'Bilinmeyen'}`],
      [`Yoklama Kodu: ${session.code || 'N/A'}`],
      [`Tarih: ${formatDate(session.startTime)}`],
      [`Başlangıç: ${formatDateTime(session.startTime)}`],
      [`Bitiş: ${formatDateTime(session.endTime)}`],
      [`Durum: ${getStatusText(session.status)}`],
      [`Geofence Yarıçapı: ${session.geofenceRadius || 'N/A'}m`],
      [`Toplam Katılım: ${session.recordCount || 0} öğrenci`],
      [], // Boş satır
      ['Öğrenci Listesi'],
      [], // Boş satır
      // Tablo başlıkları
      ['Öğrenci Adı', 'Öğrenci Numarası', 'Email', 'Katılım Saati', 'Katılım Tarihi', 'Mesafe (m)', 'Durum', 'Notlar'],
    ];

    // Öğrenci verilerini hazırla
    const dataRows = [];
    if (session.records && session.records.length > 0) {
      session.records.forEach((record) => {
        const studentName = record.student?.fullName || 'Bilinmeyen';
        const studentNumber = record.student?.studentNumber || '-';
        const email = record.student?.email || '-';
        const checkInTime = formatTime(record.checkInTime || record.checkedInAt);
        const checkInDate = formatDate(record.checkInTime || record.checkedInAt);
        const distance = record.distanceFromCenter || record.distance 
          ? `${Math.round(record.distanceFromCenter || record.distance)}`
          : 'N/A';
        const status = getRecordStatus(record);
        const notes = getRecordNotes(record);

        dataRows.push([
          studentName,
          studentNumber,
          email,
          checkInTime,
          checkInDate,
          distance,
          status,
          notes,
        ]);
      });
    } else {
      dataRows.push(['Bu oturuma henüz öğrenci katılmamış.']);
    }

    // Tüm verileri birleştir
    const worksheetData = [...headers, ...dataRows];

    // Worksheet oluştur
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Column genişliklerini ayarla
    worksheet['!cols'] = [
      { wch: 25 }, // Öğrenci Adı
      { wch: 15 }, // Öğrenci Numarası
      { wch: 30 }, // Email
      { wch: 12 }, // Katılım Saati
      { wch: 12 }, // Katılım Tarihi
      { wch: 12 }, // Mesafe
      { wch: 15 }, // Durum
      { wch: 30 }, // Notlar
    ];

    // Workbook'a sheet ekle
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  // Dosyayı indir
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fullFilename);
};

/**
 * Tarih formatlar
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  });
};

/**
 * Tarih ve saat formatlar
 */
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  });
};

/**
 * Saat formatlar
 */
const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Istanbul',
  });
};

/**
 * Session durumunu metne çevirir
 */
const getStatusText = (status) => {
  const statusMap = {
    active: 'Aktif',
    closed: 'Kapalı',
    cancelled: 'İptal Edildi',
  };
  return statusMap[status] || status || 'Bilinmeyen';
};

/**
 * Öğrenci kayıt durumunu metne çevirir
 */
const getRecordStatus = (record) => {
  if (record.isExcused) return 'Mazeretli';
  if (record.isFlagged) return 'İşaretli';
  if (record.isWithinGeofence === false) return 'Geofence Dışında';
  return 'Normal';
};

/**
 * Öğrenci kayıt notlarını oluşturur
 */
const getRecordNotes = (record) => {
  const notes = [];
  if (record.flagReason) notes.push(record.flagReason);
  if (record.isExcused && record.flagReason) notes.push('Mazeret onaylandı');
  return notes.join('; ') || '-';
};
