#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h> // Use the ESP32Servo library for servo control
#include <WiFi.h>
#include <PubSubClient.h>

// ESP32 Pins
#define RST_PIN 15       // RC522 Reset pin
#define SS_PIN 5         // RC522 SDA pin
#define LED_PIN 2        // D2 LED for feedback
#define BUTTON_PIN 0     // Button for switching modes
#define SERVO_PIN 13     // Servo control pin

// WiFi and MQTT setup
const char* ssid = "Nam Son";           // Replace with your WiFi SSID
const char* password = "33994609";            // Replace with your WiFi password
const char* mqttServer = "192.168.1.183";     // Replace with your MQTT broker address
const int mqttPort = 1883;                    // Replace with your MQTT broker port

WiFiClient espClient;
PubSubClient client(espClient);

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance
Servo myServo;                    // Create Servo object

bool regMode = false;              // Start in Authentication Mode
volatile bool checkResult = false; // Stores "true" or "false" from the Check message
volatile bool receivedCheck = false;
volatile bool cardExisted = false;

void setup() {
  Serial.begin(115200);

  // Initialize Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected to WiFi!");

  // Set up MQTT
  client.setServer(mqttServer, mqttPort);
  client.setCallback(mqttCallback); // Set the MQTT message handler
  
  client.setKeepAlive(1);
  connectToMQTT();

  SPI.begin(18, 19, 23);           // Initialize SPI for RC522
  mfrc522.PCD_Init();              // Initialize RC522 module
  pinMode(LED_PIN, OUTPUT);        // Set LED pin as output
  pinMode(BUTTON_PIN, INPUT_PULLUP); // Button for switching modes

  myServo.attach(SERVO_PIN);       // Attach servo to pin 21
  myServo.write(0);                // Set initial position to 0 degrees

  Serial.println("System Initialized. Press the button to switch modes.");
  indicateMode();
}

void loop() {
  // Reconnect to MQTT if disconnected
  if (!client.connected()) {
    connectToMQTT();
  }
  client.loop();

  static unsigned long buttonPressTime = 0;
  static bool buttonHeld = false;

  if (digitalRead(BUTTON_PIN) == LOW) {
    if (!buttonHeld) {
      buttonPressTime = millis(); // Start timing the button press
      buttonHeld = true;
    }

    // Check for a short press (mode toggle)
    if (millis() - buttonPressTime > 200) {
      regMode = !regMode;
      indicateMode(); // Blink LED to indicate mode change
      buttonHeld = false;
      delay(500); // Debounce delay
    }
  } else {
    buttonHeld = false; // Reset button state when not pressed
  }

  if (regMode) {
    registrationMode(); // Handle registration
  } else {
    readMode();         // Handle authentication
  }
}

void registrationMode() {
  digitalWrite(LED_PIN, HIGH);

  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Read the card UID
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.print("Publishing Authentication UID: ");
  Serial.println(uid);

  // Publish UID to MQTT with "authentication" status
  String payload = "{\"status\":\"AUTHENTICATE\", \"cardId\":\"" + uid + "\"}";
  client.publish("rfid/uid", payload.c_str());

  // Wait for "Check" message
  receivedCheck = false; // Reset the flag
  Serial.println("Waiting for Check message...");

  unsigned long startTime = millis();
  while (!receivedCheck) {
    client.loop(); // Ensure MQTT client processes incoming messages
    if (millis() - startTime > 5000) { // Timeout after 5 seconds
      Serial.println("Check message not received. Aborting.");
      return;
    }
  }
  mfrc522.PICC_HaltA(); // Halt card communication
  delay(1000);

  // Process the "Check" result
  if (checkResult) {
    Serial.println("Authentication Complete. Please Register");

    if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
      return;
    }

    String regUID = ""; // Separate variable for registration UID
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      regUID += String(mfrc522.uid.uidByte[i], HEX);
    }

    Serial.print("Publishing Registration UID: ");
    Serial.println(regUID);

    // Publish registration payload
    String regPayload = "{\"status\":\"REGISTER\", \"cardId\":\"" + regUID + "\"}";
    client.publish("rfid/uid", regPayload.c_str());

    // Wait for message
    receivedCheck = false; // Reset the flag
    Serial.println("Waiting for Check message...");

    unsigned long startTime = millis();
    while (!receivedCheck) {
      client.loop(); // Ensure MQTT client processes incoming messages
      if (millis() - startTime > 5000) { // Timeout after 5 seconds
        Serial.println("Check message not received. Aborting.");
        return;
      }
    }

    if (!cardExisted){
      // Blink LED to confirm registration
      for (int i = 0; i < 5; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
      }
      
    } else{
      digitalWrite(LED_PIN, LOW);
      delay(3000);
    }
    
  } else {
    Serial.println("Authentication Failed. Exit Registration");
    regMode = false;
    indicateMode();
  }

  mfrc522.PICC_HaltA(); // Halt card communication
}

void readMode() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Read the card UID
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }

  Serial.print("Publishing Authentication UID: ");
  Serial.println(uid);

  // Publish UID to MQTT with "authentication" status
  String payload = "{\"status\":\"AUTHENTICATE\", \"cardId\":\"" + uid + "\"}";
  client.publish("rfid/uid", payload.c_str());

  // Wait for "Check" message
  receivedCheck = false; // Reset the flag
  Serial.println("Waiting for Check message...");

  unsigned long startTime = millis();
  while (!receivedCheck) {
    client.loop(); // Ensure MQTT client processes incoming messages
    if (millis() - startTime > 5000) { // Timeout after 5 seconds
      Serial.println("Check message not received. Aborting.");
      return;
    }
  }

  // Process the "Check" result
  if (checkResult) {
    Serial.println("Access Granted by Database");
    digitalWrite(LED_PIN, HIGH);
    moveServo(); // Trigger servo
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.println("Access Denied by Database");
  }

  mfrc522.PICC_HaltA(); // Halt card communication
}

void moveServo() {
  myServo.write(90); // Move servo to 90 degrees
  delay(3000);       // Hold position for 3 seconds
  myServo.write(0);  // Return servo to 0 degrees
}

void indicateMode() {
  int blinks = regMode ? 3 : 2; // 3 blinks for Reg Mode, 2 blinks for Read Mode
  String mode = regMode ? "Registration Mode. Please Authenticate First" : "Authentication Mode";
  Serial.println(mode);
  for (int i = 0; i < blinks; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(300);
    digitalWrite(LED_PIN, LOW);
    delay(300);
  }
}

// MQTT callback to handle incoming messages
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  if (strcmp(topic, "RFID_HIEU") == 0) {
    String message = "";
    for (unsigned int i = 0; i < length; i++) {
      message += (char)payload[i];
    }
    Serial.print("Check message received: ");
    Serial.println(message);

    if (message == "true") {
      checkResult = true;
    } else if (message == "Card ID Existed") {
      cardExisted = true;
    } else if (message == "Successful!") {
      cardExisted = false;
    } else{
      checkResult = false;
    }
    receivedCheck = true; // Signal that a Check message was received
  }
}

// Function to connect to the MQTT broker
void connectToMQTT() {
  Serial.print("Connecting to MQTT...");
  while (!client.connected()) {
    if (client.connect("Hieu")) {
      Serial.println(" Connected!");
      client.subscribe("RFID_HIEU"); // Subscribe to the Check topic
    } else {
      Serial.print(" Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 5 seconds...");
      delay(5000);
    }
  }
}
