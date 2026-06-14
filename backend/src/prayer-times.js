const adhan = require('adhan');

/**
 * Prayer times engine using the Adhan library.
 * Calculates accurate Islamic prayer times based on GPS coordinates.
 */
class PrayerTimesEngine {
  constructor(latitude, longitude, timezone = 'UTC', method = 'mwl') {
    this.coordinates = new adhan.Coordinates(latitude, longitude);
    this.timezone = timezone;
    this.method = method;
    this.params = this._getParams(method);
  }

  _getParams(method) {
    const methods = {
      mwl: adhan.CalculationMethod.MuslimWorldLeague(),
      isna: adhan.CalculationMethod.NorthAmerica(),
      egypt: adhan.CalculationMethod.Egyptian(),
      uaq: adhan.CalculationMethod.UmmAlQura(),
      karachi: adhan.CalculationMethod.Karachi(),
      dubai: adhan.CalculationMethod.Dubai(),
      kuwait: adhan.CalculationMethod.Kuwait(),
      qatar: adhan.CalculationMethod.Qatar(),
      singapore: adhan.CalculationMethod.Singapore(),
      moonsighting: adhan.CalculationMethod.MoonsightingCommittee(),
    };
    return methods[method] || adhan.CalculationMethod.MuslimWorldLeague();
  }

  getTimes(date = new Date()) {
    const prayerTimes = new adhan.PrayerTimes(this.coordinates, date, this.params);
    return {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
    };
  }

  getNextPrayer(date = new Date()) {
    const times = this.getTimes(date);

    // Get current time in the timezone
    const now = date;

    const prayerOrder = [
      { name: 'fajr', time: times.fajr },
      { name: 'sunrise', time: times.sunrise },
      { name: 'dhuhr', time: times.dhuhr },
      { name: 'asr', time: times.asr },
      { name: 'maghrib', time: times.maghrib },
      { name: 'isha', time: times.isha },
    ];

    // Find the next prayer
    for (const prayer of prayerOrder) {
      if (prayer.time > now) {
        const diffMs = prayer.time.getTime() - now.getTime();
        const remainingMinutes = Math.floor(diffMs / 60000);
        return {
          ...prayer,
          remainingMinutes,
          remainingHours: Math.floor(remainingMinutes / 60),
          remainingMins: remainingMinutes % 60,
        };
      }
    }

    // If all prayers for today passed, get Fajr of tomorrow
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextTimes = this.getTimes(tomorrow);
    const diffMs = nextTimes.fajr.getTime() - now.getTime();
    const remainingMinutes = Math.floor(diffMs / 60000);

    return {
      name: 'fajr',
      time: nextTimes.fajr,
      isTomorrow: true,
      remainingMinutes,
      remainingHours: Math.floor(remainingMinutes / 60),
      remainingMins: remainingMinutes % 60,
    };
  }

  /**
   * Get the prayer window — the time range during which a prayer is valid.
   * Returns { start, end, halfway } for scheduling nudges.
   */
  getPrayerWindow(prayerName, date = new Date()) {
    const times = this.getTimes(date);

    const prayerWindows = {
      fajr: { start: times.fajr, end: times.sunrise },
      dhuhr: { start: times.dhuhr, end: times.asr },
      asr: { start: times.asr, end: times.maghrib },
      maghrib: { start: times.maghrib, end: times.isha },
      isha: { start: times.isha },
    };

    const window = prayerWindows[prayerName];
    if (!window) return null;

    const start = window.start;
    const end = window.end || (() => {
      // Isha lasts until midnight (or Fajr next day)
      const midnight = new Date(date);
      midnight.setHours(23, 59, 59, 999);
      return midnight;
    })();

    const halfway = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);

    return { start, end, halfway };
  }
}

/**
 * Create a prayer times engine from query params or defaults
 */
function createEngine(lat, lng, tz, method = 'mwl') {
  return new PrayerTimesEngine(lat, lng, tz, method);
}

/**
 * Get all prayer times for today at given coordinates
 */
async function getAllPrayerTimes(latitude, longitude, timezone, method = 'mwl') {
  const engine = createEngine(latitude, longitude, timezone, method);
  const times = engine.getTimes();
  const result = {};
  for (const [name, time] of Object.entries(times)) {
    result[name] = time.toISOString();
  }
  return result;
}

/**
 * Get the next prayer that hasn't passed yet
 */
async function getNextPrayer(latitude, longitude, timezone, method = 'mwl') {
  const engine = createEngine(latitude, longitude, timezone, method);
  return engine.getNextPrayer();
}

module.exports = {
  PrayerTimesEngine,
  createEngine,
  getAllPrayerTimes,
  getNextPrayer,
};