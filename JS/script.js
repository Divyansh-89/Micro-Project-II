// ===================================================
// 🌐 ESP IP MANAGEMENT
// ===================================================

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

// 🔹 Initialize IP variable
let espIP = getESPIP();


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


// ===================================================
// 🌐 LIVE FETCH FROM ESP
// ===================================================

// 🔹 Fetch sensor data from ESP (if IP is set)
async function fetchSensorData() {
    if (!espIP) return;

    try {
        const response = await fetch(`http://${espIP}/data`);
        const data = await response.json();
        updateSensorData(data.temperature, data.humidity, data.lux);
        console.log("Fetched from:", espIP);
    } catch (error) {
        console.error("Failed to fetch sensor data:", error);
    }
}

// 🔹 Fetch data every 2 seconds
setInterval(fetchSensorData, 2000);
fetchSensorData();


// ===================================================
// 🧠 UPDATE SENSOR DATA
// ===================================================

// 🔹 Update DOM with sensor values and refresh status
function updateSensorData(temp, hum, lux) {
    document.getElementById("temp-value").innerText = temp;
    document.getElementById("humidity-value").innerText = hum;
    document.getElementById("lux-value").innerText = lux;

    document.getElementById("temp-value").classList.remove("loading");
    document.getElementById("humidity-value").classList.remove("loading");
    document.getElementById("lux-value").classList.remove("loading");

    lastUpdateTime = Date.now();
    setStatus(true); // set to live
    updateWeatherCard(lux, temp, hum); // update condition card
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

// 🔹 Get weather condition based on sensor values
function getWeatherState(ldr, temp, humidity) {
    if (ldr < 200 && temp < 20 && humidity > 75) {
        return { state: "Freezing Foggy Night", emoji: "🌫️❄️🌌", bg: "#1e3c72, #2a5298" };
    } else if (ldr < 200 && temp >= 20 && temp <= 30 && humidity < 60) {
        return { state: "Chill Clear Night", emoji: "🌃✨", bg: "#0f2027, #203a43" };
    } else if (ldr >= 200 && ldr <= 600 && temp < 25 && humidity > 65) {
        return { state: "Overcast & Damp", emoji: "☁️💧", bg: "#bdc3c7, #2c3e50" };
    } else if (ldr >= 200 && ldr <= 600 && temp >= 25 && temp <= 35 && humidity >= 40 && humidity <= 60) {
        return { state: "Partly Cloudy Day", emoji: "⛅🌤️", bg: "#ece9e6, #ffffff" };
    } else if (ldr > 600 && temp > 36 && humidity < 40) {
        return { state: "Scorching Hot & Dry", emoji: "🔥☀️", bg: "#f12711, #f5af19" };
    } else if (ldr > 600 && temp >= 24 && temp <= 35 && humidity >= 45 && humidity <= 65) {
        return { state: "Sunny & Pleasant", emoji: "🌞😊", bg: "#56ccf2, #2f80ed" };
    } else {
        return { state: "Uncertain Conditions", emoji: "❓", bg: "#ddd, #ccc" };
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

const card = document.querySelector(".weather-card");

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


// ===================================================
// 🔗 IP INPUT HANDLING FROM USER
// ===================================================

// 🔹 Update ESP IP from input
function updateESPIP() {
    const input = document.getElementById("esp-ip-input").value.trim();
    if (input) setESPIP(input);
}

// 🔹 Submit IP on pressing Enter
document.getElementById("esp-ip-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        updateESPIP();
    }
});

// 🔹 Auto-fill IP field on page load if saved
document.addEventListener("DOMContentLoaded", () => {
    const ipInput = document.getElementById("esp-ip-input");
    if (espIP && ipInput) ipInput.value = espIP;
});
