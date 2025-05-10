// ===================================================
// 🌐 ESP IP MANAGEMENT
// ===================================================
const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
let espIP = getESPIP(); // declare globally

// 🔹 Get saved ESP IP from localStorage
function getESPIP() {
    return localStorage.getItem("espIP") || "";
}

// 🔹 Save ESP IP to localStorage and trigger fetch
function setESPIP(ip) {
    localStorage.setItem("espIP", ip);
    espIP = ip;
    fetchSensorData(); // fetch immediately after setting
}

// 🔹 Validate IP address format
function validateIP() {
    const input = document.getElementById("esp-ip-input");
    const connectBtn = document.getElementById("connect-btn");
    const ipValue = input.value.trim();

    connectBtn.disabled = !ipPattern.test(ipValue) && ipValue !== "test";
}

// ===================================================
// ⏰ DATE & TIME UPDATER
// ===================================================

// 🔹 Update date and time every second
function updateDateTime() {
    const date = new Date();
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    document.getElementById("date").textContent = formattedDate;
    document.getElementById("time").textContent = formattedTime;
}
setInterval(updateDateTime, 1000);
updateDateTime(); // Call once on load

// ===================================================
// 🌐 LIVE FETCH FROM ESP
// ===================================================

// 🔹 Fetch sensor data from ESP (if IP is set)

async function fetchSensorData() {
    if (espIP === "test") {
        updateSensorData(25, 50, 1);
        setStatus("live");
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
        lastUpdateTime = Date.now(); // ✅ Add this line here
        console.log("Successfully fetched from:", espIP);
    } catch (error) {
        console.error("Failed to fetch sensor data:", error);
        setStatus(false);
        // Optionally, show an inline error/toast instead of alert
        showToast("Could not fetch data from ESP32. Please check the IP and network.");
    }
}

// 🔹 Update ESP IP from input
function updateESPIP() {
    const inputField = document.getElementById("esp-ip-input");
    const input = inputField.value.trim();
    if (ipPattern.test(input) || input === "test") {
        setESPIP(input);
        console.log("ESP IP updated to:", input);
    } else {
        alert("Please enter a valid ESP IP address.");
    }
}

// 🔹 Fetch data every 2 seconds
setInterval(fetchSensorData, 2000);

// ===================================================
// 🧠 UPDATE SENSOR DATA
// ===================================================

// 🔹 Update DOM with sensor values and refresh status
function updateSensorData(temp, hum, lux) {
    document.getElementById("temp-value").innerText = temp;
    document.getElementById("humidity-value").innerText = hum;

    // Handle the case where lux element might not exist
    const luxElement = document.getElementById("lux-value");
    if (luxElement) {
        luxElement.innerText = lux;
        luxElement.classList.remove("loading");
    }

    document.getElementById("temp-value").classList.remove("loading");
    document.getElementById("humidity-value").classList.remove("loading");

    setStatus(true); // set to live

    updateWeatherCard(lux, temp, hum);
}

// ===================================================
// 🟢/🔴 STATUS INDICATOR
// ===================================================

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

// 🔹 Monitor last update time to toggle live/offline
let lastUpdateTime = Date.now();
setInterval(() => {
    const now = Date.now();
    if (now - lastUpdateTime > 6000) {
        setStatus(false);
    }
}, 5000);

// ===================================================
// 🌦️ WEATHER CONDITION LOGIC
// ===================================================

function getWeatherState(ldr, temp, humidity) {
    // Default to day conditions if ldr is undefined

    // 🌑 NIGHT / LOW LIGHT CONDITIONS
    if (ldr === 0) {
        if (temp < 10 && humidity > 80) {
            return { state: "Cold & Damp Night", emoji: "🌫️❄️🌌", bg: "#1e3c72, #2a5298" };
        } else if (temp >= 10 && temp <= 20 && humidity > 70) {
            return { state: "Cool & Humid Night", emoji: "🌃💧", bg: "#0f2027, #203a43" };
        } else if (temp > 20 && temp <= 30 && humidity < 60) {
            return { state: "Chill Clear Night", emoji: "🌃✨", bg: "#0f2027,rgb(181, 168, 234)" };
        } else {
            return { state: "Uncertain Night Conditions", emoji: "🌌❓", bg: "#ddd, #ccc" };
        }
    }

    // ☀️ DAY / BRIGHT CONDITIONS
    else if (ldr === 1) {
        if (temp < 10 && humidity > 80) {
            return { state: "Cold & Damp Morning", emoji: "🌫️❄️", bg: "#1e3c72, #2a5298" };
        } else if (temp >= 10 && temp <= 20 && humidity > 70) {
            return { state: "Cool & Humid", emoji: "🌥️💧", bg: "#bdc3c7, #2c3e50" };
        } else if (temp > 20 && temp <= 30 && humidity >= 40 && humidity <= 60) {
            return { state: "Pleasant Weather", emoji: "🌞😊", bg: "#56ccf2, #2f80ed" };
        } else if (temp > 30 && humidity < 40) {
            return { state: "Hot & Dry", emoji: "🔥☀️", bg: "#f12711, #f5af19" };
        } else if (temp > 30 && humidity >= 40) {
            return { state: "Hot & Humid", emoji: "🌡️💦", bg: "#f2994a, #f2c94c" };
        } else {
            return { state: "Uncertain Day Conditions", emoji: "🌞❓", bg: "#ddd, #ccc" };
        }
    }

    // 🤷 Unexpected ldr value
    else {
        return { state: "Unknown Light Level", emoji: "❓", bg: "#ddd, #ccc" };
    }
}

// ===================================================
// 🎨 WEATHER CARD UI UPDATER
// ===================================================

// 🔹 Update weather card with state, emoji, and background
function updateWeatherCard(ldr, temp, humidity) {
    const { state, emoji, bg } = getWeatherState(ldr, temp, humidity);
    document.getElementById("weatherState").textContent = state;
    document.getElementById("weatherEmoji").textContent = emoji;
    document.getElementById("weatherCard").style.background = `linear-gradient(135deg, ${bg})`;
}

// ===================================================
// 🌀 TILT ANIMATION EFFECT ON CARD
// ===================================================

// Wait for DOM to load before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Auto-fill IP field on page load if saved
    const ipInput = document.getElementById("esp-ip-input");
    if (espIP && ipPattern.test(espIP)) {
        ipInput.value = espIP;
        validateIP();
        fetchSensorData();
    }
    // Add event listener for IP input to submit on Enter
    ipInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            updateESPIP();
        }
    });

    // Set up tilt animation
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

});