const express = require("express");
const { app, server, io } = require("./socket/socket");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dbConnect = require("./db/dbConnect");
const userRoutes = require("./routes/userRoutes");
const cardReaderRoutes = require("./routes/cardReaderRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const roomRoutes = require("./routes/roomRoutes");
const accessLogRoutes = require("./routes/accessLogRoutes");
const sensorLogRoutes = require("./routes/sensorLogRoutes");
const cardReaderLogRoutes = require("./routes/cardReaderLogRoutes");
const hbs = require("nodemailer-handlebars");
const path = require("path");

const mqtt = require("mqtt");
const { createSensorLog } = require("./controllers/sensorLogController");
const { editSensor } = require("./controllers/sensorController");
const { ROOM } = require("./constants/room");
const { DEVICE, STATUS } = require("./constants/device");
const {
  createCardReaderLog,
} = require("./controllers/cardReaderLogController");
const { createAccessLog } = require("./controllers/accessLogController");
const { sendEmail } = require("./controllers/sendEmailController");
const options = {
  host: "64ca3a96ec76450c8cb527a5dcaccd7f.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts", // ⚠️ mqtts = TLS
  username: "hoango12",
  password: "HoaNgo1610",
};
const client = mqtt.connect(options);

const aedes = require("aedes")({
  keepAliveTimeout: 1, // Thời gian chờ sau khi client không gửi tín hiệu
  heartbeatInterval: 10000, // Kiểm tra heartbeat mỗi 10 giây
});
const serverBroker = require("net").createServer(aedes.handle);

const portBroker = Number(process.env.PORT_BROKER);

require("dotenv").config();
dbConnect();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/cardReaders", cardReaderRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/accessLogs", accessLogRoutes);
app.use("/api/sensorLogs", sensorLogRoutes);
app.use("/api/cardReaderLogs", cardReaderLogRoutes);

app.get("/", (request, response) => {
  response.send({ message: "Hello from IoT app API!" });
});

// API to change mode (AUTO or MANUAL)
let lastCO2AlertTime = null;
serverBroker.listen(portBroker, function () {
  console.log(`MQTT broker is running on portBroker ${portBroker}`);
});
app.post("/device/mode/:mode/:roomname", (req, res) => {
  const { mode, roomname } = req.params;
  console.log("hi");
  const value = mode.toUpperCase();
  console.log("Invalid mode:", value);

  if (value !== "AUTO" && value !== "MANUAL") {
    return res.status(400).json({ error: "Invalid mode" });
  }
  if (roomname === "Kitchen Room") {
    client.publish("KITCHEN_ROOM", `MODE=${value}`);
    return res.json({ message: `Mode changed to ${value}` });
  }
  client.publish("LIVING_ROOM", `MODE=${value}`);
  return res.json({ message: `Mode changed to ${value}` });
});
app.post("/device/:type/:state/:roomname", (req, res) => {
  const { type, state, roomname } = req.params;
  const validTypes = ["fan", "buzzer", "servo"];
  const validStates = ["on", "off"];

  if (!validTypes.includes(type) || !validStates.includes(state)) {
    return res.status(400).json({ error: "Invalid device type or state" });
  }

  const message = `${type.toUpperCase()}=${state.toUpperCase()}`;
  if (roomname === "Kitchen Room") {
    client.publish("KITCHEN_ROOM", message);
    return res.json({ message: `Sent ${message} to ESP32` });
  }
  client.publish("LIVING_ROOM", message);

  return res.json({ message: `Sent ${message} to ESP32` });
});

client.on("connect", () => {
  console.log("✅ Connected to MQTT Broker!");

  // Subscribe các topic
  client.subscribe("SENSOR/CO2", (err) => {
    if (!err) {
      console.log("📡 Subscribed to topic: SENSOR/CO2");
    } else {
      console.error("❌ Subscribe error:", err);
    }
  });

  client.subscribe("DEVICE/STATUS", (err) => {
    if (!err) {
      console.log("📡 Subscribed to topic: DEVICE/STATUS");
    } else {
      console.error("❌ Subscribe error:", err);
    }
  });
});

