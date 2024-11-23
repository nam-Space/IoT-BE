#include <bits/stdc++.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <TaskScheduler.h>

#include <Servo.h>
#include <SimpleKalmanFilter.h>
SimpleKalmanFilter bo_loc(2, 2, 0.001);

using namespace std;

const char* ssid = "Nam Son"; // SSID Wifi
const char* password = "33994609"; // Mật khẩu Wifi
const char* mqtt_server = "192.168.1.183"; // địa chỉ IPv4
const int portBroker = 1883;

const char* LIVING_ROOM = "LIVING ROOM";
const char* KITCHEN_ROOM = "KITCHEN ROOM";
const char* BED_ROOM = "BED ROOM";

String fanState = "OFF";  // Biến lưu trạng thái của quạt (ON, OFF, AUTO)
float currentTemperature = 0;  // Biến lưu nhiệt độ hiện tại

String ventilationFanState = "OFF";
String smokeAlarmState = "OFF";
String windowSmokeState = "OFF";

#define DHTTYPE DHT22
#define DHTPIN D1
#define in1 D2
#define in2 D3
#define ena D4

#define mq2Pin A0
#define buzzerPin D5
#define servo1Pin D6
#define servo2Pin D7
#define relayPin D8

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// Tạo một đối tượng Scheduler để quản lý các task
Scheduler taskScheduler;

int smokeThreshold = 400;

// Khởi tạo đối tượng động cơ servo
Servo servo1; 
Servo servo2; 

// Hàm callback khi nhận tin nhắn từ MQTT
void callback(char* topic, uint8_t * payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.println(msg);

  // Xử lý tin nhắn MQTT
  if (strcmp(topic, LIVING_ROOM) == 0) {
    if (msg.indexOf("fan-control") != -1) {
      vector<string> v;
      stringstream ss(msg.c_str());
      string token;
      while (ss >> token) {
        v.push_back(token);
      }

      if (v[1] == "ON") {
        int performance = stoi(v[2].substr(12));
        int fanSpeed = ::map(performance, 0, 100, 0, 255);
        analogWrite(ena, fanSpeed); // Bật quạt
        Serial.println("Fan ON");
        fanState = "ON";
      } else if (v[1] == "OFF") {
        analogWrite(ena, 0); // Tắt quạt
        Serial.println("Fan OFF");
        fanState = "OFF";
      } else {
        Serial.println("Fan AUTO mode activated");
        fanState = "AUTO";
      }
    }
  }
  else if (strcmp(topic, KITCHEN_ROOM) == 0) {
    if (msg.indexOf("ventilation-fan-control") != -1) {
      vector<string> v;
      stringstream ss(msg.c_str());
      string token;
      while (ss >> token) {
        v.push_back(token);
      }

      if (v[1] == "ON") {
        digitalWrite(relayPin, HIGH);
        ventilationFanState = "ON";
      }
      else if (v[1] == "OFF") {
        digitalWrite(relayPin, LOW);
        ventilationFanState = "OFF";
      }
      else {
        Serial.println("ventilationFan AUTO mode activated");
        ventilationFanState = "AUTO";
      }
    }
    else if (msg.indexOf("smoke-alarm-control") != -1) {
      vector<string> v;
      stringstream ss(msg.c_str());
      string token;
      while (ss >> token) {
        v.push_back(token);
      }

      if (v[1] == "ON") {
        digitalWrite(buzzerPin, HIGH);
        smokeAlarmState = "ON";
      }
      else if (v[1] == "OFF") {
        digitalWrite(buzzerPin, LOW);
        smokeAlarmState = "OFF";
      }
      else {
        Serial.println("smokeAlarm AUTO mode activated");
        smokeAlarmState = "AUTO";
      }
    }
    else if (msg.indexOf("window-smoke-control") != -1) {
      vector<string> v;
      stringstream ss(msg.c_str());
      string token;
      while (ss >> token) {
        v.push_back(token);
      }

      if (v[1] == "ON") {
        servo1.write(0);  // Quay động cơ servo 1 về giữa
        servo2.write(180);  // Quay động cơ servo 2 về giữa
        windowSmokeState = "ON";
      }
      else if (v[1] == "OFF") {
        servo1.write(180);  // Động cơ servo 1 ở vị trí ban đầu
        servo2.write(0);  // Động cơ servo 2 ở vị trí ban đầu
        windowSmokeState = "OFF";
      }
      else {
        Serial.println("windowSmoke AUTO mode activated");
        windowSmokeState = "AUTO";
      }
    }
  }
}

// Task để đọc cảm biến DHT mỗi 2 giây
void readDHT() {
  if (fanState == "AUTO") {
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    if (!isnan(temperature)) {
      currentTemperature = temperature;  // Cập nhật nhiệt độ hiện tại
      Serial.print("Nhiệt độ: ");
      Serial.println(currentTemperature);
      Serial.print("Độ ẩm: ");
      Serial.println(humidity);

      String sensorId = "\"6705658925b1fed0c08982a6\"";

      // Tạo chuỗi JSON để gửi dữ liệu
      String payload = "{\"temperature\": " + String(temperature) + ", \"humidity\": " + String(humidity) + ", \"sensor\": " + sensorId + "}";
      
      // Publish lên MQTT topic "SENSOR"
      client.publish("SENSOR", payload.c_str());

      // Điều chỉnh quạt theo nhiệt độ
      if (currentTemperature >= 22) {
        int fanSpeed = ::map(round(currentTemperature), 21, 30, 0, 255);
        fanSpeed = constrain(fanSpeed, 0, 255);
        analogWrite(ena, fanSpeed);
        Serial.print("Quạt bật, điện áp: ");
        Serial.println(fanSpeed);
      } else {
        analogWrite(ena, 0); // Tắt quạt nếu nhiệt độ < 22
        Serial.println("Quạt tắt do nhiệt độ thấp hơn 22 độ");
      }
    }
  }
}

