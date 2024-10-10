const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomName: { type: String },
    description: { type: String },
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
