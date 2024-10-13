const CardReader = require("../models/cardReaderModel");

const getAllCardReader = async (req, res) => {
    try {
        const cardReaders = await CardReader.aggregate([
            {
                $lookup: {
                    from: 'users', // Bảng Device
                    localField: '_id', // Trường liên kết (room._id)
                    foreignField: 'cardReader', // Trường liên kết bên Device (device.room)
                    as: 'users' // Đặt kết quả vào mảng devices
                }
            }
        ]
        )
        res.status(200).json(cardReaders.reverse())
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const findOneCardReader = async (req, res) => {
    try {
        const { id } = req.params
        const cardReader = await CardReader.findOne({ _id: id })
        res.status(200).json(cardReader)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const createCardReader = async (req, res) => {
    try {
        const { cardId, location, status } = req.body

        const newCardReader = new CardReader({
            cardId,
            location,
            status,
        })

        await newCardReader.save()

        res.status(200).json(newCardReader)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const editCardReader = async (req, res) => {
    try {
        const { _id, cardId, location, status } = req.body

        const cardReader = await CardReader.findOne({ _id })
        if (!cardReader) {
            return res.status(400).json({ error: 'Card reader not found!' })
        }

        cardReader.cardId = cardId || cardReader.cardId
        cardReader.location = location || cardReader.location
        cardReader.status = status || cardReader.status

        await cardReader.save()
        res.status(200).json(cardReader)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const deleteCardreader = async (req, res) => {
    try {
        const { id } = req.params
        const cardReader = await CardReader.findOne({ _id: id })
        if (!cardReader) {
            return res.status(400).json({ error: 'CardReader not found!' })
        }
        const response = await CardReader.deleteOne({ _id: id })
        res.status(200).json(response)

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    getAllCardReader,
    findOneCardReader,
    createCardReader,
    editCardReader,
    deleteCardreader
}