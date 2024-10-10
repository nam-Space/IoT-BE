const express = require('express');
const { createCardReader, editCardReader, getAllCardReader, findOneCardReader, deleteCardreader } = require('../controllers/cardReaderController');
const { verifyToken } = require('../middlewares/verifyToken');

const router = express.Router()

router.get('/', verifyToken, getAllCardReader)
router.get('/:id', verifyToken, findOneCardReader)
router.post('/create', verifyToken, createCardReader)
router.post('/update', verifyToken, editCardReader)
router.delete('/delete/:id', verifyToken, deleteCardreader)

module.exports = router;