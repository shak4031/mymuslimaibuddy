// API Service for MyMuslimBuddy
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://mymuslimaibuddy-production.up.railway.app/api/v1';
const DEVICE_ID = 'default-device'; // Will be replaced with expo-device ID

export const api = {
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
  },

  async post(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
  },

  async put(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
  },

  // --- Prayer APIs ---
  async registerDevice(deviceId: string, timezone: string, latitude?: number, longitude?: number) {
    return this.post('/prayers/register', { deviceId, timezone, latitude, longitude });
  },

  async getTodayPrayers(deviceId: string) {
    return this.get(`/prayers/${deviceId}/today`);
  },

  async markPrayer(deviceId: string, prayerName: string, status = 'prayed') {
    return this.post(`/prayers/${deviceId}/mark`, { prayerName, status });
  },

  async getWeeklySummary(deviceId: string) {
    return this.get(`/prayers/${deviceId}/weekly`);
  },

  // --- Quran APIs ---
  async getSurahs() {
    return this.get('/quran/surahs');
  },

  async getRandomAyah() {
    return this.get('/quran/random-ayah');
  },

  async recordQuranProgress(deviceId: string, surahNumber: number, ayahNumber: number) {
    return this.post(`/quran/${deviceId}/progress`, { surahNumber, ayahNumber });
  },

  async getQuranStats(deviceId: string) {
    return this.get(`/quran/${deviceId}/stats`);
  },

  // --- Hadith APIs ---
  async getDailyHadith() {
    return this.get('/hadith/daily');
  },

  async getDailySeerah() {
    return this.get('/hadith/seerah/daily');
  },

  async searchHadith(query: string) {
    return this.get(`/hadith/search?q=${encodeURIComponent(query)}`);
  },

  // --- Buddy AI APIs ---
  async chat(deviceId: string, message: string) {
    return this.post(`/buddy/${deviceId}/chat`, { message });
  },

  async getDailyTip(deviceId: string, type = 'daily_hadith') {
    return this.get(`/buddy/${deviceId}/daily-tip?type=${type}`);
  },

  // --- Prayer Times ---
  async getPrayerTimes(latitude: number, longitude: number, timezone: string) {
    return this.get(`/prayer-times?latitude=${latitude}&longitude=${longitude}&timezone=${encodeURIComponent(timezone)}`);
  },

  // --- Preferences ---
  async getPreferences(deviceId: string) {
    return this.get(`/preferences/${deviceId}`);
  },

  async updatePreferences(deviceId: string, prefs: any) {
    return this.put(`/preferences/${deviceId}`, prefs);
  },

  // --- Growth & Character ---
  async getGrowthOverview(deviceId: string) {
    return this.get(`/growth/${deviceId}/overview`);
  },

  async addJournalEntry(deviceId: string, entryType: string, content: string, isPrivate = true) {
    return this.post(`/growth/${deviceId}/reflect`, { entryType, content, isPrivate });
  },

  async setGrowthPreferences(deviceId: string, growthFoci: string[], userRole: string) {
    return this.post(`/growth/${deviceId}/preferences`, { growthFoci, userRole });
  },

  async getGrowthPreferences(deviceId: string) {
    return this.get(`/growth/${deviceId}/preferences`);
  },

  // --- Nudge & Notification Generation ---
  async generateNudge(deviceId: string, context: {
    contextType: string;
    nextPrayer?: string;
    prayerName?: string;
    streak?: number;
    timeOfDay?: string;
    nudgeLevel?: number;
    consecutiveMissed?: number;
  }) {
    return this.post(`/buddy/${deviceId}/generate-nudge`, context);
  },

  // --- Health ---
  async healthCheck() {
    return this.get('/health');
  },
};