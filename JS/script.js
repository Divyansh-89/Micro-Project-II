function updateDateTime() {
    const date = new Date();
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    document.getElementById("date").textContent = formattedDate;
    document.getElementById("time").textContent = formattedTime;
}
setInterval(updateDateTime, 1000);

// LIVE FETCH FROM ESP
async function fetchSensorData() {
    try {
        const response = await fetch("http://<esp_ip>/data");
        const data = await response.json();
        updateSensorData(data.temperature, data.humidity, data.lux);
    } catch (error) {
        console.error("Failed to fetch sensor data:", error);
    }
}
setInterval(fetchSensorData, 2000);
fetchSensorData();

// CLEAN + SINGLE updateSensorData
function updateSensorData(temp, hum, lux) {
    document.getElementById("temp-value").innerText = temp;
    document.getElementById("humidity-value").innerText = hum;
    document.getElementById("lux-value").innerText = lux;

    document.getElementById("temp-value").classList.remove("loading");
    document.getElementById("humidity-value").classList.remove("loading");
    document.getElementById("lux-value").classList.remove("loading");

    lastUpdateTime = Date.now();
    setStatus(true);

    // 💡 ALSO update weather card here
    updateWeatherCard(lux, temp, hum);
}

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

let lastUpdateTime = Date.now();

// Monitor status every 5 sec
setInterval(() => {
    const now = Date.now();
    if (now - lastUpdateTime > 6000) {
        setStatus(false);
    }
}, 5000);

// 🌦️ Weather logic
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

// 🎨 Weather Card Update
function updateWeatherCard(ldr, temp, humidity) {
    const { state, emoji, bg } = getWeatherState(ldr, temp, humidity);

    document.getElementById("weatherState").textContent = state;
    document.getElementById("weatherEmoji").textContent = emoji;
    document.getElementById("weatherCard").style.background = `linear-gradient(135deg, ${bg})`;
}

// Weather Card Tilt Effect
const card = document.querySelector(".weather-card");

card.addEventListener("mousemove", (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left; // x position within the card
  const y = e.clientY - rect.top;  // y position within the card

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = ((y - centerY) / centerY) * 8; // Max 8deg
  const rotateY = ((x - centerX) / centerX) * 8;

  card.style.transform = `rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
});

card.addEventListener("mouseleave", () => {
  card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
});
