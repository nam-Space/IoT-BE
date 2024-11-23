#include <bits/stdc++.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <TaskScheduler.h>

using namespace std;

const char* ssid = "Hihi"; // SSID Wifi
const char* password = "hehehehe"; // Mật khẩu Wifi
const char* mqtt_server = "192.168.46.49"; // địa chỉ IPv4
const int portBroker = 1883;

// MQTT Topics cho từng phòng
const char* KITCHEN_ROOM = "KITCHEN ROOM";
const char* BED_ROOM = "BED ROOM";

// Biến trạng thái quạt cho từng phòng
String fanStateKitchen = "OFF";
String fanStateBed = "OFF";
float currentTemperatureKitchen = 0;
float currentTemperatureBed = 0;

// Thiết lập các thông số cho cảm biến và chân điều khiển
#define DHTTYPE_KITCHEN DHT11
#define DHTPIN_KITCHEN D1
#define in1Kitchen D2
#define in2Kitchen D3
#define enaKitchen D4

#define DHTTYPE_BED DHT22
#define DHTPIN_BED D5
#define in1Bed D6
#define in2Bed D7
#define enaBed D8

// Khởi tạo đối tượng DHT và MQTT client
DHT dhtKitchen(DHTPIN_KITCHEN, DHTTYPE_KITCHEN);
DHT dhtBed(DHTPIN_BED, DHTTYPE_BED);
WiFiClient espClient;
PubSubClient client(espClient);

// Scheduler để quản lý các task
Scheduler taskScheduler;

// Hàm callback khi nhận tin nhắn từ MQTT
void callback(char* topic, uint8_t * payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(msg);

  // Xử lý điều khiển quạt theo từng phòng
  if (strcmp(topic, KITCHEN_ROOM) == 0) {
    // Xử lý tin nhắn cho Kitchen Room
    if (msg.indexOf("fan-control") != -1) {
      handleFanControl(msg, fanStateKitchen, enaKitchen);
    }
  } else if (strcmp(topic, BED_ROOM) == 0) {
    // Xử lý tin nhắn cho Bed Room
    if (msg.indexOf("fan-control") != -1) {
      handleFanControl(msg, fanStateBed, enaBed);
    }
  }
}

// Hàm xử lý điều khiển quạt theo tin nhắn
void handleFanControl(String msg, String& fanState, int ena) {
  vector<string> v;
  stringstream ss(msg.c_str());
  string token;
  while (ss >> token) {
    v.push_back(token);
  }

  if (v[1] == "ON") {
    int performance = stoi(v[2].substr(12));
    int fanSpeed = ::map(performance, 0, 100, 0, 255);
    analogWrite(ena, fanSpeed);
    fanState = "ON";
  } else if (v[1] == "OFF") {
    analogWrite(ena, 0);
    fanState = "OFF";
  } else {
    fanState = "AUTO";
  }
}

// Task để đọc cảm biến DHT của Kitchen Room
void readDHTKitchen() {
  if (fanStateKitchen == "AUTO") {
    readAndControlFan(dhtKitchen, currentTemperatureKitchen, "672c885005272b29688305a8", enaKitchen);
  }
}

// Task để đọc cảm biến DHT của Bed Room
void readDHTBed() {
  if (fanStateBed == "AUTO") {
    readAndControlFan(dhtBed, currentTemperatureBed, "672c889005272b29688305b2", enaBed);
  }
}

// Hàm đọc cảm biến và điều khiển quạt
void readAndControlFan(DHT &dht, float &currentTemp, String sensorId, int ena) {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (!isnan(temperature)) {
    currentTemp = temperature;
    String payload = "{\"temperature\": " + String(temperature) + ", \"humidity\": " + String(humidity) + ", \"sensor\": " + "\"" + sensorId + "\"" + "}";
    client.publish("SENSOR", payload.c_str());

    if (currentTemp >= 22) {
      int fanSpeed = ::map(round(currentTemp), 21, 30, 0, 255);
      fanSpeed = constrain(fanSpeed, 0, 255);
      analogWrite(ena, fanSpeed);
    } else {
      analogWrite(ena, 0);
    }
  }
}

// Task để xử lý MQTT
void processMQTT() {
  client.loop();
}

// Khai báo các Task toàn cục
Task readDHTKitchenTask(2000, TASK_FOREVER, &readDHTKitchen);
Task readDHTBedTask(2000, TASK_FOREVER, &readDHTBed);
Task processMQTTTask(1, TASK_FOREVER, &processMQTT);

void setup() {
  Serial.begin(9600);
  dhtKitchen.begin();
  dhtBed.begin();

  pinMode(in1Kitchen, OUTPUT);
  pinMode(in2Kitchen, OUTPUT);
  pinMode(enaKitchen, OUTPUT);
  digitalWrite(in1Kitchen, HIGH);
  digitalWrite(in2Kitchen, LOW);

  pinMode(in1Bed, OUTPUT);
  pinMode(in2Bed, OUTPUT);
  pinMode(enaBed, OUTPUT);
  digitalWrite(in1Bed, HIGH);
  digitalWrite(in2Bed, LOW);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");

  Serial.print("ESP8266 IP Address: ");
  Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, portBroker);
  client.setCallback(callback);

  client.setKeepAlive(1);

  while (!client.connected()) {
    if (client.connect("Nam2")) {
      client.subscribe(KITCHEN_ROOM);
      client.subscribe(BED_ROOM);
    } else {
      delay(5000);
    }
  }

  taskScheduler.addTask(readDHTKitchenTask);
  taskScheduler.addTask(readDHTBedTask);
  taskScheduler.addTask(processMQTTTask);

  readDHTKitchenTask.enable();
  readDHTBedTask.enable();
  processMQTTTask.enable();
}

void loop() {
  taskScheduler.execute();
}