// Task để xử lý MQTT
void processMQTT() {
  client.loop();  // Luôn luôn lắng nghe và xử lý các yêu cầu từ MQTT
}

void readSmokeVentilationFan() {
  if (ventilationFanState == "AUTO") {
    // Đọc giá trị từ cảm biến MQ2
    int smoke = analogRead(mq2Pin);
    smoke = bo_loc.updateEstimate(smoke);

    // Kiểm tra nếu giá trị khí độc vượt quá ngưỡng
    if (smoke > smokeThreshold) {
      digitalWrite(relayPin, HIGH);
    }
    else {
      digitalWrite(relayPin, LOW);  // Tắt quạt
    }
  }
}

void readSmokeAlarm() {
  if (smokeAlarmState == "AUTO") {
    // Đọc giá trị từ cảm biến MQ2
    int smoke = analogRead(mq2Pin);
    smoke = bo_loc.updateEstimate(smoke);
    // In giá trị lên Serial Monitor để theo dõi
    // Serial.print("smoke: ");
    // Serial.println(smoke);

    // Kiểm tra nếu giá trị khí độc vượt quá ngưỡng
    if (smoke > smokeThreshold) {
      digitalWrite(buzzerPin, HIGH);  // Kích hoạt còi
    }
    else {
      digitalWrite(buzzerPin, LOW);  // Tắt còi
    }
  }
}

void readSmokeWindow() {
  if (windowSmokeState == "AUTO") {
    // Đọc giá trị từ cảm biến MQ2
    int smoke = analogRead(mq2Pin);
    smoke = bo_loc.updateEstimate(smoke);
    // In giá trị lên Serial Monitor để theo dõi
    // Serial.print("smoke: ");
    // Serial.println(smoke);

    // Kiểm tra nếu giá trị khí độc vượt quá ngưỡng
    if (smoke > smokeThreshold) {
      servo1.write(0);  // Quay động cơ servo 1 về giữa
      servo2.write(180);  // Quay động cơ servo 2 về giữa
    }
    else {
      servo1.write(180);  // Động cơ servo 1 ở vị trí ban đầu
      servo2.write(0);  // Động cơ servo 2 ở vị trí ban đầu
    }
  }
}

void reconnect() {
  // Lặp lại cho đến khi kết nối thành công
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Cố gắng kết nối lại
    if (client.connect("ESP8266Client")) {
      Serial.println("connected");
      // Đăng ký lại các topic
      client.subscribe(LIVING_ROOM);
      client.subscribe(KITCHEN_ROOM);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Đợi 5 giây trước khi thử lại
      delay(5000);
    }
  }
}


// Khai báo các Task toàn cục
Task readDHTTask(2000, TASK_FOREVER, &readDHT);  // Task đọc DHT mỗi 2 giây
Task processMQTTTask(1, TASK_FOREVER, &processMQTT);  // Task xử lý MQTT mỗi 1ms
Task readSmokeVentilationFanTask(10, TASK_FOREVER, &readSmokeVentilationFan); // đọc cảm biến khói mỗi 10ms
Task readSmokeAlarmTask(10, TASK_FOREVER, &readSmokeAlarm); // đọc cảm biến khói mỗi 10ms
Task readSmokeWindowTask(10, TASK_FOREVER, &readSmokeWindow); // đọc cảm biến khói mỗi 10ms

void setup() {
  Serial.begin(9600);
  dht.begin();

  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
  pinMode(ena, OUTPUT);

  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);

  // Khởi tạo chân kết nối cho các thiết bị
  pinMode(mq2Pin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(relayPin, OUTPUT);
  servo1.attach(servo1Pin);
  servo2.attach(servo2Pin);

  // Đưa động cơ servo về vị trí ban đầu
  servo1.write(180);
  servo2.write(0);

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
  reconnect();

  // Thêm các task vào Scheduler
  taskScheduler.addTask(readDHTTask);  // Thêm Task đọc DHT
  taskScheduler.addTask(processMQTTTask);  // Thêm Task xử lý MQTT
  taskScheduler.addTask(readSmokeVentilationFanTask);  // Thêm Task đọc cảm biến khói
  taskScheduler.addTask(readSmokeAlarmTask);  // Thêm Task đọc cảm biến khói
  taskScheduler.addTask(readSmokeWindowTask);  // Thêm Task đọc cảm biến khói

  // Kích hoạt các task
  readDHTTask.enable();
  processMQTTTask.enable();
  readSmokeVentilationFanTask.enable();
  readSmokeAlarmTask.enable();
  readSmokeWindowTask.enable();
}

void loop() {
  taskScheduler.execute();  // Thực thi các task
}
