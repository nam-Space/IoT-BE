const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dbConnect = require("./db/dbConnect");
const userRoutes = require('./routes/userRoutes')
const cardReaderRoutes = require('./routes/cardReaderRoutes')
const sensorRoutes = require('./routes/sensorRoutes')
const deviceRoutes = require('./routes/deviceRoutes')

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

app.get("/", (request, response) => {
    response.send({ message: "Hello from IoT app API!" });
});

app.listen(8080, () => {
    console.log(`server listening on http://localhost:${8080}`);
});