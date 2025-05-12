/**
 * ============================================================
 * 🌡️ WEATHER STATION DASHBOARD
 * ESP32 Weather Monitor with Dynamic UI
 * 
 * This application connects to an ESP32 weather station device,
 * fetches sensor data and displays it with a dynamic interface
 * that changes based on environmental conditions.
 * ============================================================
 */

/**
 * ============================================================
 * 📚 TABLE OF CONTENTS
 * ============================================================
 * 1. Configuration & Constants
 * 2. ESP Connection Management
 * 3. Sensor Data Processing
 * 4. UI Display & Updates
 * 5. Weather Condition Logic
 * 6. Visual Effects & Animations
 * 7. Alert & Notification System
 * 8. Settings & Threshold Management
 * 9. Initialization & Event Listeners
 * ============================================================
 */

/**
 * ============================================================
 * 1. CONFIGURATION & CONSTANTS
 * ============================================================
 */
// Regular expression for validating IPv4 addresses
const IP_PATTERN = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Global state variables
let espIP = localStorage.getItem("espIP") || "";
let statusCheckInterval;
let lastUpdateTime = Date.now();
let tempC = null;
let showCelsius = true;
let audioCtx;
let lastScene = null;

// Data refresh intervals (in milliseconds)
const DATA_FETCH_INTERVAL = 2000;
const DATETIME_UPDATE_INTERVAL = 1000;
const CONNECTION_CHECK_INTERVAL = 5000;
const CONNECTION_TIMEOUT = 6000;

/**
 * ============================================================
 * 2. ESP CONNECTION MANAGEMENT
 * ============================================================
 */

/**
 * Validates the IP address format and enables/disables the connect button
 */
function validateIP() {
    const input = document.getElementById("esp-ip-input");
    const connectBtn = document.getElementById("connect-btn");
    const ipValue = input.value.trim();

    connectBtn.disabled = !IP_PATTERN.test(ipValue) && ipValue !== "test";
}

/**
 * Updates the ESP IP address and initiates connection
 */
function updateESPIP() {
    const inputField = document.getElementById("esp-ip-input");
    const input = inputField.value.trim();

    if (IP_PATTERN.test(input) || input === "test") {
        localStorage.setItem("espIP", input);
        espIP = input;
        console.log("ESP IP updated to:", input);
        fetchSensorData();
        startStatusMonitoring();
    } else {
        alert("Please enter a valid ESP IP address.");
    }
}

/**
 * Monitors the connection status to the ESP device
 */
function startStatusMonitoring() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }

    if (espIP !== "test") {
        statusCheckInterval = setInterval(() => {
            if (Date.now() - lastUpdateTime > CONNECTION_TIMEOUT) {
                setStatus(false);
            }
        }, CONNECTION_CHECK_INTERVAL);
    }
}

/**
 * Updates the connection status indicator in the UI
 * @param {boolean} isLive - Whether the connection is active
 */
function setStatus(isLive) {
    const statusEl = document.getElementById("status");
    if (isLive) {
        statusEl.classList.remove("offline");
        statusEl.classList.add("live");
        statusEl.textContent = "● Live";
    } else {
        statusEl.classList.remove("live");
        statusEl.classList.add("offline");
        statusEl.textContent = "● Offline";
    }
}

/**
 * ============================================================
 * 3. SENSOR DATA PROCESSING
 * ============================================================
 */

/**
 * Fetches sensor data from the ESP device
 */
