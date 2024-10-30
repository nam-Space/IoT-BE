const AccessLog = require("../models/accessLogModel");


const getAllAccessLog = async (req, res) => {
    try {
        const { type } = req.query
        let accessLogs = await AccessLog.find({}).populate({
            path: 'user'
        }).populate({
            path: 'device',
            populate: [
                { path: 'room', model: 'Room' },
            ]
        })

        if (type) accessLogs = accessLogs.filter(log => log.device && log.device.type === type);

        res.status(200).json(accessLogs.reverse())
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const findOneAccessLog = async (req, res) => {
    try {
        const { id } = req.params
        const accessLog = await AccessLog.findOne({ _id: id })
        res.status(200).json(accessLog)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const createAccessLog = async (req, res) => {
    try {
        const { performance, status, userId, deviceId } = req.body

        const accessLog = new AccessLog({
            performance,
            status,
            user: userId,
            device: deviceId,
            timeLog: new Date()
        })

        await accessLog.save()

        res.status(200).json(accessLog)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const editAccessLog = async (req, res) => {
    try {
        const { _id, performance, status, userId, deviceId } = req.body

        const accessLog = await AccessLog.findOne({ _id: id })
        if (!accessLog) {
            return res.status(400).json({ error: 'AccessLog not found!' })
        }

        accessLog.performance = performance
        accessLog.status = status
        accessLog.user = userId
        accessLog.device = deviceId
        accessLog.timeLog = new Date()

        await accessLog.save()
        res.status(200).json(accessLog)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const deleteAccessLog = async (req, res) => {
    try {
        const { _id } = req.params
        const accessLog = await AccessLog.findOne({ _id })
        if (!accessLog) {
            return res.status(400).json({ error: 'AccessLog not found!' })
        }
        const response = await AccessLog.deleteOne({ _id })
        res.status(200).json(response)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    getAllAccessLog,
    findOneAccessLog,
    createAccessLog,
    editAccessLog,
    deleteAccessLog
}