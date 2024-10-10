const express = require('express')
const { getAllSensorLog, findOneSensorLog, createSensorLog, editSensorLog, deleteSensorLog } = require('../controllers/sensorLogController')
const { verifyToken } = require('../middlewares/verifyToken')

const router = express.Router()

router.get('/', verifyToken, getAllSensorLog)
router.get('/:id', verifyToken, findOneSensorLog)
router.post('/create', verifyToken, createSensorLog)
router.post('/update', verifyToken, editSensorLog)
router.delete('/delete/:id', verifyToken, deleteSensorLog)

module.exports = router;