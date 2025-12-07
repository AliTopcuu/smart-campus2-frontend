# Smart Campus Frontend · Part 1 (Auth & User Management)

Bu depo, Smart Campus Final Project Part 1 için React 18 + Vite + TypeScript tabanlı frontend kodunu barındırır. Bu aşamada kimlik doğrulama, kullanıcı kayıt süreci, profil yönetimi ve sonraki modüller için temel UI/UX kurulumları tamamlandı.

## 🔧 Kullanılan Teknolojiler

- React 18, Vite, TypeScript
- React Router v6/7, React Hook Form + Yup, Axios
- Material UI (MUI) + özel tema
- Context API + TanStack Query (auth durumu ve API orkestrasyonu)
- Test: Vitest + Testing Library (+ ilerleyen aşamalar için MSW)
- Kod kalitesi: ESLint (flat config), Prettier, Husky pre-commit hook

## 📁 Klasör Yapısı

```
frontend/
├── public/
├── src/
│   ├── components/        # layout, navigation, routing bileşenleri
│   ├── config/            # ortam değişkenleri ve sabitler
│   ├── context/           # AuthProvider + useAuth
│   ├── hooks/             # ortak hook'lar (toast vb.)
│   ├── pages/             # route seviyesindeki ekranlar
│   ├── routes/            # createBrowserRouter tanımı
│   ├── services/          # axios client, auth & user servisleri
│   ├── tests/             # test yardımcıları ve setup
│   ├── theme.ts           # MUI tema tanımı
│   └── utils/             # doğrulama şemaları, token storage, error helper
├── .env.example
├── package.json
└── README.md
```

## ⚙️ Gereksinimler

- Node.js 18+
- npm 10+
- Git
- (Tam senaryo için) Docker Desktop + Smart Campus backend

## 🚀 Kurulum

```bash
cd frontend
npm install
cp .env.example .env   # Backend portu değişirse güncelleyin
npm run dev            # http://localhost:5173
```

## 📜 Scriptler

| Komut               | Açıklama                                                 |
|---------------------|----------------------------------------------------------|
| `npm run dev`       | Vite geliştirme sunucusu                                 |
| `npm run build`     | Tip kontrol + prod derleme                               |
| `npm run preview`   | Prod çıktısını yerelde önizleme                          |
| `npm run lint`      | ESLint (type-aware, 0 warning politikası)                |
| `npm run format`    | Prettier ile tüm proje formatlama                        |
| `npm run test`      | Vitest (CI modu + coverage)                              |
| `npm run test:watch`| Vitest watch                                             |
| `npm run prepare`   | Husky hook kurulumu (npm install sonrasında otomatik)    |

> `.husky/pre-commit` şu an `npm test` çalıştırıyor. İhtiyaç halinde lint/format ekleyebilirsiniz.

## 🌐 Ortam Değişkenleri

`.env.example` → `.env`

| Anahtar                  | Açıklama                              | Varsayılan                         |
|--------------------------|---------------------------------------|------------------------------------|
| `VITE_API_BASE_URL`      | Backend base URL (örn. `/api/v1`)     | `http://localhost:5000/api/v1`     |
| `VITE_APP_NAME`          | Uygulama adı / başlık                 | `SmartCampus`                      |
| `VITE_TOKEN_STORAGE_KEY` | localStorage namespace'i              | `smartcampus.auth`                 |

## ✅ Part 1 Kapsamı (Frontend)

- **Auth akışları**: Login, register (öğrenci/akademisyen + şart onayı), email doğrulama ekranı, forgot/reset password.
- **Protected alan**: Dashboard placeholder, profil ekranı (bilgi güncelleme, fotoğraf yükleme, şifre değiştirme).
- **Routing & guard**: `ProtectedRoute` + `PublicRoute`, rol bazlı navigasyona hazır dashboard layout, 404 sayfası.
- **Durum yönetimi**: Token saklama, Axios interceptor ile refresh-flow, AuthContext + TanStack Query.
- **UI/UX**: MUI tema, Toast bildirimleri, responsive grid, form doğrulama geri bildirimleri.
- **Testler**: Login & Register formları için validation + submit testleri.

## 📄 Part 1 Teslimleri (PDF'deki gereksinimler)

- `PROJECT_OVERVIEW.md`
- `API_DOCUMENTATION.md` (Auth & User endpoints)
- `DATABASE_SCHEMA.md`
- `USER_MANUAL_PART1.md`
- `TEST_REPORT_PART1.md`
- 5–10 dk unlisted demo videosu (kayıt → email doğrulama → login → profil güncelleme → fotoğraf yükleme)

## 🤝 Takım Çalışması İpuçları

- Backend ile endpoint sözleşmelerini Swagger/Postman üzerinden netleştirin.
- `feature/*` branch’leriyle küçük, anlamlı commit’ler atın.
- README ve dokümanları her part tesliminde güncel tutun.

Keyifli geliştirmeler! 🚀