client.on("message", async (topic, message) => {
  console.log(`📥 Received message on topic '${topic}': ${message.toString()}`);

  try {
    const payload = JSON.parse(message.toString());
    console.log("🔍 Parsed Payload:", payload);

    if (topic === "SENSOR/CO2") {
      // Xử lý dữ liệu CO2

      let { CO2, SensorID, IsCO2Exceed } = payload;
      if (CO2 === "nan" || !CO2) CO2 = null;

      console.log("🌿 Parsed CO2 Data:");
      console.log(`CO2: ${CO2} ppm`);

      console.log(`IsCO2Exceed: ${IsCO2Exceed}`);

      if (IsCO2Exceed === "true") {
        const now = Date.now();

        // Nếu chưa từng gửi hoặc đã quá 30 phút thì gửi mail
        if (!lastCO2AlertTime || now - lastCO2AlertTime >= 30 * 60 * 1000) {
          lastCO2AlertTime = now;

          await sendEmail(
            {
              body: { IsCO2Exceed, CO2 },
            },
            {
              status: (code) => ({
                json: (data) => console.log(`📧 Email Status ${code}:`, data),
              }),
              json: (data) => console.log("📧 Email Sent:", data),
            }
          );
        } else {
          const minutesLeft = Math.ceil(
            (30 * 60 * 1000 - (now - lastCO2AlertTime)) / 60000
          );
          console.log(
            `⏳ Email already sent. Wait ${minutesLeft} more minute(s).`
          );
        }
      }

      if (!CO2) CO2 = 350;
      // Lưu vào database sensor log
      if (SensorID && CO2 !== null) {
        await createSensorLog(
          {
            body: { sensorId: SensorID, CO2 },
          },
          {
            status: (code) => ({
              json: (data) =>
                console.log(`📄 Sensor Log Status ${code}:`, data),
            }),
            json: (data) => console.log("📄 Sensor Log:", data),
          }
        );

        await editSensor(
          {
            body: { _id: SensorID, CO2 },
          },
          {
            status: (code) => ({
              json: (data) => console.log(`📄 Sensor Status ${code}:`, data),
            }),
            json: (data) => console.log("📄 Sensor:", data),
          }
        );
      }
    }

    if (topic === "DEVICE/STATUS") {
      // Xử lý dữ liệu trạng thái thiết bị
      let { Mode, Fan, FanID, Buzzer, BuzzerID, Servo, ServoID } = payload;

      console.log("🔧 Parsed Device Data:");
      console.log(
        `Mode: ${Mode}, Fan: ${Fan}, Buzzer: ${Buzzer}, Servo: ${Servo}`
      );

      io.emit("device-status", {
        statusFan: Fan,
        idFan: FanID,
        idBuzzer: BuzzerID,
        idServo: ServoID,
        statusBuzzer: Buzzer,
        statusServo: Servo,
      });

      // Lưu vào database access log cho từng thiết bị
      await createAccessLogForDevice(FanID, Fan, Mode, "Fan");
      await createAccessLogForDevice(BuzzerID, Buzzer, Mode, "Buzzer");
      await createAccessLogForDevice(ServoID, Servo, Mode, "Servo");
    }
  } catch (err) {
    console.error("❌ Error processing message:", err.message);
  }
});

// Tạo hàm chung để lưu log cho từng thiết bị
const createAccessLogForDevice = async (deviceId, status, mode, label) => {
  if (!deviceId || status === undefined) {
    console.warn(`⚠️ Missing ${label} data - Skipping...`);
    return;
  }

  const reqAccessLog = {
    body: {
      performance: "20",
      status,
      deviceId,
      mode,
    },
  };

  const resAccessLog = {
    status: (code) => ({
      json: (data) =>
        console.log(`📄 ${label} Access Log Status ${code}:`, data),
    }),
    json: (data) => console.log(`📄 ${label} Access Log:`, data),
  };

  await createAccessLog(reqAccessLog, resAccessLog);
};

server.listen(8080, () => {
  console.log(`server listening on http://localhost:${8080}`);
});
