# Frontend - SmartCampus Part 1

React 19 + Vite + Material-UI tabanlı modern frontend uygulaması.

## 🔧 Kullanılan Teknolojiler

- **React 19** - UI framework
- **Vite 7** - Build tool ve dev server
- **React Router v7** - Client-side routing
- **Material-UI (MUI) v7** - UI component library
- **React Hook Form** - Form management
- **Yup** - Schema validation
- **Axios** - HTTP client
- **TanStack Query** - Server state management
- **Context API** - Client state management
- **React Toastify** - Toast notifications

## 📋 Gereksinimler

- Node.js 18+
- npm 10+

## 🚀 Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Ortam değişkenlerini ayarlayın (`.env` dosyası oluşturun):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   VITE_APP_NAME=SmartCampus
   VITE_TOKEN_STORAGE_KEY=smartcampus.auth
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcıda açın: http://localhost:5173

## 📜 Scriptler

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Vite geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run preview` | Production build önizleme |
| `npm run lint` | ESLint kontrolü |
| `npm run format` | Prettier ile formatlama |
| `npm run test` | Vitest testleri (CI modu) |
| `npm run test:watch` | Vitest watch modu |

## 📁 Klasör Yapısı

```
frontend1/
├── src/
│   ├── components/        # Yeniden kullanılabilir bileşenler
│   │   ├── common/       # LoadingScreen, vb.
│   │   ├── layout/       # AuthLayout, DashboardLayout
│   │   ├── navigation/   # navConfig
│   │   └── routing/      # ProtectedRoute, PublicRoute
│   ├── context/          # AuthContext, ThemeContext
│   ├── hooks/            # Custom hooks (useToast)
│   ├── pages/            # Sayfa bileşenleri
│   │   ├── auth/        # Login, Register, ForgotPassword, ResetPassword, VerifyEmail
│   │   ├── dashboard/   # Dashboard
│   │   ├── profile/      # Profile management
│   │   ├── courses/      # Course pages
│   │   ├── grades/       # Grade pages
│   │   └── attendance/   # Attendance pages
│   ├── routes/           # Router configuration
│   ├── services/         # API service functions
│   ├── utils/            # Utilities (validation, token storage, error handling)
│   ├── config/           # App configuration
│   ├── theme.js          # MUI theme configuration
│   ├── App.jsx           # Root component
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── package.json
└── README.md
```

## 🎨 Tema ve Stil

### Dark/Light Mode
- Varsayılan tema: **Light Mode**
- Dashboard header'ında tema değiştirme butonu
- Tema tercihi localStorage'da saklanır
- Dark mode'da giriş sayfası temasına uygun koyu renkler

### Auth Sayfaları
- Modern glassmorphism tasarım
- Gradient arka plan (yeşil → mavi → lacivert)
- Dark mode desteği
- Responsive tasarım

## 🔐 Authentication

### Token Yönetimi
- **Access Token:** 15 dakika geçerlilik
- **Refresh Token:** 7 gün geçerlilik
- **Remember Me:** Token'lar localStorage'da saklanır (aksi halde sessionStorage)
- Otomatik token yenileme (Axios interceptor)

### Sayfalar
- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası
- `/forgot-password` - Şifre sıfırlama talebi
- `/reset-password` - Şifre sıfırlama (token ile)
- `/verify-email/:token` - Email doğrulama

## 🛡️ Route Protection

### ProtectedRoute
- Authenticated kullanıcılar için
- Rol bazlı erişim kontrolü
- Token yoksa `/login`'e yönlendirir

### PublicRoute
- Unauthenticated kullanıcılar için
- Zaten giriş yapmış kullanıcıları `/dashboard`'a yönlendirir

## 📱 Sayfalar

### Public Sayfalar
- **Login** - Kullanıcı girişi
- **Register** - Kullanıcı kaydı
- **Forgot Password** - Şifre sıfırlama talebi
- **Reset Password** - Şifre sıfırlama
- **Verify Email** - Email doğrulama

### Protected Sayfalar
- **Dashboard** - Ana sayfa
- **Profile** - Profil yönetimi
- **Courses** - Ders listesi
- **My Courses** - Kayıtlı dersler (öğrenci)
- **Grades** - Notlar (öğrenci)
- **Gradebook** - Not defteri (akademisyen/admin)
- **Start Attendance** - Yoklama başlat (akademisyen/admin)
- **My Attendance** - Yoklama durumu (öğrenci)
- **Attendance Report** - Yoklama raporları (akademisyen/admin)
- **Excuse Requests** - Mazeret talepleri

## 🔄 State Management

### AuthContext
- Kullanıcı authentication durumu
- Login/logout işlemleri
- User profile bilgileri

### ThemeContext
- Dark/Light mode durumu
- Tema değiştirme fonksiyonu

### TanStack Query
- Server state yönetimi
- API cache yönetimi
- Automatic refetching

## 📡 API Entegrasyonu

### API Client
- Axios instance (`apiClient.js`)
- Request/Response interceptors
- Automatic token refresh
- Error handling

### Services
- `authService.js` - Authentication işlemleri
- `userService.js` - User işlemleri
- `courseService.js` - Course işlemleri
- `gradeService.js` - Grade işlemleri
- `attendanceService.js` - Attendance işlemleri
- `excuseService.js` - Excuse işlemleri

## ✅ Form Validasyonu

- **React Hook Form** - Form state management
- **Yup** - Schema validation
- Validation şemaları `utils/validationSchemas.js` içinde

## 🎯 Özellikler

- ✅ Modern, responsive UI
- ✅ Dark/Light mode
- ✅ JWT authentication
- ✅ Token refresh
- ✅ Remember me
- ✅ Form validation
- ✅ Error handling
- ✅ Toast notifications
- ✅ Loading states
- ✅ Protected routes
- ✅ Role-based access control

## 📚 Dokümantasyon

- **Kullanıcı Kılavuzu:** [USER_MANUAL_PART1.md](./USER_MANUAL_PART1.md)
- **API Dokümantasyonu:** [../backend/API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md)

## 🐛 Hata Ayıklama

- Browser console'da hata mesajları
- React DevTools ile component tree inceleme
- Network tab'da API istekleri kontrol edilebilir

## 📄 Lisans

ISC
