const Device = require("../models/deviceModel");

const getAllDevice = async (req, res) => {
    try {
        const devices = await Device.find({})
        res.status(200).json(devices)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const findOneDevice = async (req, res) => {
    try {
        const { id } = req.params
        const device = await Device.findOne({ _id: id })
        res.status(200).json(device)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const createDevice = async (req, res) => {
    try {
        const { type, location, status, temperatureThreshold, brightnessLevel, speed } = req.body

        const newDevice = new Device({
            type, location, status, temperatureThreshold, brightnessLevel, speed
        })

        await newDevice.save()

        res.status(200).json(newDevice)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const editDevice = async (req, res) => {
    try {
        const { _id } = req.params
        const { type, location, status, temperatureThreshold, brightnessLevel, speed } = req.body

        const device = await Device.findOne({ _id })
        if (!device) {
            return res.status(400).json({ error: 'Device not found!' })
        }

        device.type = type
        device.location = location
        device.status = status
        device.temperatureThreshold = temperatureThreshold
        device.brightnessLevel = brightnessLevel
        device.speed = speed

        await device.save()
        res.status(200).json(device)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    getAllDevice,
    findOneDevice,
    createDevice,
    editDevice,
}