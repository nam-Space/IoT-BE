const express = require("express");
const { app, server, io } = require('./socket/socket');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dbConnect = require("./db/dbConnect");
const userRoutes = require('./routes/userRoutes')
const cardReaderRoutes = require('./routes/cardReaderRoutes')
const sensorRoutes = require('./routes/sensorRoutes')
const deviceRoutes = require('./routes/deviceRoutes')
const roomRoutes = require('./routes/roomRoutes')
const accessLogRoutes = require('./routes/accessLogRoutes')
const sensorLogRoutes = require('./routes/sensorLogRoutes')
const cardReaderLogRoutes = require('./routes/cardReaderLogRoutes')

const mqtt = require('mqtt');
const { createSensorLog } = require("./controllers/sensorLogController");
const { editSensor } = require("./controllers/sensorController");
const { ROOM } = require("./constants/room");
const { DEVICE } = require("./constants/device");
const { createCardReaderLog } = require("./controllers/cardReaderLogController");
const client = mqtt.connect(`mqtt://localhost:${process.env.PORT_BROKER}`);

const aedes = require('aedes')({
    keepAliveTimeout: 1, // Thời gian chờ sau khi client không gửi tín hiệu
    heartbeatInterval: 10000 // Kiểm tra heartbeat mỗi 10 giây
});
const serverBroker = require('net').createServer(aedes.handle);

const portBroker = Number(process.env.PORT_BROKER);

require("dotenv").config();
dbConnect();

app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());

app.use(
    cors({
        origin: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
    }),
);

app.use(express.json());

