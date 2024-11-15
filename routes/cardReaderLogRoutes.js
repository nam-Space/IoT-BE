const express = require('express')
const { getAllCardReaderLog, findOneCardReaderLog, createCardReaderLog } = require('../controllers/cardReaderLogController')
const { verifyToken } = require('../middlewares/verifyToken')


const router = express.Router()

router.get('/', verifyToken, getAllCardReaderLog)
router.get('/:id', verifyToken, findOneCardReaderLog)
router.post('/create', verifyToken, createCardReaderLog)

module.exports = router;