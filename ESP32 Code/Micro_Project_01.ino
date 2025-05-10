#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

#define DHTPIN 15
#define DHTTYPE DHT11
#define LDR_PIN 27

const char* ssid = "divyansh";          // 🔁 Change to your Wi-Fi SSID
const char* password = "harshit#2024";  // 🔁 Change to your Wi-Fi Password

DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);  // Default HTTP port

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(LDR_PIN, INPUT);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  server.on("/data", HTTP_GET, handleSensorData);
  server.begin();
  Serial.println("Server started");
}

void loop() {
  server.handleClient();
}

void handleSensorData() {
  // Add CORS header to allow your frontend to access the resource
  server.sendHeader("Access-Control-Allow-Origin", "*");  // This allows all origins. You can restrict it to specific origins if needed.

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int lightStatus = digitalRead(LDR_PIN);
  lightStatus = !lightStatus;  // Invert logic if using pull-up

  if (isnan(temperature) || isnan(humidity)) {
    server.send(500, "application/json", "{\"error\":\"Sensor read failed\"}");
    return;
  }

  String json = "{";
  json += "\"temperature\":" + String(temperature, 1) + ",";
  json += "\"humidity\":" + String(humidity, 1) + ",";
  json += "\"lux\":" + String(lightStatus);  // 0 or 1
  json += "}";

  server.send(200, "application/json", json);
}
