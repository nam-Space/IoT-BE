const express = require('express')
const { getAllAccessLog, findOneAccessLog, createAccessLog, editAccessLog, deleteAccessLog } = require('../controllers/accessLogController')
const { verifyToken } = require('../middlewares/verifyToken')

const router = express.Router()

router.get('/', verifyToken, getAllAccessLog)
router.get('/:id', verifyToken, findOneAccessLog)
router.post('/create', verifyToken, createAccessLog)
router.post('/update', verifyToken, editAccessLog)
router.delete('/delete/:id', verifyToken, deleteAccessLog)

module.exports = router;