async function fetchSensorData() {
    // Handle test mode
    if (espIP === "test") {
        updateSensorData(26.7, 47, 0);
        setStatus(true);
        lastUpdateTime = Date.now();
        return;
    }

    if (!espIP) return;

    try {
        const response = await fetch(`http://${espIP}/data`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        updateSensorData(data.temperature, data.humidity, data.lux);
        lastUpdateTime = Date.now();
        console.log("Successfully fetched from:", espIP);
    } catch (error) {
        console.error("Failed to fetch sensor data:", error);
        setStatus(false);
        showToast("Could not fetch data from ESP32. Please check the IP and network.");
    }
}

/**
 * Processes and displays new sensor data
 * @param {number} temp - Temperature in Celsius
 * @param {number} hum - Humidity percentage
 * @param {number} lux - Light level (0 = dark, 1 = light)
 */
function updateSensorData(temp, hum, lux) {
    // Update temperature with unit toggle support
    handleNewSensorData(temp);

    // Update humidity
    document.getElementById("humidity-value").innerText = hum;

    // Update lux (if present in the UI)
    const luxElement = document.getElementById("lux-value");
    if (luxElement) {
        luxElement.innerText = lux;
        luxElement.classList.remove("loading");
    }

    // Remove loading classes
    document.getElementById("temp-value").classList.remove("loading");
    document.getElementById("humidity-value").classList.remove("loading");

    // Update UI components
    setStatus(true);
    updateWeatherCardWithBackground(lux, temp, hum);
    checkThresholds(temp, hum);
}

/**
 * Handles new temperature data and updates the temperature display
 * @param {number} sensorTempC - Temperature in Celsius
 */
function handleNewSensorData(sensorTempC) {
    tempC = sensorTempC;
    updateTemperatureDisplay();
}

/**
 * Updates the temperature display based on selected unit (C/F)
 */
function updateTemperatureDisplay() {
    const tempValue = document.getElementById('temp-value');
    const tempUnit = document.getElementById('temp-unit');

    if (tempC === null) {
        tempValue.textContent = '--';
        tempUnit.textContent = showCelsius ? '°C' : '°F';
        return;
    }

    if (showCelsius) {
        tempValue.textContent = tempC;
        tempUnit.textContent = '°C';
    } else {
        const tempF = (tempC * 9 / 5 + 32).toFixed(1);
        tempValue.textContent = tempF;
        tempUnit.textContent = '°F';
    }
}

/**
 * ============================================================
 * 4. UI DISPLAY & UPDATES
 * ============================================================
 */

/**
 * Updates the date and time display
 */
function updateDateTime() {
    const date = new Date();
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    document.getElementById("date").textContent = formattedDate;
    document.getElementById("time").textContent = formattedTime;
}

/**
 * Updates the weather card display with background
 * @param {number} ldr - Light level (0 = dark, 1 = light)
 * @param {number} temp - Temperature in Celsius
 * @param {number} humidity - Humidity percentage
 */
function updateWeatherCardWithBackground(ldr, temp, humidity) {
    updateWeatherCard(ldr, temp, humidity);

    if (window.updateBackground) {
        window.updateBackground(ldr);
    }
}

/**
 * Updates the weather card display
 * @param {number} ldr - Light level (0 = dark, 1 = light)
 * @param {number} temp - Temperature in Celsius
 * @param {number} humidity - Humidity percentage
 */
function updateWeatherCard(ldr, temp, humidity) {
    const { state, emoji, bg } = getWeatherState(ldr, temp, humidity);
    document.getElementById("weatherState").textContent = state;
    document.getElementById("weatherEmoji").textContent = emoji;
    document.getElementById("weatherCard").style.background = bg;
}

/**
 * ============================================================
 * 5. WEATHER CONDITION LOGIC
 * ============================================================
 */

/**
 * Determines the weather state based on sensor values
 * @param {number} ldr - Light level (0 = dark, 1 = light)
 * @param {number} temp - Temperature in Celsius
 * @param {number} humidity - Humidity percentage
 * @returns {Object} Weather state info with display properties
 */
function getWeatherState(ldr, temp, humidity) {
    // 🌑 NIGHT / LOW LIGHT CONDITIONS
    if (ldr === 0) {
        if (temp < 10 && humidity > 80) {
            return { state: "Cold & Damp Night", emoji: "🌫️", bg: "linear-gradient(to right,rgb(64, 90, 116),rgb(90, 189, 204))" };
        } else if (temp >= 10 && temp <= 20 && humidity > 70) {
            return { state: "Cool & Humid Night", emoji: "🌃", bg: "linear-gradient(to right,rgb(144, 147, 148), #203a43)" };
        } else {
            return { state: "Clear Night", emoji: "✨", bg: "linear-gradient(to right,rgb(88, 140, 237),rgb(108, 154, 206))" };
        } 
    }

    // ☀️ DAY / BRIGHT CONDITIONS
    else if (ldr === 1) {
        if (temp < 10 && humidity > 80) {
            return { state: "Cold & Damp Morning", emoji: "🌫️", bg: "linear-gradient(to right, #3a6073, #16222a)" };
        } else if (temp >= 10 && temp <= 20 && humidity > 70) {
            return { state: "Cool & Humid", emoji: "🌥️", bg: "linear-gradient(to right, #bdc3c7, #2c3e50)" };
        } else if (temp > 20 && temp <= 30 && humidity >= 40 && humidity <= 60) {
            return { state: "Pleasant Weather", emoji: "🌞", bg: "linear-gradient(to right, #56ccf2, #2f80ed)" };
        } else if (temp > 30 && humidity < 40) {
            return { state: "Hot & Dry", emoji: "🔥", bg: "linear-gradient(to right, #e96443, #904e95)" };
        } else if (temp > 30 && humidity >= 40) {
            return { state: "Hot & Humid", emoji: "💦", bg: "linear-gradient(to right, #f2994a, #f2c94c)" };
        } else {
            return { state: "Uncertain Day", emoji: "❓", bg: "linear-gradient(to right, #757f9a, #d7dde8)" };
        }
    }

    // 🤷 Unexpected ldr value
    else {
        return { state: "Unknown Light Level", emoji: "❓", bg: "linear-gradient(to right, #bdc3c7, #2c3e50)" };
    }
}

/**
 * ============================================================
 * 6. VISUAL EFFECTS & ANIMATIONS
 * ============================================================
 */

/**
 * Creates the background scene container and elements
 */
function createBackgroundScene() {
    // Create background container
    const backgroundScene = document.createElement('div');
    backgroundScene.className = 'background-scene';
    document.body.appendChild(backgroundScene);

    // Create day elements
    const sun = document.createElement('div');
    sun.className = 'sun';

    const clouds = [];
    for (let i = 1; i <= 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = `cloud cloud-${i}`;
        clouds.push(cloud);
    }

    // Create night elements
    const moon = document.createElement('div');
    moon.className = 'moon';

    const stars = document.createElement('div');
    stars.className = 'stars';
    createStars(stars, 100);

    // Set initial scene based on time
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 18) {
        setDayScene();
    } else {
        setNightScene();
    }

    // Define scene update function for external use
    window.updateBackground = function (luxValue) {
        if (luxValue === 1 && lastScene !== 'day') {
            setDayScene();
            lastScene = 'day';
        } else if (luxValue === 0 && lastScene !== 'night') {
            setNightScene();
            lastScene = 'night';
        }
    }

    // Scene setter functions
    function setDayScene() {
        backgroundScene.innerHTML = '';
        backgroundScene.className = 'background-scene day-scene';
        backgroundScene.appendChild(sun);
        clouds.forEach(cloud => backgroundScene.appendChild(cloud));
        document.body.style.background = 'linear-gradient(135deg, #c9d6ff, #e2e2e2)';
    }

    function setNightScene() {
        backgroundScene.innerHTML = '';
        backgroundScene.className = 'background-scene night-scene';
        backgroundScene.appendChild(moon);
        backgroundScene.appendChild(stars);
        document.body.style.background = 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)';
    }
}

