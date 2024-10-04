const User = require("../models/userModel");
const bcrypt = require('bcryptjs');
const generateTokenAndSetCookie = require("../utils/generateTokenAndSetCookie");

const createUser = async (req, res) => {
    try {
        const { name, gender, address, username, password, cardId, accessLevel } = req.body
        const user = await User.findOne({ username })

        if (user) {
            return res.status(400).json({ error: 'User already exists' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            name, gender, address,
            username,
            password: hashedPassword,
            cardId,
            accessLevel
        })
        await newUser.save()

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res)
            res.status(201).json({
                _id: newUser._id,
                name, gender, address,
                username: newUser.username,
                cardId: newUser.cardId,
                accessLevel: newUser.accessLevel,
            })
        }
        else {
            res.status(400).json({ error: 'Invalid user data' })
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(400).json({ error: 'Invalid username' })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: 'Invalid password' })
        }
        generateTokenAndSetCookie(user._id, res)

        res.status(200).json({
            _id: user._id,
            name: user.name,
            gender: user.gender,
            address: user.address,
            username: user.username,
            cardId: user.cardId,
            accessLevel: user.accessLevel,
        })

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const logoutUser = async (req, res) => {
    try {
        res.clearCookie('jwt')
        res.status(200).json({ message: "User logged out successfully" })
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    createUser,
    loginUser,
    logoutUser,
}