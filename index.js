const express = require("express");
const app = express();
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

const mqtt = require('mqtt');
const { createSensorLog } = require("./controllers/sensorLogController");
const { editSensor } = require("./controllers/sensorController");
const client = mqtt.connect(`mqtt://localhost:${process.env.PORT_BROKER}`);

const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);

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

app.get("/", (request, response) => {
    response.send({ message: "Hello from IoT app API!" });
});

server.listen(portBroker, function () {
    console.log(`MQTT broker is running on portBroker ${portBroker}`);
});

aedes.on('client', (client) => {
    console.log(`Client connected: ${client.id}`);
});

aedes.on('clientDisconnect', (client) => {
    console.log(`Client disconnected: ${client.id}`);
});

aedes.on('publish', async (packet, client) => {
    console.log(`Message received on topic ${packet.topic}: ${packet.payload}`);
    try {
        if (packet.topic === 'SENSOR') {
            const message = packet.payload.toString();
            const { temperature, humidity, sensor } = JSON.parse(message);

            const reqSensorLog = {
                body: {
                    temperature,
                    humidity,
                    sensorId: sensor
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
    } catch (error) {
        console.error('Error processing MQTT message:', error);
    }
});

client.on('connect', () => {
    console.log('Connected to broker');
});

app.listen(8080, () => {
    console.log(`server listening on http://localhost:${8080}`);
});