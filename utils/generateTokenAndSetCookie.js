const jwt = require('jsonwebtoken')
const ms = require("ms");

const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRE
    })

    res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: ms(process.env.JWT_ACCESS_EXPIRE),
        sameSite: 'strict'
    })

    return token
}

module.exports = generateTokenAndSetCookie