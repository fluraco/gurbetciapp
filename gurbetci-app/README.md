# Gurbetçi SuperApp

Yurtdışında yaşayan Türkler için özel olarak geliştirilmiş bir mobil SuperApp.

## Özellikler

- 📱 **Modern UI/UX**: Revolut tarzı modern ve kullanıcı dostu arayüz
- 📞 **Telefon Doğrulama**: Supabase Phone Auth ile güvenli giriş sistemi
- 🌍 **90+ Ülke Desteği**: Tüm dünya ülkelerinin telefon kodları
- 🔐 **6 Haneli OTP**: SMS ile güvenli doğrulama sistemi
- 🎨 **Gradient Tasarım**: Modern renk geçişleri ve animasyonlar
- 📰 **Haberler**: Güncel haberler ve kategori bazlı filtreleme
- 🏢 **Hizmetler**: Yurt dışında yaşayan Türkler için özel hizmetler
- 👥 **Topluluk**: Topluluk etkileşimi ve etkinlikler
- 🔔 **Bildirimler**: Gerçek zamanlı bildirimler
- 🌍 **Çoklu Dil**: Türkçe dil desteği
- 🔐 **Güvenli Auth**: Supabase tabanlı kimlik doğrulama

## Teknolojiler

- **React Native**: Expo
- **TypeScript**: Tip güvenliği
- **Veritabanı**: Supabase
- **Bildirimler**: Firebase
- **Navigasyon**: React Navigation
- **State Management**: React Context
- **UI/UX**: Custom design system

## Kurulum

1. Projeyi klonlayın:
```bash
git clone [repository-url]
cd gurbetci-app
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment variables dosyasını oluşturun:
```bash
cp .env.example .env
```

4. `.env` dosyasını doldurun:
```
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

5. Uygulamayı başlatın:
```bash
# iOS için
npm run ios

# Android için
npm run android

# Web için
npm run web
```

## Proje Yapısı

```
src/
├── components/      # Yeniden kullanılabilir bileşenler
├── screens/         # Ekran bileşenleri
├── services/        # API servisleri
├── context/         # React Context'leri
├── hooks/          # Custom hook'lar
├── utils/          # Yardımcı fonksiyonlar
├── types/          # TypeScript türleri
├── constants/      # Sabitler (renkler, boyutlar, vs.)
└── i18n/           # Çoklu dil desteği
```

## Supabase Veritabanı Yapısı

### Tablolar:

#### `users`
- `id` (UUID, PK)
- `email` (String, Unique)
- `firstName` (String)
- `lastName` (String)
- `phone` (String, Optional)
- `avatar` (String, Optional)
- `country` (String, Optional)
- `city` (String, Optional)
- `language` (String, Default: 'tr')
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### `news`
- `id` (UUID, PK)
- `title` (String)
- `content` (Text)
- `summary` (String)
- `imageUrl` (String, Optional)
- `author` (String)
- `categoryId` (UUID, FK)
- `publishedAt` (Timestamp)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)
- `viewCount` (Integer, Default: 0)
- `likeCount` (Integer, Default: 0)
- `commentCount` (Integer, Default: 0)

#### `news_categories`
- `id` (UUID, PK)
- `name` (String)
- `slug` (String, Unique)
- `description` (String, Optional)
- `color` (String, Optional)
- `icon` (String, Optional)

#### `services`
- `id` (UUID, PK)
- `name` (String)
- `description` (Text)
- `iconUrl` (String, Optional)
- `categoryId` (UUID, FK)
- `isActive` (Boolean, Default: true)
- `isPremium` (Boolean, Default: false)
- `url` (String, Optional)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### `service_categories`
- `id` (UUID, PK)
- `name` (String)
- `slug` (String, Unique)
- `description` (String, Optional)
- `color` (String, Optional)
- `icon` (String, Optional)
- `order` (Integer, Default: 0)

#### `communities`
- `id` (UUID, PK)
- `name` (String)
- `description` (Text)
- `imageUrl` (String, Optional)
- `memberCount` (Integer, Default: 0)
- `isPrivate` (Boolean, Default: false)
- `country` (String, Optional)
- `city` (String, Optional)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### `notifications`
- `id` (UUID, PK)
- `title` (String)
- `message` (Text)
- `type` (String)
- `data` (JSONB, Optional)
- `isRead` (Boolean, Default: false)
- `userId` (UUID, FK)
- `createdAt` (Timestamp)

## Firebase Yapılandırması

Firebase projesi oluşturup aşağıdaki servisleri aktifleştirin:

1. **Cloud Messaging**: Push bildirimler için
2. **Analytics**: Uygulama analitikleri için

## Geliştirme

### Yeni Ekran Ekleme

1. `src/screens/` klasörüne yeni ekran dosyasını ekleyin
2. `src/types/index.ts` dosyasındaki navigasyon türlerini güncelleyin
3. `App.tsx` dosyasında navigasyon yapısını güncelleyin

### Yeni Servis Ekleme

1. `src/services/` klasörüne yeni servis dosyasını ekleyin
2. Gerekli TypeScript türlerini `src/types/index.ts` dosyasına ekleyin
3. Context'lerde gerekli güncellemeleri yapın

### Stil Güncellemeleri

- Tüm renkler: `src/constants/index.ts` - `COLORS`
- Tüm boyutlar: `src/constants/index.ts` - `SIZES`
- Tüm fontlar: `src/constants/index.ts` - `FONTS`

## Hedef Ülkeler

Uygulama başta şu ülkelerde yaşayan Türkler için tasarlanmıştır:

- 🇩🇪 Almanya
- 🇫🇷 Fransa
- 🇳🇱 Hollanda
- 🇧🇪 Belçika
- 🇦🇹 Avusturya
- 🇨🇭 İsviçre
- 🇺🇸 ABD
- 🇨🇦 Kanada
- 🇦🇺 Avustralya
- 🇬🇧 İngiltere
- 🇸🇪 İsveç
- 🇳🇴 Norveç
- 🇩🇰 Danimarka
- 🇮🇹 İtalya
- 🇪🇸 İspanya

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

- **Proje Sahibi**: [Your Name]
- **Email**: [your.email@example.com]
- **GitHub**: [Your GitHub Profile] 