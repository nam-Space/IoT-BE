const Sensor = require("../models/sensorModel");

const getAllSensor = async (req, res) => {
    try {
        const sensors = await Sensor.find({}).populate({
            path: 'room',
        }
        ).populate({
            path: 'device',
        })
        res.status(200).json(sensors.reverse())
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const findOneSensor = async (req, res) => {
    try {
        const { id } = req.params
        const sensor = await Sensor.findOne({ _id: id })
        res.status(200).json(sensor)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const createSensor = async (req, res) => {
    try {
        const { name, type, value, location, tempature, humidity, roomId, deviceId, status } = req.body

        const newSensor = new Sensor({
            name,
            type,
            value,
            location,
            tempature,
            humidity,
            room: roomId,
            device: deviceId,
            status
        })

        await newSensor.save()

        res.status(200).json(newSensor)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const editSensor = async (req, res) => {
    try {
        const { _id, name, type, value, location, temperature, humidity, roomId, deviceId, status } = req.body

        const sensor = await Sensor.findOne({ _id })
        if (!sensor) {
            return res.status(400).json({ error: 'Sensor not found!' })
        }

        sensor.name = name || sensor.name
        sensor.type = type || sensor.type
        sensor.value = value || sensor.value
        sensor.location = location || sensor.location
        sensor.temperature = temperature || sensor.temperature
        sensor.humidity = humidity || sensor.humidity
        sensor.room = roomId || sensor.room
        sensor.device = deviceId || sensor.device
        sensor.status = status || sensor.status

        await sensor.save()
        res.status(200).json(sensor)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const deleteSensor = async (req, res) => {
    try {
        const { _id } = req.params
        const sensor = await Sensor.findOne({ _id })
        if (!sensor) {
            return res.status(400).json({ error: 'Sensor not found!' })
        }
        const response = await Sensor.deleteOne({ _id })
        res.status(200).json(response)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    getAllSensor,
    findOneSensor,
    createSensor,
    editSensor,
    deleteSensor
}