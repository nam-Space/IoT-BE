const mongoose = require("mongoose");

const cardReaderLogSchema = new mongoose.Schema({
    cardId: { type: String }, // ID thẻ từ
    status: { type: String }, // trạng thái của thiết bị đọc thẻ
    doorState: { type: String },
    timeLog: { type: Date },
});

const CardReaderLog = mongoose.model('CardReaderLog', cardReaderLogSchema)
module.exports = CardReaderLog
