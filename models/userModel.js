const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // Mức độ truy cập (user/admin)
    cardReader: { type: mongoose.Schema.Types.ObjectId, ref: 'CardReader' }
});

const User = mongoose.model('User', userSchema)
module.exports = User