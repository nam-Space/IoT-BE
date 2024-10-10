const express = require('express')
const { getAllSensor, findOneSensor, createSensor, editSensor, deleteSensor } = require('../controllers/sensorController')
const { verifyToken } = require('../middlewares/verifyToken')

const router = express.Router()

router.get('/', verifyToken, getAllSensor)
router.get('/:id', verifyToken, findOneSensor)
router.post('/create', verifyToken, createSensor)
router.post('/update', verifyToken, editSensor)
router.delete('/delete/:id', verifyToken, deleteSensor)

module.exports = router;