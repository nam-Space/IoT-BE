const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // Loại thiết bị
    location: { type: String }, // Vị trí lắp đặt thiết bị
    status: { type: String, default: 'OFF' }, // Trạng thái thiết bị
    performance: { type: Number }, // hiệu suất (VD: tốc độ...)
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }, // Reference to Room
});

const Device = mongoose.model('Device', deviceSchema)
module.exports = Device