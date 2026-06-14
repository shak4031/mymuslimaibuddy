# MyMuslimBuddy 🌙

An intelligent AI companion for Muslims — helps track prayers, read Quran, learn Hadith & Seerah, and grow closer to Allah through psychologically-aware encouragement.

## Architecture

```
mymuslimaibuddy/
├── backend/          # Node.js + Express API (deployed on Railway)
│   ├── src/
│   │   ├── index.js           # Express server entry
│   │   ├── db.js              # PostgreSQL connection & schema
│   │   ├── prayer-times.js    # Adhan prayer time calculation
│   │   ├── ai-buddy.js        # OpenRouter AI with psychological context
│   │   └── routes/
│   │       ├── prayers.js     # Prayer tracking CRUD
│   │       ├── quran.js       # Quran ayah + surah metadata
│   │       ├── hadith.js      # Hadith & Seerah stories
│   │       ├── buddy.js       # AI chat + daily tips
│   │       └── preferences.js # User preferences
│   └── railway.json           # Railway deployment config
│
└── mobile/           # React Native (Expo) mobile app
    └── app/
        ├── (tabs)/
        │   ├── _layout.tsx    # Tab navigation
        │   ├── index.tsx      # Home dashboard
        │   ├── prayers.tsx    # Prayer tracker
        │   ├── quran.tsx      # Quran reader
        │   ├── hadith.tsx     # Hadith & Seerah
        │   └── buddy.tsx      # AI chat interface
        └── _layout.tsx        # Root layout
```

## Features

### 🕌 Smart Prayer Tracker
- Gets accurate prayer times based on GPS coordinates
- 5 daily prayers with "Mark Prayed" buttons
- Streak tracking (consecutive days with all 5 prayers)
- Daily/weekly percentage tracking
- Encouragement messages with hadith after each prayer

### 📖 Quran Companion
- Random ayah with Arabic + transliteration + English translation
- Surah context & history (Meccan/Medinan, revelation context)
- Track reading progress across 114 surahs
- One-tap "Another Ayah" for continuous reading

### 📜 Hadith & Seerah Learning
- 12 curated authentic hadith with practical daily application
- 5 Seerah stories from the Prophet's ﷺ life
- Each story includes: historical context → lesson → actionable step
- Switchable tabs for Hadith / Seerah content

### 🤖 AI Buddy (The Core)
- **Psychology-aware tone switching** based on user state:
  - ❤️ **Encouraging** — when user is consistent (3+ day streaks)
  - 🌱 **Gentle** — when user is slipping (1-2 missed)
  - ⚠️ **Firm-but-loving** — when user is avoiding (3+ missed)
  - 🎉 **Celebratory** — at milestones
- Connects to OpenRouter (DeepSeek) for intelligent conversation
- Context-aware: knows your prayer streak, Quran progress, time of day
- Falls back to curated Islamic content when offline

### 🧠 Psychology Engine
Built-in behavioral science:
- **Loss aversion** — "Don't break your X-day streak"
- **Tiny habits** — "Just read one ayah, that's it"
- **Variable rewards** — occasional deep insights, not repetitive
- **Commitment consistency** — "You said you wanted to improve"

## Backend Setup (Railway Deploy)

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit: MyMuslimBuddy full stack"
git push origin main
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select `shak4031/mymuslimaibuddy`
5. Railway auto-detects `railway.json` — deploys the backend

### 3. Add Environment Variables
In Railway dashboard → your project → Variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | *(Auto-provisioned: Railway → New → PostgreSQL)* |
| `OPENROUTER_API_KEY` | `sk-or-...` (your key from openrouter.ai) |
| `NODE_ENV` | `production` |

### 4. Auto-migration
The server runs schema migration on startup — your database is ready immediately.

## Mobile App Setup

### Configure API URL
In `mobile/app/(tabs)/index.tsx` (and other screens), the API connects to your Railway backend. After deploying, update the API URL:

```ts
// In src/services/api.ts
const API_BASE = 'https://your-railway-url.up.railway.app/api/v1';
```

### Run Locally
```bash
cd mobile
npx expo start
```

Scan QR code with Expo Go app on your phone.

### Build for Stores
```bash
# Android APK
npx eas build --platform android --profile production

# iOS IPA (requires macOS or EAS Build with Apple account)
npx eas build --platform ios --profile production
```

## Environment Variables

| Variable | Where | Required |
|---|---|---|
| `OPENROUTER_API_KEY` | Railway | Yes (for AI features) |
| `DATABASE_URL` | Railway (PostgreSQL) | Yes (for persistence) |
| `EXPO_PUBLIC_API_URL` | Mobile `.env` | Yes (your Railway URL) |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/v1/prayers/register` | Register device |
| GET | `/api/v1/prayers/:deviceId/today` | Today's prayer records |
| POST | `/api/v1/prayers/:deviceId/mark` | Mark prayer as prayed |
| GET | `/api/v1/prayers/:deviceId/weekly` | Weekly summary |
| GET | `/api/v1/prayer-times` | Prayer times for coordinates |
| GET | `/api/v1/quran/surahs` | All surah metadata |
| GET | `/api/v1/quran/random-ayah` | Random ayah (Arabic+transliteration+translation) |
| GET | `/api/v1/hadith/daily` | Random daily hadith |
| GET | `/api/v1/hadith/seerah/daily` | Random seerah story |
| POST | `/api/v1/buddy/:deviceId/chat` | Chat with AI buddy |
| GET | `/api/v1/preferences/:deviceId` | Get user preferences |

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL
- **Mobile:** React Native (Expo SDK 56), expo-router
- **Prayer Times:** Adhan library (Muslim World League, ISNA, Umm Al-Qura methods)
- **AI:** OpenRouter (DeepSeek V4 Flash)
- **Quran Data:** Alquran.cloud API
- **Hosting:** Railway (auto-deploy from GitHub)

## Future Enhancements

- [ ] Push notifications for prayer reminders (expo-notifications)
- [ ] Two-stage nudge system (reminder at 30% + check-in at 80% of prayer window)
- [ ] User authentication (vs device-based)
- [ ] Sunnah prayer tracking (fajr sunnah, witr, etc.)
- [ ] Quran juz/part completion tracking
- [ ] Fasting (Ramadan) tracking
- [ ] Dhikr counter
- [ ] Dark mode
- [ ] Arabic language support
- [ ] Community features (optional groups)

---

Built with ❤️ for the sake of Allah. May it benefit you in this life and the next. Ameen.