/**
 * Creates stars for the night scene
 * @param {HTMLElement} container - The container to add stars to
 * @param {number} count - Number of stars to create
 */
function createStars(container, count) {
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        // Random position and properties
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const size = 0.5 + Math.random() * 2.5;
        const twinkleDuration = 3 + Math.random() * 5;
        const delay = Math.random() * 5;

        Object.assign(star.style, {
            top: `${top}%`,
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            opacity: Math.random() * 0.5 + 0.3,
            '--twinkle-duration': `${twinkleDuration}s`,
            animationDelay: `${delay}s`
        });

        // Add shooting star effect to ~5% of stars
        if (Math.random() < 0.05) {
            makeShooting(star);
        }

        container.appendChild(star);
    }
}

/**
 * Transforms a star into a shooting star
 * @param {HTMLElement} star - The star element to transform
 */
function makeShooting(star) {
    star.classList.add('shooting-star');

    const angle = Math.random() * 45 - 22.5;
    const distance = 50 + Math.random() * 150;
    const duration = 2 + Math.random() * 4;
    const delay = Math.random() * 60;

    Object.assign(star.style, {
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        '--duration': `${duration}s`,
        animation: `star-twinkle var(--twinkle-duration) infinite ease-in-out, 
                    shooting-star var(--duration) ${delay}s infinite linear`
    });

    const trail = document.createElement('div');
    trail.className = 'star-trail';
    star.appendChild(trail);
}

/**
 * ============================================================
 * 7. ALERT & NOTIFICATION SYSTEM
 * ============================================================
 */

/**
 * Shows a toast notification
 * @param {string} message - Message to display in the toast
 */
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Prevent duplicate toasts
    if (container.querySelector(`.toast[data-message="${message}"]`)) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.dataset.message = message;
    toast.textContent = message;

    // PREPEND instead of append for newest-first ordering
    container.prepend(toast);
    playSirenAlert();

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 2000);
}

/**
 * Triggers an alert with sound and visual notification
 * @param {string} message - Alert message
 */
function triggerAlert(message) {
    showToast(message);
}

/**
 * Initializes audio context (required for browser autoplay policies)
 */
function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/**
 * Plays a siren alert sound using the Web Audio API
 */
function playSirenAlert() {
    initAudioContext();

    const duration = 2.5; // total siren duration in seconds
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // Smooth siren sound

    // Frequency sweep: 400Hz -> 1000Hz -> 400Hz (like a siren)
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(1000, now + 1.2); // rise
    osc.frequency.linearRampToValueAtTime(400, now + 2.4);  // fall

    // Volume envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.7, now + 0.1);
    gain.gain.setValueAtTime(0.7, now + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.1);
}