app.use('/api/users', userRoutes)
app.use('/api/cardReaders', cardReaderRoutes)
app.use('/api/sensors', sensorRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/accessLogs', accessLogRoutes)
app.use('/api/sensorLogs', sensorLogRoutes)
app.use('/api/cardReaderLogs', cardReaderLogRoutes)

app.get("/", (request, response) => {
    response.send({ message: "Hello from IoT app API!" });
});

serverBroker.listen(portBroker, function () {
    console.log(`MQTT broker is running on portBroker ${portBroker}`);
});

aedes.on('client', (client) => {
    console.log(`Client connected: ${client.id}`);
    if (client.id === 'ESP8266Client') {
        io.emit("esp-status", {
            connected: true, room: {
                [ROOM.LIVING_ROOM]: {
                    devices: [DEVICE.FAN, DEVICE.LED]
                },
                [ROOM.KITCHEN_ROOM]: {
                    devices: [DEVICE.VENTILATION_FAN, DEVICE.SMOKE_ALARM, DEVICE.WINDOW]
                }
            }
        });
    }
    else if (client.id === 'Hieu') {
        io.emit("esp-status", {
            connected: true, room: {
                [ROOM.FRONT_YARD]: {
                    devices: [DEVICE.RFID]
                },
            }
        });
    }
    else if (client.id === 'Nam2') {
        io.emit("esp-status", {
            connected: true, room: {
                [ROOM.KITCHEN_ROOM]: {
                    devices: [DEVICE.FAN]
                },
                [ROOM.BED_ROOM]: {
                    devices: [DEVICE.FAN]
                },
            }
        });
    }
    else if (client.id === 'TRI') {
        io.emit("esp-status", {
            connected: true, room: {
                [ROOM.LIVING_ROOM]: {
                    devices: [DEVICE.LED]
                },
                [ROOM.KITCHEN_ROOM]: {
                    devices: [DEVICE.LED]
                },
                [ROOM.BED_ROOM]: {
                    devices: [DEVICE.LED]
                },
                [ROOM.BALCONY]: {
                    devices: [DEVICE.RAIN_COVER]
                },

            }
        });
    }
});

aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client.id}`);
    if (client.id === 'ESP8266Client') {
        io.emit("esp-status", {
            connected: false, room: {
                [ROOM.LIVING_ROOM]: {
                    devices: [DEVICE.FAN, DEVICE.LED]
                },
                [ROOM.KITCHEN_ROOM]: {
                    devices: [DEVICE.VENTILATION_FAN, DEVICE.SMOKE_ALARM, DEVICE.WINDOW]
                }
            }
        });
    }
    else if (client.id === 'Hieu') {
        io.emit("esp-status", {
            connected: false, room: {
                [ROOM.FRONT_YARD]: {
                    devices: [DEVICE.RFID]
                },
            }
        });
    }
    else if (client.id === 'Nam2') {
        io.emit("esp-status", {
            connected: false, room: {
                [ROOM.KITCHEN_ROOM]: {
                    devices: [DEVICE.FAN]
                },
                [ROOM.BED_ROOM]: {
                    devices: [DEVICE.FAN]
                },
            }
        });
    }
    else if (client.id === 'TRI') {
        io.emit("esp-status", {
            connected: false, room: {
                [ROOM.LIVING_ROOM]: {
                    devices: [DEVICE.LED]
                },
                [ROOM.KITCHEN_ROOM]: {
                    devices: [DEVICE.LED]
                },
                [ROOM.BED_ROOM]: {
                    devices: [DEVICE.LED]
                },
                [ROOM.BALCONY]: {
                    devices: [DEVICE.RAIN_COVER]
                },

            }
        });
    }
});

aedes.on('publish', async (packet, clientESP) => {
    console.log(`Message received on topic ${packet.topic}: ${packet.payload}`);
    try {
        if (packet.topic === ROOM.FRONT_YARD) {
            let message = packet.payload.toString();
            console.log(message)
            message = message.trim();
            message = message.replace(/\s+/g, ' ');

            let arrStr = message.split(' ')
            if (arrStr[0] === DEVICE.RFID) {
                io.emit("loginToUser", {
                    cardId: arrStr[1]
                })
            }
        }
        else if (packet.topic === 'SENSOR') {
            const message = packet.payload.toString();
            const { temperature, humidity, sensor, status } = JSON.parse(message);

            const reqSensorLog = {
                body: {
                    temperature,
                    humidity,
                    sensorId: sensor,
                    status
                }
            };

            const resSensorLog = {
                status: (statusCode) => ({
                    json: (response) => console.log(`Response sensor log: ${statusCode}`, response)
                }),
                json: (response) => console.log(`Response sensor log: `, response)
            };

            await createSensorLog(reqSensorLog, resSensorLog)

            const reqSensor = {
                body: {
                    _id: sensor,
                    temperature,
                    humidity,
                    status
                }
            };

            const resSensor = {
                status: (statusCode) => ({
                    json: (response) => console.log(`Response sensor: ${statusCode}`, response)
                }),
                json: (response) => console.log(`Response sensor: `, response)
            };

            await editSensor(reqSensor, resSensor)
        }
        else if (packet.topic === "rfid/uid") {
            const message = packet.payload.toString();
            const { cardId, status } = JSON.parse(message);
            const reqCardReaderLog = {
                body: {
                    cardId,
                    status
                }
            };

            const resCardReaderLog = {
                status: (statusCode) => ({
                    json: (response) => {
                        console.log(`Response cardReader log: ${statusCode}`, response)
                        if (statusCode >= 200 && statusCode < 300) {
                            client.publish('RFID_HIEU', response.doorState ? (response.doorState === "OPEN" ? "true" : 'false') : 'Successful!')
                        }
                        else {
                            client.publish('RFID_HIEU', response.error)
                        }
                    }
                }),
                json: (response) => console.log(`Response cardReader log: `, response)
            };

            await createCardReaderLog(reqCardReaderLog, resCardReaderLog)
        }
    } catch (error) {
        console.error('Error processing MQTT message:', error);
    }
});

client.on('connect', () => {
    console.log('Connected to broker');
});

server.listen(8080, () => {
    console.log(`server listening on http://localhost:${8080}`);
});