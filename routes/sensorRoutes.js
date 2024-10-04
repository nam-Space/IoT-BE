const express = require('express')
const { getAllSensor, findOneSensor, createSensor, editSensor } = require('../controllers/sensorController')

const router = express.Router()

router.get('/', getAllSensor)
router.get('/:id', findOneSensor)
router.post('/create', createSensor)
router.post('/edit/:id', editSensor)

module.exports = router;