/**
 * ============================================================
 * 8. SETTINGS & THRESHOLD MANAGEMENT
 * ============================================================
 */

/**
 * Loads saved thresholds from localStorage
 */
function loadSavedThresholds() {
    if (localStorage.getItem('tempMin')) document.getElementById('temp-min').value = localStorage.getItem('tempMin');
    if (localStorage.getItem('tempMax')) document.getElementById('temp-max').value = localStorage.getItem('tempMax');
    if (localStorage.getItem('humMin')) document.getElementById('hum-min').value = localStorage.getItem('humMin');
    if (localStorage.getItem('humMax')) document.getElementById('hum-max').value = localStorage.getItem('humMax');
}

/**
 * Saves thresholds to localStorage
 */
function saveThresholds() {
    // Get current values
    const tempMin = document.getElementById('temp-min').value;
    const tempMax = document.getElementById('temp-max').value;
    const humMin = document.getElementById('hum-min').value;
    const humMax = document.getElementById('hum-max').value;

    // Save to localStorage
    localStorage.setItem('tempMin', tempMin);
    localStorage.setItem('tempMax', tempMax);
    localStorage.setItem('humMin', humMin);
    localStorage.setItem('humMax', humMax);

    // Show confirmation
    showToast("Thresholds saved!");
}

/**
 * Checks if sensor values exceed defined thresholds
 * @param {number} temp - Temperature in Celsius
 * @param {number} hum - Humidity percentage
 */
function checkThresholds(temp, hum) {
    // Get thresholds
    const tempMin = parseFloat(document.getElementById('temp-min').value);
    const tempMax = parseFloat(document.getElementById('temp-max').value);
    const humMin = parseFloat(document.getElementById('hum-min').value);
    const humMax = parseFloat(document.getElementById('hum-max').value);

    // Check temperature
    if (temp > tempMax) {
        triggerAlert(`Temperature above ${tempMax}°C!`);
        document.body.style.background = 'linear-gradient(135deg, #ff7e5f, #feb47b)';
    } else if (temp < tempMin) {
        triggerAlert(`Temperature below ${tempMin}°C!`);
    }

    // Check humidity
    if (hum > humMax) {
        triggerAlert(`Humidity above ${humMax}%!`);
    } else if (hum < humMin) {
        triggerAlert(`Humidity below ${humMin}%!`);
    }
}

/**
 * Clears all localStorage data after confirmation
 */
function clearStorageData() {
    if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
        localStorage.clear();
        location.reload(); // Reload the page after clearing localStorage
    }
}

/**
 * ============================================================
 * 9. INITIALIZATION & EVENT LISTENERS
 * ============================================================
 */

/**
 * Sets up event listeners for the application
 */
function setupEventListeners() {
    // IP input event listeners
    const ipInput = document.getElementById("esp-ip-input");
    ipInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            updateESPIP();
        }
    });
    ipInput.addEventListener("input", validateIP);

    // Connect button listener
    const connectBtn = document.getElementById("connect-btn");
    if (connectBtn) {
        connectBtn.addEventListener("click", updateESPIP);
    }

    // Temperature toggle
    document.getElementById('toggle-temp').addEventListener('click', function () {
        showCelsius = !showCelsius;
        updateTemperatureDisplay();
    });

    // Clear storage
    document.getElementById('clear-storage-btn').addEventListener('click', clearStorageData);

    // Save thresholds
    document.getElementById('save-thresholds-btn').addEventListener('click', saveThresholds);

    // Set up tilt animation for weather card
    const card = document.querySelector(".weather-card");
    if (card) {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * 8;
            const rotateY = ((x - centerX) / centerX) * 8;
            card.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
        });
    }

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Audio initialization on user interaction
    document.body.addEventListener('click', initAudioContext, { once: true });
    document.body.addEventListener('keydown', initAudioContext, { once: true });
}

/**
 * Initialize the application
 */
document.addEventListener("DOMContentLoaded", () => {
    // Load saved thresholds
    loadSavedThresholds();

    // Initialize date/time updater
    setInterval(updateDateTime, DATETIME_UPDATE_INTERVAL);
    updateDateTime();

    // Initialize data fetching
    setInterval(fetchSensorData, DATA_FETCH_INTERVAL);

    // Set up UI elements
    const ipInput = document.getElementById("esp-ip-input");
    if (espIP && (IP_PATTERN.test(espIP) || espIP === "test")) {
        ipInput.value = espIP;
        validateIP();
        fetchSensorData();
        startStatusMonitoring();
    }

    // Set up event listeners
    setupEventListeners();

    // Create background scene
    createBackgroundScene();
});