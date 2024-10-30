const SensorLog = require("../models/sensorLogModel");

const getAllSensorLog = async (req, res) => {
    try {
        const { type } = req.query
        let sensorLogs = await SensorLog.find({}).populate({
            path: 'sensor',
            populate: [
                { path: 'room', model: 'Room' },
                { path: 'device', model: 'Device' }
            ]
        })

        if (type) sensorLogs = sensorLogs.filter(log => log.sensor && log.sensor.type === type);

        res.status(200).json(sensorLogs.reverse())
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const findOneSensorLog = async (req, res) => {
    try {
        const { id } = req.params
        const sensorLog = await SensorLog.findOne({ _id: id })
        res.status(200).json(sensorLog)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const createSensorLog = async (req, res) => {
    try {
        const { temperature, humidity, sensorId } = req.body

        const sensorLog = new SensorLog({
            temperature,
            humidity,
            sensor: sensorId,
            timeLog: new Date()
        })

        await sensorLog.save()

        res.status(200).json(sensorLog)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const editSensorLog = async (req, res) => {
    try {
        const { _id, temperature, humidity, sensorId } = req.body

        const sensorLog = await SensorLog.findOne({ _id: id })
        if (!sensorLog) {
            return res.status(400).json({ error: 'SensorLog not found!' })
        }

        sensorLog.temperature = temperature
        sensorLog.humidity = humidity
        sensorLog.sensor = sensorId
        sensorLog.timeLog = new Date()

        await sensorLog.save()
        res.status(200).json(sensorLog)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const deleteSensorLog = async (req, res) => {
    try {
        const { _id } = req.params
        const sensorLog = await SensorLog.findOne({ _id })
        if (!sensorLog) {
            return res.status(400).json({ error: 'SensorLog not found!' })
        }
        const response = await SensorLog.deleteOne({ _id })
        res.status(200).json(response)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    getAllSensorLog,
    findOneSensorLog,
    createSensorLog,
    editSensorLog,
    deleteSensorLog
}