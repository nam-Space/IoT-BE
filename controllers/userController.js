const User = require("../models/userModel");
const bcrypt = require('bcryptjs');
const generateTokenAndSetCookie = require("../utils/generateTokenAndSetCookie");
const CardReader = require("../models/cardReaderModel");

const createUser = async (req, res) => {
    try {
        const { name, gender, address, username, password, cardId, role } = req.body
        const user = await User.findOne({ username })

        if (user) {
            return res.status(400).json({ error: 'User already exists' })
        }

        const card = await CardReader.findOne({ cardId })
        if (!card) {
            return res.status(400).json({ error: 'CardID not found' })
        }

        const userExistCardId = await User.findOne({ cardReader: card._id })
        if (userExistCardId) {
            return res.status(400).json({ error: 'User already have cardId!' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            name, gender, address,
            username,
            password: hashedPassword,
            cardReader: card._id,
            role
        })
        await newUser.save()

        if (newUser) {
            const token = generateTokenAndSetCookie(newUser._id, res)
            res.status(201).json({
                _id: newUser._id,
                name, gender, address,
                username: newUser.username,
                cardReader: card._id,
                role: newUser.role,
                token
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
        const token = generateTokenAndSetCookie(user._id, res)

        res.status(200).json({
            _id: user._id,
            name: user.name,
            gender: user.gender,
            address: user.address,
            username: user.username,
            cardReader: user.cardReader,
            role: user.role,
            token
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

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate('cardReader')
        res.status(200).json(users.reverse())
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const updateUser = async (req, res) => {
    try {
        const { _id,
            name,
            password,
            gender,
            address,
            cardId,
            role } = req.body

        let user = await User.findOne({ _id })
        if (!user) {
            return res.status(400).json({ error: 'User not found!' })
        }

        const card = await CardReader.findOne({ cardId })
        if (!card) {
            return res.status(400).json({ error: 'CardID not found' })
        }

        const userExistCardId = await User.findOne({ cardReader: card._id })
        if (userExistCardId) {
            return res.status(400).json({ error: 'User already have cardId!' })
        }

        if (password) {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            user.password = hashedPassword
        }

        user.name = name || user.name
        user.gender = gender || user.gender
        user.address = address || user.address
        user.cardReader = card._id
        user.role = role || user.role

        user = await user.save()

        user.password = null
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params

        let user = await User.findOne({ _id: id })
        if (!user) {
            return res.status(400).json({ error: 'User not found!' })
        }
        const response = await User.deleteOne({ _id: id })
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
}

module.exports = {
    createUser,
    loginUser,
    logoutUser,
    getAllUsers,
    updateUser,
    deleteUser
}