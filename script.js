// Prayer times data structure for Kadapa
const prayerTimes = {
    fajar: { awwal: "05:25", jamaat: null, qaza: "06:37", ishraq: "06:57", chaasht: "09:33" },
    zohar: { awwal: "12:29", jamaat: null, zawaal: "12:24", qazaHanafi: "04:43", qazaShafai: "03:50" },
    asar: { awwal: "04:43", jamaat: null, awwalHanafi: "04:43", awwalShafai: "03:50", qaza: "06:21" },
    maghrib: { awwal: "06:24", jamaat: "06:24", sunset: "06:21", iftaar: "06:24", qaza: "07:33" },
    isha: { awwal: "07:33", jamaat: null, qaza: "05:25", tahajjud: "03:34", khatmSehri: "05:15" },
    juma: { khutba: "13:30", khutba1: "13:00", khutba2: "13:15", khutba3: null, khutba4: null }
};

// Theme toggle functionality
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    
    // Update theme toggle icon
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = newTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    
    // Save preference
    localStorage.setItem('theme', newTheme);
}

// Qibla direction function
function openQiblaDirection() {
    // This could open a modal or redirect to a Qibla finder
    // For now, we'll just show an alert
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // Calculate Qibla direction (simplified - for Mecca coordinates)
            const meccaLat = 21.3891;
            const meccaLon = 39.8579;
            
            // This would need proper Qibla calculation
            alert(`Your location: ${lat.toFixed(4)}, ${lon.toFixed(4)}\nQibla direction calculation would be implemented here.`);
        }, function() {
            alert('Unable to access location. Please enable location services for Qibla direction.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Initialize theme from localStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = savedTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Convert time string to minutes for comparison
function timeToMinutes(timeStr) {
    if (!timeStr || timeStr === "--:--") return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Convert minutes to time string
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Get current prayer and next prayer
function getCurrentAndNextPrayer() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayerOrder = ['fajar', 'zohar', 'asar', 'maghrib', 'isha'];
    const prayerMinutes = prayerOrder.map(prayer => ({
        name: prayer,
        time: timeToMinutes(prayerTimes[prayer].awwal)
    })).filter(p => p.time !== null);
    
    let currentPrayer = null;
    let nextPrayer = null;
    
    for (let i = 0; i < prayerMinutes.length; i++) {
        if (currentMinutes < prayerMinutes[i].time) {
            nextPrayer = prayerMinutes[i].name;
            if (i > 0) {
                currentPrayer = prayerMinutes[i - 1].name;
            }
            break;
        }
    }
    
    // If no next prayer found, we're after Isha, so current is Isha and next is Fajar (next day)
    if (!nextPrayer) {
        currentPrayer = 'isha';
        nextPrayer = 'fajar';
    }
    
    // If no current prayer, we're before Fajar
    if (!currentPrayer) {
        nextPrayer = 'fajar';
    }
    
    return { current: currentPrayer, next: nextPrayer };
}

// Highlight current and next prayer (ID-based: fajar-card, zohar-card, etc.)
function highlightPrayers() {
    const { current, next } = getCurrentAndNextPrayer();

    document.querySelectorAll('.prayer-card').forEach(card => {
        card.classList.remove('current-prayer', 'next-prayer');
    });

    if (current) {
        const currentCard = document.getElementById(`${current}-card`);
        if (currentCard) currentCard.classList.add('current-prayer');
    }

    if (next) {
        const nextCard = document.getElementById(`${next}-card`);
        if (nextCard) nextCard.classList.add('next-prayer');
    }
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    
    // Format time
    const timeOptions = {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    
    // Format date
    const dateOptions = {
        day: '2-digit',
        month: 'short',
        weekday: 'short',
        year: 'numeric'
    };
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    
    // Update display
    document.getElementById('currentTime').textContent = timeString;
    document.getElementById('currentDate').textContent = dateString;
    
    // Update prayer highlights
    highlightPrayers();
}

// Get Hijri date (simplified calculation)
function getHijriDate() {
    // This is a simplified calculation. For accurate Hijri dates, you would need a proper library
    const now = new Date();
    const hijriYear = 1447; // Current approximate Hijri year
    const ramzanDay = 2; // Current day in Ramzan
    
    document.getElementById('hijriDate').textContent = `${ramzanDay.toString().padStart(2, '0')} Ramzan ${hijriYear}`;
}

// Format time value
function formatTimeValue(value) {
    return (value === null || value === undefined || value === "" || value === "--:--") ? "--:--" : value;
}

// Populate prayer cards
function populatePrayerCards() {
    document.querySelectorAll('.prayer-card[data-prayer]').forEach(card => {
        const key = card.getAttribute('data-prayer');
        const data = prayerTimes[key];
        if (!data) return;

        card.querySelectorAll('[data-field]').forEach(el => {
            const field = el.getAttribute('data-field');
            el.textContent = formatTimeValue(data[field]);
        });
    });
}

// Initialize the app
function init() {
    initTheme();
    populatePrayerCards();
    updateCurrentTime();
    getHijriDate();

    setInterval(updateCurrentTime, 1000);
    setInterval(getHijriDate, 24 * 60 * 60 * 1000);
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);