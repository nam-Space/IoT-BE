const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // Loại cảm biến
    temperature: { type: Number }, // Giá trị nhiệt độ
    humidity: { type: Number }, // giá trị độ ẩm
    location: { type: String }, // Vị trí lắp đặt cảm biến
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // Reference to Room
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }, // Reference to Device
    status: { type: String }
});

const Sensor = mongoose.model('Sensor', sensorSchema)
module.exports = Sensor