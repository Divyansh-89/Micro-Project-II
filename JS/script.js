/**
 * ============================================================
 * 🌡️ WEATHER STATION DASHBOARD
 * ESP32 Weather Monitor with Dynamic UI
 * ============================================================
 */

/**
 * ============================================================
 * 🌐 ESP CONNECTION & IP MANAGEMENT
 * ============================================================
 */

const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
let espIP = localStorage.getItem("espIP") || "";
let statusCheckInterval;
let lastUpdateTime = Date.now();

function validateIP() {
    const input = document.getElementById("esp-ip-input");
    const connectBtn = document.getElementById("connect-btn");
    const ipValue = input.value.trim();

    connectBtn.disabled = !ipPattern.test(ipValue) && ipValue !== "test";
}

function updateESPIP() {
    const inputField = document.getElementById("esp-ip-input");
    const input = inputField.value.trim();
    if (ipPattern.test(input) || input === "test") {
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
 * ============================================================
 * ⏰ DATE & TIME MANAGEMENT
 * ============================================================
 */
function updateDateTime() {
    const date = new Date();
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    document.getElementById("date").textContent = formattedDate;
    document.getElementById("time").textContent = formattedTime;
}

/**
 * ============================================================
 * 🌐 SENSOR DATA FETCH & DISPLAY
 * ============================================================
 */

async function fetchSensorData() {
    if (espIP === "test") {
        updateSensorData(25, 45, 1);
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

function updateSensorData(temp, hum, lux) {
    document.getElementById("temp-value").innerText = temp;
    document.getElementById("humidity-value").innerText = hum;

    const luxElement = document.getElementById("lux-value");
    if (luxElement) {
        luxElement.innerText = lux;
        luxElement.classList.remove("loading");
    }

    document.getElementById("temp-value").classList.remove("loading");
    document.getElementById("humidity-value").classList.remove("loading");

    setStatus(true);
    updateWeatherCardWithBackground(lux, temp, hum);
}

/**
 * ============================================================
 * 🟢/🔴 CONNECTION STATUS MONITORING
 * ============================================================
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

function startStatusMonitoring() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }

    if (espIP !== "test") {
        statusCheckInterval = setInterval(() => {
            if (Date.now() - lastUpdateTime > 6000) {
                setStatus(false);
            }
        }, 5000);
    }
}

/**
 * ============================================================
 * 🌦️ WEATHER CONDITION LOGIC & DISPLAY
 * ============================================================
 */

function getWeatherState(ldr, temp, humidity) {
    // 🌑 NIGHT / LOW LIGHT CONDITIONS
    if (ldr === 0) {
        if (temp < 10 && humidity > 80) {
            return { state: "Cold & Damp Night", emoji: "🌫️", bg: "linear-gradient(to right,rgb(64, 90, 116),rgb(90, 189, 204))" };
        } else if (temp >= 10 && temp <= 20 && humidity > 70) {
            return { state: "Cool & Humid Night", emoji: "🌃", bg: "linear-gradient(to right,rgb(144, 147, 148), #203a43)" };
        } else if (temp > 20 && temp <= 30 && humidity < 60) {
            return { state: "Clear Night", emoji: "✨", bg: "linear-gradient(to right,rgb(88, 140, 237),rgb(108, 154, 206))" };
        } else {
            return { state: "Uncertain Night", emoji: "❓", bg: "linear-gradient(to right, #757f9a, #d7dde8)" };
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

function updateWeatherCard(ldr, temp, humidity) {
    const { state, emoji, bg } = getWeatherState(ldr, temp, humidity);
    document.getElementById("weatherState").textContent = state;
    document.getElementById("weatherEmoji").textContent = emoji;
    document.getElementById("weatherCard").style.background = bg;
}

function updateWeatherCardWithBackground(ldr, temp, humidity) {
    updateWeatherCard(ldr, temp, humidity);

    if (window.updateBackground) {
        window.updateBackground(ldr);
    }
}

/**
 * ============================================================
 * 🌙✨ BACKGROUND SCENE CONTROLLER
 * ============================================================
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
 * 🔄 EVENT LISTENERS & INITIALIZATION
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize date/time updater
    setInterval(updateDateTime, 1000);
    updateDateTime();

    // Initialize data fetching
    setInterval(fetchSensorData, 2000);

    // Set up UI elements
    const ipInput = document.getElementById("esp-ip-input");
    if (espIP && (ipPattern.test(espIP) || espIP === "test")) {
        ipInput.value = espIP;
        validateIP();
        fetchSensorData();
        startStatusMonitoring();
    }

    // IP input event listeners
    ipInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            updateESPIP();
        }
    });

    // Connect button listener
    const connectBtn = document.getElementById("connect-btn");
    if (connectBtn) {
        connectBtn.addEventListener("click", updateESPIP);
    }

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

    // Create background scene
    createBackgroundScene();
});

/**
 * ============================================================
 * 🏞️ BACKGROUND SCENE SETUP
 * ============================================================
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

    // Define scene update function
    window.updateBackground = function (luxValue) {
        if (luxValue === 1) {
            setDayScene();
        } else if (luxValue === 0) {
            setNightScene();
        }
    };

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

// Utility function for error notifications (referenced but not implemented in original)
function showToast(message) {
    console.error(message);
    // Implement actual toast notification here if needed
}

/**
 * ============================================================
 * 📚 SIDEBAR TOGGLE FUNCTIONALITY
 * ============================================================
 */

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
const closeBtn = document.getElementById('sidebar-close');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
});
