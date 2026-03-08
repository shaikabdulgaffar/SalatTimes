// script.js
// Loads timings.json, shows current time/date (live) and today's prayer times.
// Ensure timings.json (note filename) is in the same folder as the HTML file.

const TIMING_JSON_PATH = 'timings.json'; // updated to match your file name
const monthNames = [
  "january","february","march","april","may","june",
  "july","august","september","october","november","december"
];

let prayerTimingsData = null;
let lastDateKey = null; // used to detect day change and refresh timings

// Fetch timings JSON
async function loadTimings() {
  try {
    const res = await fetch(TIMING_JSON_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${TIMING_JSON_PATH}: ${res.status}`);
    prayerTimingsData = await res.json();
  } catch (err) {
    console.error('Error loading timing data:', err);
    prayerTimingsData = null;
  }
}

// Given month (string) and date (number) return matching timing entry (or null)
function findTimingsFor(month, date) {
  if (!prayerTimingsData) return null;
  const monthData = prayerTimingsData[month];
  if (!Array.isArray(monthData)) return null;

  for (const entry of monthData) {
    // entry.dates is an array of one or more numeric day values (e.g. [1] or [1,2,3])
    if (Array.isArray(entry.dates) && entry.dates.includes(date)) {
      return entry;
    }

    // Support fallback ranges if needed (not required for current timings.json)
    if (typeof entry.start === 'number' && typeof entry.end === 'number') {
      if (date >= entry.start && date <= entry.end) return entry;
    }
  }
  return null;
}

// Format functions
function formatTimeWithSeconds(date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');
  return `${displayHours}:${minutes}:${seconds} ${ampm}`;
}

function formatShortDate(date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Sun"
  const day = String(date.getDate()).padStart(2, '0');                     // e.g. "08"
  const month = date.toLocaleDateString('en-US', { month: 'short' });     // e.g. "Mar"
  const year = date.getFullYear();                                        // e.g. 2026
  return `${weekday}, ${day} ${month} ${year}`;                          // "Sun, 08 Mar 2026"
}

function formatCardDate(date) {
  const opts = { weekday: 'long', day: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', opts);
}

// Convert Gregorian Date -> Islamic (tabular) date (returns {day,month,year})
function gregorianToIslamic(gDate) {
  const d = gDate.getDate();
  let m = gDate.getMonth() + 1;
  let y = gDate.getFullYear();

  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  const jd = d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;

  let days = jd - 1948440 + 10632;
  const n = Math.floor((days - 1) / 10631);
  days = days - 10631 * n + 354;
  const j = Math.floor((10985 - days) / 5316) * Math.floor((50 * days) / 17719) + Math.floor(days / 5670) * Math.floor((43 * days) / 15238);
  days = days - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) + 29;
  const mIslam = Math.floor((24 * days) / 709);
  const dIslam = days - Math.floor((709 * mIslam) / 24);
  const yIslam = 30 * n + j - 30;

  return { day: dIslam, month: mIslam, year: yIslam };
}

const ISLAMIC_MONTHS = [
  "Muharram","Safar","Rabi' al-awwal","Rabi' al-thani",
  "Jumada al-ula","Jumada al-akhirah","Rajab","Sha'ban",
  "Ramadan","Shawwal","Dhu al-Qidah","Dhu al-Hijjah"
];

function formatHijri(date) {
  try {
    const h = gregorianToIslamic(date);
    const day = String(h.day).padStart(2, '0');
    const monthName = ISLAMIC_MONTHS[h.month - 1] || '--';
    return `${day} ${monthName} ${h.year}`;
  } catch (e) {
    return '--';
  }
}

// Update DOM with current time/date
function updateCurrentTimeAndDate() {
  const now = new Date();
  const timeStr = formatTimeWithSeconds(now);
  const shortDate = formatShortDate(now);
  const cardDate = formatCardDate(now);
  const hijri = formatHijri(now);

  const currentTimeEl = document.getElementById('currentTime');
  const currentDateEl = document.getElementById('currentDate');
  const cardDateEl = document.getElementById('cardDate');
  const hijriEl = document.getElementById('hijriDate');

  if (currentTimeEl) currentTimeEl.textContent = timeStr;
  if (currentDateEl) currentDateEl.textContent = shortDate;
  if (cardDateEl) cardDateEl.textContent = cardDate;
  if (hijriEl) hijriEl.textContent = hijri;

  // If the day changed since last check, refresh prayer times
  const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
  if (todayKey !== lastDateKey) {
    lastDateKey = todayKey;
    updatePrayerTimesForDate(now);
  }
}

// Update prayer times in the DOM for a given Date object
// NOTE: The sequence set here follows your requested order:
// fajar, sunrise, zohar, asr, magrib, isha
function updatePrayerTimesForDate(dateObj) {
  if (!prayerTimingsData) {
    console.warn('Prayer timing data not loaded yet.');
    return;
  }

  const monthKey = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();
  const timing = findTimingsFor(monthKey, day);

  const getEl = id => document.getElementById(id);

  if (timing) {
    // Fill in the requested sequence
    if (getEl('fajar-time')) getEl('fajar-time').textContent = timing.fajar ?? '--:--';
    if (getEl('sunrise-time')) getEl('sunrise-time').textContent = timing.sunrise ?? '--:--';
    if (getEl('zohar-time')) getEl('zohar-time').textContent = timing.zohar ?? timing.zuhur ?? '--:--';
    if (getEl('asar-time')) getEl('asar-time').textContent = timing.asar ?? timing.asr ?? '--:--';
    if (getEl('maghrib-time')) getEl('maghrib-time').textContent = timing.maghrib ?? timing.magrib ?? '--:--';
    if (getEl('isha-time')) getEl('isha-time').textContent = timing.isha ?? '--:--';
  } else {
    // No timing found for today: set placeholders
    if (getEl('fajar-time')) getEl('fajar-time').textContent = '--:--';
    if (getEl('sunrise-time')) getEl('sunrise-time').textContent = '--:--';
    if (getEl('zohar-time')) getEl('zohar-time').textContent = '--:--';
    if (getEl('asar-time')) getEl('asar-time').textContent = '--:--';
    if (getEl('maghrib-time')) getEl('maghrib-time').textContent = '--:--';
    if (getEl('isha-time')) getEl('isha-time').textContent = '--:--';
    console.info(`No timings found for ${monthKey} ${day}`);
  }

  // Also set sahri/sehri time if available
  if (getEl('sahri-time')) {
    getEl('sahri-time').textContent = timing && timing.sahri ? timing.sahri : '--:--';
  }
}

// Initialization
async function init() {
  await loadTimings();           // load timings.json
  updateCurrentTimeAndDate();    // immediate update
  // update every second for live clock; prayer times refresh on day-change
  setInterval(updateCurrentTimeAndDate, 1000);
}

document.addEventListener('DOMContentLoaded', init);