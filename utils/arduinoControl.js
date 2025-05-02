const mqtt = require("mqtt");
const { DEVICE, STATUS } = require("../constants/device");
const { ROOM } = require("../constants/room");
const options = {
  host: "64ca3a96ec76450c8cb527a5dcaccd7f.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts", // ⚠️ mqtts = TLS
  username: "hoango12",
  password: "HoaNgo1610",
};
const client = mqtt.connect(options);

const handlePublish = (device, roomName) => {
  if (roomName.toUpperCase() === ROOM.LIVING_ROOM) {
    if (device.type === DEVICE.FAN) {
      if (device.status === STATUS.ON) {
        client.publish(
          ROOM.LIVING_ROOM,
          `fan-control ON performance-${device.performance}`
        );
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.LIVING_ROOM, `fan-control OFF`);
      } else {
        client.publish(ROOM.LIVING_ROOM, `fan-control AUTO`);
      }
    } else if (device.type === DEVICE.LED) {
      if (device.status === STATUS.ON) {
        client.publish(ROOM.LIVING_ROOM, `led-control ON`);
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.LIVING_ROOM, `led-control OFF`);
      } else {
        client.publish(ROOM.LIVING_ROOM, `led-control AUTO`);
      }
    }
  } else if (roomName.toUpperCase() === ROOM.KITCHEN_ROOM) {
    if (device.type === DEVICE.FAN) {
      if (device.status === STATUS.ON) {
        client.publish(
          ROOM.KITCHEN_ROOM,
          `fan-control ON performance-${device.performance}`
        );
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.KITCHEN_ROOM, `fan-control OFF`);
      } else {
        client.publish(ROOM.KITCHEN_ROOM, `fan-control AUTO`);
      }
    } else if (device.type === DEVICE.VENTILATION_FAN) {
      if (device.status === STATUS.ON) {
        client.publish(ROOM.KITCHEN_ROOM, `ventilation-fan-control ON`);
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.KITCHEN_ROOM, `ventilation-fan-control OFF`);
      } else {
        client.publish(ROOM.KITCHEN_ROOM, `ventilation-fan-control AUTO`);
      }
    } else if (device.type === DEVICE.SMOKE_ALARM) {
      if (device.status === STATUS.ON) {
        client.publish(ROOM.KITCHEN_ROOM, `smoke-alarm-control ON`);
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.KITCHEN_ROOM, `smoke-alarm-control OFF`);
      } else {
        client.publish(ROOM.KITCHEN_ROOM, `smoke-alarm-control AUTO`);
      }
    } else if (device.type === DEVICE.WINDOW) {
      if (device.status === STATUS.ON) {
        client.publish(ROOM.KITCHEN_ROOM, `window-smoke-control ON`);
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.KITCHEN_ROOM, `window-smoke-control OFF`);
      } else {
        client.publish(ROOM.KITCHEN_ROOM, `window-smoke-control AUTO`);
      }
    } else if (device.type === DEVICE.LED) {
      if (device.status === STATUS.ON) {
        client.publish(ROOM.KITCHEN_ROOM, `led-control ON`);
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.KITCHEN_ROOM, `led-control OFF`);
      } else {
        client.publish(ROOM.KITCHEN_ROOM, `led-control AUTO`);
      }
    }
  } else if (roomName.toUpperCase() === ROOM.BED_ROOM) {
    if (device.type === DEVICE.FAN) {
      if (device.status === STATUS.ON) {
        client.publish(
          ROOM.BED_ROOM,
          `fan-control ON performance-${device.performance}`
        );
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.BED_ROOM, `fan-control OFF`);
      } else {
        client.publish(ROOM.BED_ROOM, `fan-control AUTO`);
      }
    } else if (device.type === DEVICE.LED) {
      if (device.status === STATUS.ON) {
        client.publish(ROOM.BED_ROOM, `led-control ON`);
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.BED_ROOM, `led-control OFF`);
      } else {
        client.publish(ROOM.BED_ROOM, `led-control AUTO`);
      }
    }
  } else if (roomName.toUpperCase() === ROOM.BALCONY) {
    if (device.type === DEVICE.RAIN_COVER) {
      if (device.status === STATUS.ON) {
        client.publish(ROOM.BALCONY, `rain-cover-control ON`);
      } else if (device.status === STATUS.OFF) {
        client.publish(ROOM.BALCONY, `rain-cover-control OFF`);
      } else {
        client.publish(ROOM.BALCONY, `rain-cover-control AUTO`);
      }
    }
  }
};

module.exports = {
  handlePublish,
};
