const express = require('express')
const { getAllDevice, findOneDevice, createDevice, editDevice } = require('../controllers/deviceController')

const router = express.Router()

router.get('/', getAllDevice)
router.get('/:id', findOneDevice)
router.post('/create', createDevice)
router.post('/edit/:id', editDevice)

module.exports = router;