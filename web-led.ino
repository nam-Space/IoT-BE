#include <bits/stdc++.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <TaskScheduler.h>

using namespace std;

// Cấu hình Wi-Fi
const char* ssid = "Nam Son";
const char* password = "33994609";

// Cấu hình MQTT
const char* mqtt_server = "192.168.1.183";
const int mqtt_port = 1883;

const char* LIVING_ROOM = "LIVING ROOM";
const char* KITCHEN_ROOM = "KITCHEN ROOM";
const char* BED_ROOM = "BED ROOM";
const char* BALCONY = "BALCONY";

// Định nghĩa các chân cho cảm biến
#define SR505_PIN 1
#define LED_PIN_LIVING_ROOM 8
#define LED_PIN_KITCHEN_ROOM 2
#define LED_PIN_BED_ROOM 19

#define RAIN_SENSOR_PIN 4
#define ENA_PIN 5      // Chân điều khiển tốc độ động cơ
#define IN1_PIN 6     // Chân IN1 của L298N
#define IN2_PIN 7     // Chân IN2 của L298N
#define SWITCH_PIN1 3   // Chân đọc tín hiệu công tắc hành trình  
#define SWITCH_PIN2 18

WiFiClient espClient;
PubSubClient client(espClient);
Scheduler ts;

// Trạng thái của cửa và chế độ tự động
String rainMode = "OFF";
int led = 0; // door close
String ledMode = "OFF";

// Hàm kết nối Wi-Fi
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Kết nối Wi-Fi tới: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi đã kết nối");
  Serial.print("Địa chỉ IP: ");
  Serial.println(WiFi.localIP());
}

int temp = 1000;

// Hàm callback để xử lý tin nhắn MQTT
void mqtt_callback(char* topic, uint8_t* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.println(msg);

  // Xử lý lệnh MQTT
  if (strcmp(topic, LIVING_ROOM) == 0) {
    if (msg.indexOf("led-control") != -1) {
      vector<string> v;
      stringstream ss(msg.c_str());
      string token;
      while (ss >> token) {
        v.push_back(token);
      }

      if (v[1] == "ON") {
        Serial.println("Led ON mode activated");
        switchOnLed();
        ledMode = "ON";
      } else if (v[1] == "OFF") {
        Serial.println("Led OFF mode activated");
        switchOffLed();
        ledMode = "OFF";
      } else {
        Serial.println("Led AUTO mode activated");
        ledMode = "AUTO";
      }
    }
  }
  else if (strcmp(topic, BALCONY) == 0) {
    if (msg.indexOf("rain-cover-control") != -1) {
      vector<string> v;
      stringstream ss(msg.c_str());
      string token;
      while (ss >> token) {
        v.push_back(token);
      }

      if (v[1] == "ON") {
        digitalWrite(IN1_PIN, LOW);
        digitalWrite(IN2_PIN, HIGH);
        Serial.println("tien");
        rainMode = "ON";
      } else if (v[1] == "OFF") {
        digitalWrite(IN1_PIN, HIGH);
        digitalWrite(IN2_PIN, LOW);
        Serial.println("lui");
        rainMode = "OFF";
      } else {
        Serial.println("Rain cover AUTO mode activated");
        rainMode = "AUTO";
      }
    }
  }
  else if (strcmp(topic, KITCHEN_ROOM) == 0) {
    if (msg.indexOf("led-control") != -1) {
      vector<string> v;
      stringstream ss(msg.c_str());
      string token;
      while (ss >> token) {
        v.push_back(token);
      }

      if (v[1] == "ON") {
        Serial.println("Led kitchen ON mode activated");
        digitalWrite(LED_PIN_KITCHEN_ROOM, HIGH);
        Serial.println("bật led kitchen room");
      } else if (v[1] == "OFF") {
        Serial.println("Led kitchen OFF mode activated");
        digitalWrite(LED_PIN_KITCHEN_ROOM, LOW);
        Serial.println("tắt led kitchen room");
      }
    }
  }
  else if (strcmp(topic, BED_ROOM) == 0) {
    if (msg.indexOf("led-control") != -1) {
      vector<string> v;
      stringstream ss(msg.c_str());
      string token;
      while (ss >> token) {
        v.push_back(token);
      }

      if (v[1] == "ON") {
        Serial.println("Led bedroom ON mode activated");
        digitalWrite(LED_PIN_BED_ROOM, HIGH);
        Serial.println("bật led bedroom room");
      } else if (v[1] == "OFF") {
        Serial.println("Led bedroom OFF mode activated");
        digitalWrite(LED_PIN_BED_ROOM, LOW);
        Serial.println("tắt led bedroom room");
      }
    }
  }
}

