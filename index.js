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
// aedes.on("client", (client) => {
//   console.log(`Client connected: ${client.id}`);
//   if (client.id === "HoaNgo") {
//     io.emit("esp-status", {
//       connected: true,
//       room: {
//         [ROOM.LIVING_ROOM]: {
//           devices: [DEVICE.VENTILATION_FAN],
//         },
//       },
//     });
//   } else if (client.id === "ESP8266Client") {
//     io.emit("esp-status", {
//       connected: true,
//       room: {
//         [ROOM.LIVING_ROOM]: {
//           devices: [DEVICE.FAN, DEVICE.LED],
//         },
//         [ROOM.KITCHEN_ROOM]: {
//           devices: [DEVICE.VENTILATION_FAN, DEVICE.SMOKE_ALARM, DEVICE.WINDOW],
//         },
//       },
//     });
//   } else if (client.id === "Hieu") {
//     io.emit("esp-status", {
//       connected: true,
//       room: {
//         [ROOM.FRONT_YARD]: {
//           devices: [DEVICE.RFID],
//         },
//       },
//     });
//   } else if (client.id === "Nam2") {
//     io.emit("esp-status", {
//       connected: true,
//       room: {
//         [ROOM.KITCHEN_ROOM]: {
//           devices: [DEVICE.FAN],
//         },
//         [ROOM.BED_ROOM]: {
//           devices: [DEVICE.FAN],
//         },
//       },
//     });
//   } else if (client.id === "TRI") {
//     io.emit("esp-status", {
//       connected: true,
//       room: {
//         [ROOM.LIVING_ROOM]: {
//           devices: [DEVICE.LED],
//         },
//         [ROOM.KITCHEN_ROOM]: {
//           devices: [DEVICE.LED],
//         },
//         [ROOM.BED_ROOM]: {
//           devices: [DEVICE.LED],
//         },
//         [ROOM.BALCONY]: {
//           devices: [DEVICE.RAIN_COVER],
//         },
//       },
//     });
//   }
// });

// aedes.on("clientDisconnect", (client) => {
//   console.log(`Client disconnected: ${client.id}`);
//   if (client.id === "HoaNgo") {
//     io.emit("esp-status", {
//       connected: false,
//       room: {
//         [ROOM.LIVING_ROOM]: {
//           devices: [DEVICE.VENTILATION_FAN],
//         },
//       },
//     });
//   } else if (client.id === "ESP8266Client") {
//     io.emit("esp-status", {
//       connected: false,
//       room: {
//         [ROOM.LIVING_ROOM]: {
//           devices: [DEVICE.FAN, DEVICE.LED],
//         },
//         [ROOM.KITCHEN_ROOM]: {
//           devices: [DEVICE.VENTILATION_FAN, DEVICE.SMOKE_ALARM, DEVICE.WINDOW],
//         },
//       },
//     });
//   } else if (client.id === "Hieu") {
//     io.emit("esp-status", {
//       connected: false,
//       room: {
//         [ROOM.FRONT_YARD]: {
//           devices: [DEVICE.RFID],
//         },
//       },
//     });
//   } else if (client.id === "Nam2") {
//     io.emit("esp-status", {
//       connected: false,
//       room: {
//         [ROOM.KITCHEN_ROOM]: {
//           devices: [DEVICE.FAN],
//         },
//         [ROOM.BED_ROOM]: {
//           devices: [DEVICE.FAN],
//         },
//       },
//     });
//   } else if (client.id === "TRI") {
//     io.emit("esp-status", {
//       connected: false,
//       room: {
//         [ROOM.LIVING_ROOM]: {
//           devices: [DEVICE.LED],
//         },
//         [ROOM.KITCHEN_ROOM]: {
//           devices: [DEVICE.LED],
//         },
//         [ROOM.BED_ROOM]: {
//           devices: [DEVICE.LED],
//         },
//         [ROOM.BALCONY]: {
//           devices: [DEVICE.RAIN_COVER],
//         },
//       },
//     });
//   }
// });

// aedes.on("publish", async (packet, clientESP) => {
//   console.log(`Message received on topic ${packet.topic}: ${packet.payload}`);
//   try {
//     if (packet.topic === ROOM.FRONT_YARD) {
//       let message = packet.payload.toString();
//       console.log(message);
//       message = message.trim();
//       message = message.replace(/\s+/g, " ");

//       let arrStr = message.split(" ");
//       if (arrStr[0] === DEVICE.RFID) {
//         io.emit("loginToUser", {
//           cardId: arrStr[1],
//         });
//       }
//     } else if (packet.topic === "SENSOR") {
//       const message = packet.payload.toString();
//       console.log(message);
//       // const { temperature, humidity, sensor, status } = JSON.parse(message);

//       // const reqSensorLog = {
//       //   body: {
//       //     temperature,
//       //     humidity,
//       //     sensorId: sensor,
//       //     status,
//       //   },
//       // };

//       // const resSensorLog = {
//       //   status: (statusCode) => ({
//       //     json: (response) =>
//       //       console.log(`Response sensor log: ${statusCode}`, response),
//       //   }),
//       //   json: (response) => console.log(`Response sensor log: `, response),
//       // };

//       // await createSensorLog(reqSensorLog, resSensorLog);

//       // const reqSensor = {
//       //   body: {
//       //     _id: sensor,
//       //     temperature,
//       //     humidity,
//       //     status,
//       //   },
//       // };

//       // const resSensor = {
//       //   status: (statusCode) => ({
//       //     json: (response) =>
//       //       console.log(`Response sensor: ${statusCode}`, response),
//       //   }),
//       //   json: (response) => console.log(`Response sensor: `, response),
//       // };

