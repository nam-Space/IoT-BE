const { default: mongoose } = require("mongoose");
const Room = require("../models/roomModel");
const { handlePublish } = require("../utils/arduinoControl");

const getAllRoom = async (req, res) => {
    try {
        const rooms = await Room.aggregate([
            {
                $lookup: {
                    from: 'devices', // Bảng Device
                    localField: '_id', // Trường liên kết (room._id)
                    foreignField: 'room', // Trường liên kết bên Device (device.room)
                    as: 'devices' // Đặt kết quả vào mảng devices
                }
            }
        ])
        Array.from(rooms).forEach(room => {
            Array.from(room.devices).forEach(device => {
                handlePublish(device, room.roomName)
            })
        })
        res.status(200).json(rooms.reverse())
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const findOneRoom = async (req, res) => {
    try {
        const { id } = req.params
        const room = await Room.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } }, // Tìm Room theo _id
            {
                $lookup: {
                    from: 'devices', // Bảng Device
                    localField: '_id', // Trường liên kết (room._id)
                    foreignField: 'room', // Trường liên kết bên Device (device.room)
                    as: 'devices' // Đặt kết quả vào mảng devices
                }
            }
        ])
        res.status(200).json(room)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const createRoom = async (req, res) => {
    try {
        const { roomName, description } = req.body

        const newRoom = new Room({
            roomName, description
        })

        await newRoom.save()

        res.status(200).json(newRoom)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const editRoom = async (req, res) => {
    try {
        const { _id, roomName, description } = req.body

        const room = await Room.findOne({ _id })
        if (!room) {
            return res.status(400).json({ error: 'Room not found!' })
        }

        room.roomName = roomName
        room.description = description
        await room.save()
        res.status(200).json(room)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params
        const room = await Room.findOne({ _id: id })
        if (!room) {
            return res.status(400).json({ error: 'Room not found!' })
        }
        const response = await Room.deleteOne({ _id: id })
        res.status(200).json(response)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    getAllRoom,
    findOneRoom,
    createRoom,
    editRoom,
    deleteRoom
}