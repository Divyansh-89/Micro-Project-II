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
 * 9. CHARTS & DATA VISUALIZATION MODULE
 * 10. Weather Facts Display
 * 11. Initialization & Event Listeners
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
const MAX_POINTS = 10000;
const tempData = [];
const humData = [];
const timeLabels = [];

let tempChart, humChart, chartInterval;
let chartInitialized = false;

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
        updateSensorData(35, 40, 1);
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
    UpdateCharts(temp, hum);
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
 * @param {boolean} [isAlert=false] - Whether this is a critical alert requiring a siren
 */
function showToast(message, isAlert = false) {
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

    // Only play siren for critical alerts
    if (isAlert) {
        playSirenAlert();
    }

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
    showToast(message, true);
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

    // Show confirmation toast WITHOUT siren
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
 * 9. CHARTS & DATA VISUALIZATION MODULE
 * Manages chart creation and updates for sensor data visualization
 * ============================================================
 */
function UpdateCharts(temp, hum) {
    if (!chartInitialized || Date.now() - lastChartUpdate >= 9000) {
        const now = new Date();
        const label = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0') + ':' +
            now.getSeconds().toString().padStart(2, '0');

        tempData.push(temp);
        humData.push(hum);
        timeLabels.push(label);

        // Keep only the last MAX_POINTS
        if (tempData.length > MAX_POINTS) {
            tempData.shift();
            humData.shift();
            timeLabels.shift();
        }

        lastChartUpdate = Date.now();
    }

    if (!chartInitialized) {
        // Initialize Temperature Chart
        const tempCtx = document.getElementById('temperatureChart').getContext('2d');
        tempChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#ff4e50',
                    backgroundColor: 'rgba(255,78,80,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,

                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.raw}°C`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    }
                }
            }
        });

        // Initialize Humidity Chart
        const humCtx = document.getElementById('humidityChart').getContext('2d');
        humChart = new Chart(humCtx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'Humidity (%)',
                    data: humData,
                    borderColor: '#0099ff',
                    backgroundColor: 'rgba(0,153,255,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,

                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Humidity (%)'
                        }
                    }
                }
            }
        });

        chartInitialized = true;
    } else {
        // Update existing charts
        tempChart.data.labels = timeLabels;
        tempChart.data.datasets[0].data = tempData;
        humChart.data.labels = timeLabels;
        humChart.data.datasets[0].data = humData;

        tempChart.update();
        humChart.update();
    }
}
/**
 * ============================================================
 * 10. WEATHER FACTS MODULE
 * Randomly shows interesting weather facts on the UI
 * ============================================================
 */
const facts = [
    "You can estimate the temperature by counting a cricket’s chirps.",
    "Sandstorms can swallow up entire cities.",
    "Dirt mixed with wind can create dust storms called black blizzards.",
    "A mudslide can carry rocks, trees, vehicles, and even buildings.",
    "The coldest temperature ever officially recorded was -89.2°C in Antarctica.",
    "A heatwave can make train tracks bend.",
    "About 2,000 thunderstorms rain down on Earth every minute.",
    "A 2003 heatwave turned grapes to raisins before they were picked.",
    "Lightning often follows a volcanic eruption.",
    "Raindrops can be as big as a housefly and fall at over 30 km/h.",
    "Cape Farewell in Greenland is the windiest place on the planet.",
    "Hurricanes can push more than 6 meters of water ashore.",
    "In July 2001, rainfall in Kerala, India, was blood red.",
    "Blizzards can make snowflakes feel like pellets hitting your face.",
    "A hurricane in Florida once caused 900 captive pythons to escape.",
    "Worms wriggle up from underground when a flood is coming.",
    "A thunderstorm can produce winds of 160 km/h.",
    "Lightning strikes the Earth about 40 million times each year.",
    "The coldest place on Earth is the East Antarctic Plateau, at -135.8°F.",
    "Clouds are made of water droplets or ice crystals, not gas.",
    "The hottest temperature ever recorded was 134°F in Death Valley, California.",
    "Hurricanes spin counterclockwise in the Northern Hemisphere and clockwise in the Southern Hemisphere.",
    "Wind is caused by the flow of gases in our atmosphere.",
    "We use anemometers to measure wind speed.",
    "Not all raindrops reach the ground; some evaporate while still falling.",
    "Raindrops are not tear-shaped as many believe.",
    "Mawsynram in India gets 11 meters of rainfall each year.",
    "The average speed of a falling raindrop is 20 mph.",
    "On hot days, the Eiffel Tower grows up to 17 cm taller.",
    "The highest temperature in the shade was 57.8°C in Libya in 1922.",
    "Every snowflake is a unique shape.",
    "The first snowflake was photographed in 1885.",
    "The Inuit people have at least 53 words for snow.",
    "Fog is made of tiny droplets of water suspended in the air close to the ground.",
    "Newfoundland, Canada, has over 200 foggy days every year.",
    "Rainbows can appear in fog; these are called 'fogbows'.",
    "Hailstones can fall at speeds over 100 mph.",
    "The heaviest hailstone fell in Bangladesh in 1986 and weighed over 1 kg.",
    "A bolt of lightning is five times hotter than the surface of the Sun.",
    "In Tororo, Uganda, it thunders on more than 250 days a year.",
    "The odds of being struck by lightning in your lifetime are 1 in 15,300.",
    "The fear of thunder and lightning is called astraphobia.",
    "Every winter, more than a septillion snowflakes fall. That's a 1 with 24 zeros!",
    "At any given time, around 67% of Earth's surface is covered by cloud.",
    "The average weight of a cloud is about 500,000 kg.",
    "Contrails are clouds formed from the water in airplane exhaust.",
    "There are 10 common types of cloud.",
    "Phoenix, Arizona, and Las Vegas, Nevada, are among the hottest cities in the U.S.",
    "Tornadoes occur more frequently in the United States than anywhere else.",
    "The National Weather Service started keeping records in 1870.",
    "A 'front' is a boundary between two different air masses.",
    "El Niño refers to ocean currents that cause major climate changes.",
    "High, wispy cirrus clouds can predict bad weather 12–24 hours in advance.",
    "The hottest place in America is Death Valley, California.",
    "Air temperature on land can change quickly, but over water it changes slowly.",
    "Rainbows are caused by sunlight refracting and reflecting through water droplets.",
    "A barometer measures atmospheric pressure.",
    "A meteorologist is a scientist who studies weather.",
    "Nitrogen makes up about 78% of Earth's atmosphere.",
    "Wind is caused by differences in air pressure.",
    "The summer solstice is when the Sun reaches its highest point in the sky.",
    "Hurricanes rotate around a center called the 'eye', where the weather is calm.",
    "Hurricanes are called cyclones or typhoons in other parts of the world.",
    "Clouds form from water that has evaporated from Earth's surface.",
    "The largest hailstone in the U.S. had a circumference of 47 cm.",
    "Hailstones have broken windows and destroyed cars.",
    "Britain's wettest day was in 2015 when Honister Pass had 34 cm of rain.",
    "Scotland sees sleet or snow an average of 38 days a year.",
    "The UK's coldest temperature is -27.2°C in the Scottish Highlands.",
    "The UK's worst winter was 1962/63 with 6 m high snowdrifts.",
    "In the Northern Hemisphere, Earth is closest to the Sun during winter.",
    "The River Thames has frozen solid several times in history.",
    "Hurricane winds can reach speeds of 175 mph (280 km/h).",
    "Every snowflake falls at about 1–6 feet per second.",
    "The fear of cold is called frigophobia.",
    "Some rain evaporates before reaching the ground; this is called virga.",
    "The fastest wind speed ever recorded was 253 mph during Cyclone Olivia.",
    "The largest snowflake ever recorded was 15 inches wide and 8 inches thick.",
    "A rainbow can only be seen in the morning or late afternoon.",
    "The longest dry period ever recorded was 14 years in Arica, Chile.",
    "The wettest place on Earth is Mawsynram, India.",
    "The Sahara Desert can reach temperatures over 50°C.",
    "The coldest inhabited place on Earth is Oymyakon, Russia.",
    "The deadliest tornado occurred in Bangladesh in 1989, killing 1,300 people.",
    "The highest barometric pressure ever recorded was 1,085.7 mb in Siberia.",
    "The lowest barometric pressure was 870 mb during Typhoon Tip in 1979.",
    "Some clouds can weigh more than a million pounds.",
    "A sunshower is when it rains while the sun is shining.",
    "The Coriolis effect causes hurricanes to spin differently in each hemisphere.",
    "The word 'hurricane' comes from the Taino Native American word 'hurucane', meaning evil spirit of the wind.",
    "The first weather satellite, TIROS-1, was launched in 1960.",
    "A waterspout is a tornado that forms over water.",
    "The largest snowman ever built was over 122 feet tall.",
    "Lightning can strike the same place twice.",
    "A microburst is a small, intense downdraft that can cause severe damage.",
    "The average cloud weighs about 1.1 million pounds.",
    "The highest wave ever recorded was 1,720 feet tall in Alaska in 1958.",
    "The longest lightning bolt ever recorded stretched over 440 miles.",
    "The most rain to fall in one minute was 31.2 mm in Maryland, USA.",
    "The hottest temperature ever recorded on Earth was 56.7°C in Death Valley, California.",
    "The coldest temperature recorded in the U.S. was -80°F in Alaska.",
    "The world’s largest hailstone was found in Vivian, South Dakota, in 2010.",
    "The driest place on Earth is the Atacama Desert in Chile.",
    "The wettest month ever recorded was July 1861 in Cherrapunji, India, with 9,300 mm of rain.",
    "A derecho is a widespread, long-lived wind storm associated with a band of rapidly moving showers or thunderstorms.",
    "The term 'monsoon' comes from the Arabic word 'mausim', meaning season.",
    "The world record for the most snow in 24 hours is 75.8 inches in Silver Lake, Colorado.",
    "The fastest forming tornado was in Oklahoma in 1999, forming in less than 10 minutes.",
    "The highest temperature ever recorded in Asia was 54°C in Kuwait in 2016."
];


const factElement = document.getElementById('weather-fact');
let lastFactIndex = -1;

function showRandomFact() {
    let idx;
    do {
        idx = Math.floor(Math.random() * facts.length);
    } while (facts.length > 1 && idx === lastFactIndex); // avoid immediate repeat if possible
    factElement.textContent = facts[idx];
    lastFactIndex = idx;
}

showRandomFact();
setInterval(showRandomFact, 30000);

/**
 * ============================================================
 * 11. INITIALIZATION & EVENT LISTENERS
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