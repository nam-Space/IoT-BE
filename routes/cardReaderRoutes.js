const express = require('express');
const { createCardReader, editCardReader, getAllCardReader, findOneCardReader } = require('../controllers/cardReaderController');

const router = express.Router()

router.get('/', getAllCardReader)
router.get('/:id', findOneCardReader)
router.post('/create', createCardReader)
router.post('/edit', editCardReader)

module.exports = router;