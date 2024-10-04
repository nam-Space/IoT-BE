const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Loại cảm biến
    value: { type: Number }, // Giá trị cảm biến (ví dụ: nhiệt độ hiện tại)
    location: { type: String }, // Vị trí lắp đặt cảm biến
    lastUpdated: { type: Date, default: Date.now }, // Thời gian cập nhật cuối cùng
});

const Sensor = mongoose.model('Sensor', sensorSchema)
module.exports = Sensor