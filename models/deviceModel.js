const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Loại thiết bị
    location: { type: String }, // Vị trí lắp đặt thiết bị
    status: { type: String, default: 'off' }, // Trạng thái thiết bị
    temperatureThreshold: { type: Number }, // Ngưỡng nhiệt độ để bật/tắt thiết bị (chỉ cho fan, light)
    brightnessLevel: { type: String }, // Màu đèn
    speed: { type: Number, default: 0 }, // Tốc độ quạt (chỉ cho fan)
});

const Device = mongoose.model('Device', deviceSchema)
module.exports = Device