//       // await editSensor(reqSensor, resSensor);
//     } else if (packet.topic === "rfid/uid") {
//       const message = packet.payload.toString();
//       const { cardId, status } = JSON.parse(message);
//       const reqCardReaderLog = {
//         body: {
//           cardId,
//           status,
//         },
//       };

//       const resCardReaderLog = {
//         status: (statusCode) => ({
//           json: (response) => {
//             console.log(`Response cardReader log: ${statusCode}`, response);
//             if (statusCode >= 200 && statusCode < 300) {
//               client.publish(
//                 "RFID_HIEU",
//                 response.doorState
//                   ? response.doorState === "OPEN"
//                     ? "true"
//                     : "false"
//                   : "Successful!"
//               );
//             } else {
//               client.publish("RFID_HIEU", response.error);
//             }
//           },
//         }),
//         json: (response) => console.log(`Response cardReader log: `, response),
//       };

//       await createCardReaderLog(reqCardReaderLog, resCardReaderLog);
//     }
//   } catch (error) {
//     console.error("Error processing MQTT message:", error);
//   }
// });

// client.on("connect", () => {
//   console.log("✅ Connected to MQTT Broker!");

//   // Subscribe topic "SENSOR" (cùng tên với ESP32 publish)
//   client.subscribe("SENSOR", (err) => {
//     if (!err) {
//       console.log("📡 Subscribed to topic: SENSOR");
//     } else {
//       console.error("❌ Subscribe error:", err);
//     }
//   });
// });

// // Lắng nghe dữ liệu từ topic "SENSOR"
// client.on("message", async (topic, message) => {
//   console.log(
//     `📥 Received message on topic '${topic}': ${JSON.stringify(
//       message.toString(),
//       null,
//       2
//     )}`
//   );

//   try {
//     console.log("test", JSON.parse(message.toString()));
//     let {
//       CO2,
//       CO,
//       SensorID,
//       Fan,
//       Buzzer,
//       Servo,
//       FanID,
//       BuzzerID,
//       ServoID,
//       Mode,
//     } = JSON.parse(message.toString());
//     console.log("Mode", Mode);
//     if (!CO2 || CO2 == "nan") CO2 = null;
//     if (!CO || CO == "nan") CO = null;
//     console.log("🌿 Parsed CO2 Data:");
//     console.log(`CO2: ${CO2} ppm`);
//     console.log(`CO: ${CO} ppm`);
//     const reqSensorLog = {
//       body: {
//         sensorId: SensorID,
//         CO2,
//         CO,
//       },
//     };

//     const resSensorLog = {
//       status: (statusCode) => ({
//         json: (response) =>
//           console.log(`Response sensor log: ${statusCode}`, response),
//       }),
//       json: (response) => console.log(`Response sensor log: `, response),
//     };

//     await createSensorLog(reqSensorLog, resSensorLog);

//     const reqSensor = {
//       body: {
//         _id: SensorID,
//         CO2,
//         CO,
//       },
//     };

//     const resSensor = {
//       status: (statusCode) => ({
//         json: (response) =>
//           console.log(`Response sensor: ${statusCode}`, response),
//       }),
//       json: (response) => console.log(`Response sensor: `, response),
//     };

//     await editSensor(reqSensor, resSensor);

//     const reqAccessLog = {
//       body: {
//         performance: "20",
//         status: Fan,
//         deviceId: FanID,
//         mode: Mode,
//       },
//     };
//     console.log("body", reqAccessLog.body);
//     const resAccessLog = {
//       status: (code) => ({
//         json: (data) => console.log(`📄 Status: ${code}`, data),
//       }),
//       json: (data) => console.log("📄 Response:", data),
//     };

//     // Gọi hàm tạo access log
//     await createAccessLog(reqAccessLog, resAccessLog);
//     const reqAccessLogBuzzer = {
//       body: {
//         performance: "20",
//         status: Buzzer,
//         deviceId: BuzzerID,
//         mode: Mode,
//       },
//     };
//     const resAccessLogBuzzer = {
//       status: (code) => ({
//         json: (data) => console.log(`📄 Status: ${code}`, data),
//       }),
//       json: (data) => console.log("📄 Response:", data),
//     };

//     // Gọi hàm tạo access log
//     await createAccessLog(reqAccessLogBuzzer, resAccessLogBuzzer);

//     const reqAccessLogServo = {
//       body: {
//         performance: "20",
//         status: Servo,
//         deviceId: ServoID,
//         mode: Mode,
//       },
//     };
//     const resAccessLogServo = {
//       status: (code) => ({
//         json: (data) => console.log(`📄 Status: ${code}`, data),
//       }),
//       json: (data) => console.log("📄 Response:", data),
//     };

//     // Gọi hàm tạo access log
//     await createAccessLog(reqAccessLogServo, resAccessLogServo);
//   } catch (err) {
//     console.error("❌ JSON Parse error:", err.message);
//   }
// });

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
        sendEmail(
          {
            body: { IsCO2Exceed, CO2 },
          },
          {
            status: (code) => ({
              json: (data) => console.log(`Status ${code}:`, data),
            }),
            json: (data) => console.log("Thông báo:", data),
          }
        );
        setTimeout(
          sendEmail(
            {
              body: { IsCO2Exceed, CO2 },
            },
            {
              status: (code) => ({
                json: (data) => console.log(`Status ${code}:`, data),
              }),
              json: (data) => console.log("Thông báo:", data),
            }
          ),
          15 * 60 * 1000
        );
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
