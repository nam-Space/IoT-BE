const { DEVICE, STATUS } = require("../constants/device");
const Device = require("../models/deviceModel");
const mqtt = require('mqtt');
const { handlePublish } = require("../utils/arduinoControl");
const AccessLog = require("../models/accessLogModel");
const client = mqtt.connect(`mqtt://localhost:${process.env.PORT_BROKER}`);

const getAllDevice = async (req, res) => {
    try {
        const devices = await Device.find({}).populate({
            path: 'room',
        })
        Array.from(devices).forEach((device) => {
            handlePublish(device, device.room.roomName)
        })
        res.status(200).json(devices.reverse())
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
        const userId = req.userId;
        const { name, type, location, status, performance, roomId } = req.body

        const newDevice = new Device({
            name, type, location, status, performance, room: roomId
        })

        await newDevice.save()

        const accessLog = new AccessLog({
            performance,
            status,
            user: userId,
            device: newDevice._id,
            timeLog: new Date()
        })

        await accessLog.save()

        res.status(200).json(newDevice)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const editDevice = async (req, res) => {
    try {
        const userId = req.userId;
        const { _id, name, type, location, status, performance, roomId } = req.body

        const device = await Device.findOne({ _id });
        if (!device) {
            return res.status(400).json({ error: 'Device not found!' })
        }

        device.name = name || device.name
        device.type = type || device.type
        device.location = location || device.location
        device.status = status || device.status
        device.performance = performance >= 0 ? performance : device.performance
        device.room = roomId || device.room

        await device.save()

        const accessLog = new AccessLog({
            performance,
            status,
            user: userId,
            device: _id,
            timeLog: new Date()
        })

        await accessLog.save()

        const updatedDevice = await Device.findOne({ _id: device._id }).populate({
            path: 'room'
        });

        handlePublish(updatedDevice, updatedDevice.room.roomName)

        res.status(200).json(updatedDevice)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params
        const device = await Device.findOne({ _id: id })
        if (!device) {
            return res.status(400).json({ error: 'Device not found!' })
        }
        const response = await Device.deleteOne({ _id: id })
        res.status(200).json(response)

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
    deleteDevice
}