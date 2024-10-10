const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    performance: { type: Number },
    status: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }, // Reference to Device
    timeLog: { type: Date }
});

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = AccessLog;
