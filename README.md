
# 🌦️ Micro Project II - Weather Dashboard

![Weather Dashboard Screenshot](https://github.com/Divyansh-89/Micro-Project-II/blob/c211bf07081f5cdf316a9aa51ad39ab4364bcfb8/DEMO%20IMAGES/Screenshot%202025-05-14%20175155.png)

A real-time, interactive weather dashboard powered by **ESP32**, **DHT11**, and **LDR** sensors. This project collects live **temperature**, **humidity**, and **light intensity** data and displays it in a modern, responsive web interface. Perfect for learning IoT, web development, and real-world sensor integration!

---

## 🚀 Features

- 🔴 **Live Data**: Instant temperature, humidity, and light updates from ESP32.
- 📊 **Visual Dashboard**: Clean, responsive, and mobile-friendly user interface.
- 🌙 **Light Detection**: See day/night transition using LDR.
- 🛎️ **Custom Alerts**: Set threshold values for each parameter and receive alerts in real-time.
- 🧹 **Clear Storage**: One-click button to erase stored sensor data instantly.
- 🌐 **Easy Deployment**: Host the dashboard on GitHub Pages or access via ESP32 IP.
- 🔌 **Plug & Play**: Auto-connect feature—no need to manually enter IP address.
- ➕ **Expandable**: Add more sensors like BMP180, rain sensors, etc.

---

## 🧰 Technologies Used

| Component        | Purpose                                 |
|------------------|-----------------------------------------|
| **ESP32**         | Wi-Fi microcontroller for data + server |
| **DHT11**         | Measures temperature & humidity         |
| **LDR**           | Detects ambient light                   |
| **HTML5/CSS3**    | Front-end interface                     |
| **JavaScript**    | Real-time updates & logic               |
| **GitHub Pages**  | Free hosting for static site            |

---

## 🧱 Hardware Setup

### 🔌 Required Components

- ESP32 Dev Board  
- DHT11 Sensor  
- LDR Sensor  
- Resistors, Jumper Wires, Breadboard  

### ⚡ Wiring Overview

| Component | ESP32 GPIO Pin |
|----------|----------------|
| DHT11    | GPIO 13 (e.g.) |
| LDR      | GPIO 12 (via voltage divider) |
| Power    | 3.3V and GND   |

---

## 🔧 ESP32 Firmware Setup

### 1. Connect Sensors
Wire DHT11 and LDR as described above.

### 2. Configure Wi-Fi

```cpp
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
```

### 3. (Optional) Static IP

```cpp
IPAddress local_IP(192,168,1,184);
IPAddress gateway(192,168,1,1);
IPAddress subnet(255,255,255,0);
WiFi.config(local_IP, gateway, subnet);
```

### 4. Upload & Monitor
Upload the firmware and open the Serial Monitor:

```cpp
Serial.println(WiFi.localIP());
```

---

## 🌐 Dashboard Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/Divyansh-89/Micro-Project-II.git
cd Micro-Project-II
```

### 2. Edit IP Configuration

In `config.js`, update:

```js
export const ESP32_API_URL = "http://<YOUR_ESP32_IP>/data";
```

### 3. Host on GitHub Pages

- Push code to GitHub  
- Enable GitHub Pages (Settings → Pages → Source: `main`, folder: `/root` or `/docs`)  
- Access:  
```
[(https://divyansh-89.github.io/Micro-Project-II/)]

```

---

## 📖 Usage

- Open the dashboard in your browser.
- Power on the ESP32.
- Watch temperature, humidity, and light data update live.
- Set thresholds and clear logs directly from UI.

---

## 🛎️ Custom Alerts & 🧹 Clear Storage

Users can set **temperature**, **humidity**, and **light** limits. If any reading crosses the threshold, a visual or audio alert appears instantly—great for real-time environment monitoring. Want to restart monitoring? Use the **Clear Storage** button to wipe previous readings and begin fresh tracking.  
![1](https://github.com/Divyansh-89/Micro-Project-II/blob/d982414611d399bfdb945bcc1b78103bd63f3929/DEMO%20IMAGES/Screenshot%202025-05-12%20084140.png)  
![2](https://github.com/Divyansh-89/Micro-Project-II/blob/d982414611d399bfdb945bcc1b78103bd63f3929/DEMO%20IMAGES/Screenshot%202025-05-12%20084105.png)  


## ✨ More Features

- User-friendly configuration
- Fully mobile-compatible layout
- Can be extended with additional sensors or data logging
- Dark mode toggle (optional)

---

## 📸 Demo

![1](https://github.com/Divyansh-89/Micro-Project-II/blob/d982414611d399bfdb945bcc1b78103bd63f3929/DEMO%20IMAGES/Screenshot%202025-05-12%20003439.png)
![2](https://github.com/Divyansh-89/Micro-Project-II/blob/d982414611d399bfdb945bcc1b78103bd63f3929/DEMO%20IMAGES/Screenshot%202025-05-12%20084522.png)


---

## 🤝 Credits

Inspired by [Random Nerd Tutorials](https://randomnerdtutorials.com) and the open-source IoT community.  
**Project by:** [Divyansh-89](https://github.com/Divyansh-89)

---

## 📄 License

This project is licensed under the [MIT License](https://github.com/Divyansh-89/Micro-Project-II/blob/7787d145afd34f5250210711c1409f96d12c11d7/LICENSE)

---

## 📌 Quick Links

- [ESP32 Wi-Fi Docs (RandomNerdTutorials)](https://randomnerdtutorials.com/esp32-useful-wi-fi-functions-arduino/)
- [ESP32 Static IP Guide](https://randomnerdtutorials.com/esp32-static-fixed-ip-address-arduino-ide/)
- [PlatformIO IP Debugging](https://community.platformio.org/t/how-do-i-find-the-ip-address-for-esp32/14516)
- [IoT Weather Station Reference](https://iotdesignpro.com/projects/iot-based-esp32-wi-fi-weather-station-using-dht11-and-bmp-180-sensor)

---
