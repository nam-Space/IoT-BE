const express = require('express')
const { getAllDevice, findOneDevice, createDevice, editDevice, deleteDevice } = require('../controllers/deviceController')
const { verifyToken } = require('../middlewares/verifyToken')

const router = express.Router()

router.get('/', verifyToken, getAllDevice)
router.get('/:id', verifyToken, findOneDevice)
router.post('/create', verifyToken, createDevice)
router.post('/update', verifyToken, editDevice)
router.delete('/delete/:id', verifyToken, deleteDevice)

module.exports = router;