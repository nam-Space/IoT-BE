const Sensor = require("../models/sensorModel");

const getAllSensor = async (req, res) => {
    try {
        const sensors = await Sensor.find({})
        res.status(200).json(sensors)
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
        const { type, value, location } = req.body

        const lastUpdated = new Date()

        const newSensor = new Sensor({
            type,
            value,
            location,
            lastUpdated
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
        const { _id } = req.params
        const { type, value, location } = req.body
        const lastUpdated = new Date()

        const sensor = await Sensor.findOne({ _id })
        if (!sensor) {
            return res.status(400).json({ error: 'Sensor not found!' })
        }

        sensor.type = type
        sensor.value = value
        sensor.location = location
        sensor.lastUpdated = lastUpdated

        await sensor.save()
        res.status(200).json(sensor)

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
}