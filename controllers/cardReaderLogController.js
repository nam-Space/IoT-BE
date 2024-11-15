const { STATUS } = require("../constants/device");
const { ROOM } = require("../constants/room");
const CardReaderLog = require("../models/cardReaderLogModel");
const CardReader = require("../models/cardReaderModel");


const getAllCardReaderLog = async (req, res) => {
    try {
        let cardReaderLogs = await CardReaderLog.find({})

        res.status(200).json(cardReaderLogs.reverse())
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const findOneCardReaderLog = async (req, res) => {
    try {
        const { id } = req.params
        const cardReaderLog = await CardReaderLog.findOne({ _id: id })
        res.status(200).json(cardReaderLog)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const createCardReaderLog = async (req, res) => {
    try {
        const { cardId, status } = req.body

        if (status === 'REGISTER') {
            const cardReader = await CardReader.create({
                cardId,
                location: ROOM.FRONT_YARD,
                status: STATUS.ON
            })

            await cardReader.save()

            const cardReaderLog = new CardReaderLog({
                cardId,
                status,
                timeLog: new Date(),
            })

            await cardReaderLog.save()
            res.status(200).json(cardReaderLog)
        }
        else {
            const cardReader = await CardReader.findOne({ cardId, status: STATUS.ON })

            const cardReaderLog = new CardReaderLog({
                cardId,
                status,
                doorState: cardReader ? 'OPEN' : 'CLOSE',
                timeLog: new Date(),
            })

            await cardReaderLog.save()
            res.status(200).json(cardReaderLog)
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    getAllCardReaderLog,
    findOneCardReaderLog,
    createCardReaderLog,
}