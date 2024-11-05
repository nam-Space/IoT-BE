const mongoose = require('mongoose');

const sensorLogSchema = new mongoose.Schema({
    temperature: { type: Number },
    humidity: { type: Number },
    sensor: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' }, // Reference to Sensor
    timeLog: { type: Date },
    status: { type: String }
});

const SensorLog = mongoose.model('SensorLog', sensorLogSchema);

module.exports = SensorLog;
