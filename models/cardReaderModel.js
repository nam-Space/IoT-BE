const mongoose = require("mongoose");

const cardReaderSchema = new mongoose.Schema({
    cardId: { type: String, required: true }, // ID thẻ từ
    location: { type: String }, // Vị trí của thiết bị đọc thẻ
    status: { type: String }, // Trạng thái truy cập
});

const CardReader = mongoose.model('CardReader', cardReaderSchema)
module.exports = CardReader
