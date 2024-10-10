const mqtt = require('mqtt');
const { DEVICE, STATUS } = require('../constants/device');
const { ROOM } = require('../constants/room');
const client = mqtt.connect(`mqtt://localhost:${process.env.PORT_BROKER}`);

const handlePublish = (device, roomName) => {
    if (roomName.toUpperCase() === ROOM.LIVING_ROOM) {
        if (device.type === DEVICE.FAN) {
            if (device.status === STATUS.ON) {
                client.publish(ROOM.LIVING_ROOM, `fan-control ON performance-${device.performance}`);
            }
            else if (device.status === STATUS.OFF) {
                client.publish(ROOM.LIVING_ROOM, `fan-control OFF`);
            }
            else {
                client.publish(ROOM.LIVING_ROOM, `fan-control AUTO`);
            }
        }
    }

}

module.exports = {
    handlePublish
}