// Hàm kết nối lại với MQTT broker
void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang kết nối MQTT...");
    if (client.connect("TRI")) {
      Serial.println("Đã kết nối thành công tới MQTT broker");
      client.subscribe(LIVING_ROOM);
      client.subscribe(BALCONY);
      client.subscribe(KITCHEN_ROOM);
      client.subscribe(BED_ROOM);
    } else {
      Serial.print("Kết nối MQTT thất bại, mã lỗi: ");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

// Hàm mở cửa
void switchOnLed() {
  digitalWrite(LED_PIN_LIVING_ROOM, HIGH);
  led = 1;
  Serial.println("bật led");
}

// Hàm đóng cửa
void switchOffLed() {
  digitalWrite(LED_PIN_LIVING_ROOM, LOW);
  led = 0;
  Serial.println("tắt led");
}

// Tác vụ kiểm tra cảm biến
void checkSensor() {
  if (ledMode == "AUTO") {
    int sensorState = digitalRead(SR505_PIN);
    Serial.print("Trang thai SR505 :");
    Serial.println(sensorState);
    Serial.println(led);
    String status = sensorState == 1 ? "\"Có người\"" : "\"Chưa có người\"";

    String sensorId = "\"6720f3988ce07d81161f84ec\"";
    
    String payload = "{\"status\": " + status + ", \"sensor\": " + sensorId + "}";

    // Publish lên MQTT topic "SENSOR"
    client.publish("SENSOR", payload.c_str());

    if (sensorState == HIGH) {
      switchOnLed();
    } else if (sensorState == LOW) {
      switchOffLed();
    }
  }
}

void tien() {
  digitalWrite(IN1_PIN, LOW);
  digitalWrite(IN2_PIN, HIGH);
}

void lui() {
  digitalWrite(IN1_PIN, HIGH);
  digitalWrite(IN2_PIN, LOW);
}

void dung() {
  digitalWrite(IN1_PIN, LOW);
  digitalWrite(IN2_PIN, LOW);
}

void checkSwitch() {
  if (rainMode != "AUTO") {
    int ct1 = digitalRead(SWITCH_PIN1);
    int ct2 = digitalRead(SWITCH_PIN2);
    if (ct1 == LOW && ct2 == HIGH && rainMode == "ON") {
      tien();
    }
    else if (ct1 == HIGH && ct2 == LOW && rainMode == "ON") {
      dung();
    }
    else if (ct1 == HIGH && ct2 == LOW && rainMode == "OFF") {
      lui();
    }
    else if (ct1 == LOW && ct2 == HIGH && rainMode == "OFF") {
      dung();
    }
    else if (ct1 == HIGH && ct2 == HIGH && rainMode == "ON") {
      tien();
    }
    else if (ct1 == HIGH && ct2 == HIGH && rainMode == "OFF") {
      lui();
    }
  }
  else {
    int rainValue = analogRead(RAIN_SENSOR_PIN);
    int ct1 = digitalRead(SWITCH_PIN1);
    int ct2 = digitalRead(SWITCH_PIN2);
    bool isRaining = rainValue < 500;
    if (ct1 == LOW && ct2 == HIGH && isRaining) {
      tien();
    }
    else if (ct1 == HIGH && ct2 == LOW && isRaining) {
      dung();
    }
    else if (ct1 == HIGH && ct2 == LOW && !isRaining) {
      lui();
    }
    else if (ct1 == LOW && ct2 == HIGH && !isRaining) {
      dung();
    }
    else if (ct1 == HIGH && ct2 == HIGH && isRaining) {
      tien();
    }
    else if (ct1 == HIGH && ct2 == HIGH && !isRaining) {
      lui();
    }
  }
}

void checkSensorRain() {
  if (rainMode == "AUTO") {
    int rainValue = analogRead(RAIN_SENSOR_PIN);
    bool isRaining = rainValue < 500;
    String status = isRaining ? "\"Có mưa\"" : "\"Chưa có mưa\"";

    String sensorId = "\"67304e1ca40d5725b12b5023\"";
    
    String payload = "{\"status\": " + status + ", \"sensor\": " + sensorId + "}";

    // Publish lên MQTT topic "SENSOR"
    client.publish("SENSOR", payload.c_str());
  }
}

// Tác vụ MQTT
void handleMQTT() {
  client.loop();
}

Task taskCheckSensor(1000, TASK_FOREVER, &checkSensor); // 100ms đọc cảm biến 1 lần
Task taskCheckSwitch(1, TASK_FOREVER, &checkSwitch);
Task taskCheckSensorRain(2000, TASK_FOREVER, &checkSensorRain);
Task taskHandleMQTT(1, TASK_FOREVER, &handleMQTT); // độ trễ 1ms cho giao thức mqtt

void setup() {
  Serial.begin(9600);

  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(ENA_PIN, OUTPUT);
  pinMode(IN1_PIN, OUTPUT);
  pinMode(IN2_PIN, OUTPUT);
  pinMode(SWITCH_PIN1, INPUT_PULLUP);  // Kích hoạt điện trở kéo lên cho công tắc hành trình
  pinMode(SWITCH_PIN2, INPUT_PULLUP);
  
  analogWrite(ENA_PIN, 255);  // Thiết lập tốc độ động cơ tối đa
  
  setup_wifi();
  pinMode(LED_PIN_LIVING_ROOM, OUTPUT);
  pinMode(LED_PIN_KITCHEN_ROOM, OUTPUT);  
  pinMode(LED_PIN_BED_ROOM, OUTPUT);  
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqtt_callback);

  // Kết nối tới MQTT broker ngay tại đây
  client.setKeepAlive(1);
  reconnect();

  pinMode(SR505_PIN, INPUT);
  digitalWrite(LED_PIN_LIVING_ROOM, LOW);
  // Thêm các tác vụ vào scheduler
  ts.addTask(taskCheckSensor);
  ts.addTask(taskHandleMQTT);
  ts.addTask(taskCheckSwitch);
  ts.addTask(taskCheckSensorRain);

  taskCheckSensor.enable();
  taskHandleMQTT.enable();
  taskCheckSwitch.enable();
  taskCheckSensorRain.enable();
}

void loop() {
  ts.execute();  // Thực thi các tác vụ
}

