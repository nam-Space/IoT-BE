const CardReader = require("../models/cardReaderModel");

const getAllCardReader = async (req, res) => {
    try {
        const cardReaders = await CardReader.find({})
        res.status(200).json(cardReaders)
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

        const lastAccessed = new Date()

        const newCardReader = new CardReader({
            cardId,
            location,
            status,
            lastAccessed
        })

        await newCardReader.save()

        res.status(200).json({
            cardId,
            location,
            status,
            lastAccessed
        })

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const editCardReader = async (req, res) => {
    try {
        const { cardId, location, status } = req.body
        const lastAccessed = new Date()

        const cardReader = await CardReader.findOne({ cardId })
        if (!cardReader) {
            return res.status(400).json({ error: 'Card reader not found!' })
        }

        cardReader.cardId = cardId
        cardReader.location = location
        cardReader.status = status
        cardReader.lastAccessed = lastAccessed

        await cardReader.save()
        res.status(200).json(cardReader)

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
}