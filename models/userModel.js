const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cardId: { type: String, unique: true }, // Thẻ từ để mở khóa
    accessLevel: { type: String }, // Mức độ truy cập (user/admin)
});

const User = mongoose.model('User', userSchema)
module.exports = User