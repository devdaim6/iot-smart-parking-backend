const mqtt = require('mqtt');
const Slot = require('../models/slot.model');
const User = require('../models/user.model');
const { createLogger } = require('../utils/logger');

const logger = createLogger('mqtt-service');

class MQTTService {
  constructor() {
    this.client = null;
    this.topics = {
      sensorData: 'parking/sensors/+/status', // + is wildcard for sensorId
      systemCommands: 'parking/system/commands',
      notifications: 'parking/notifications'
    };
  }

  async connect() {
    try {
      logger.info('Attempting to connect to MQTT broker...');
      logger.info(`MQTT Broker Host: ${process.env.MQTT_BROKER_HOST}`);
      logger.info(`MQTT Username: ${process.env.MQTT_USERNAME}`);

      this.client = mqtt.connect(`mqtts://${process.env.MQTT_BROKER_HOST}`, {
        clientId: `parking_server_${Math.random().toString(16).slice(2, 8)}`,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        rejectUnauthorized: false,
        connectTimeout: 30 * 1000,
      });

      this.client.on('connect', () => {
        logger.info('Connected to MQTT broker');
        this.subscribe();
      });

      this.client.on('error', (error) => {
        logger.error('MQTT connection error:', error);
      });

      this.setupMessageHandlers();
    } catch (error) {
      logger.error('MQTT connection failed:', error);
    }
  }

  subscribe() {
    Object.values(this.topics).forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          logger.info(`Subscribed to ${topic}`);
        }
      });
    });
  }

  setupMessageHandlers() {
    this.client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        if (topic.startsWith('parking/sensors/')) {
          await this.handleSensorData(topic, payload);
        }
      } catch (error) {
        logger.error('Error processing MQTT message:', error);
      }
    });
  }

  async handleSensorData(topic, payload) {
    try {
      const sensorId = topic.split('/')[2];
      const slot = await Slot.findOne({ sensorId });
      
      if (!slot) {
        logger.warn(`No slot found for sensor ${sensorId}`);
        return;
      }

      const previousStatus = slot.status;
      const isOccupied = payload.occupied;

      // Update slot status based on sensor data and current booking state
      if (isOccupied) {
        if (slot.bookedBy && slot.vehicleNumber) {
          slot.status = 'parked';
          slot.isParked = true;

          // Update user's parking status
          const user = await User.findById(slot.bookedBy);
          if (user) {
            user.currentlyParked = true;
            user.currentParkingSlot = slot._id;
            await user.save();
          }
        } else {
          slot.status = 'occupied';
        }
      } else {
        slot.status = 'available';
        slot.isParked = false;

        // Update user's parking status if slot was previously booked
        if (slot.bookedBy) {
          const user = await User.findById(slot.bookedBy);
          if (user) {
            user.currentlyParked = false;
            user.currentParkingSlot = null;
            await user.save();
          }
          slot.bookedBy = null;
          slot.vehicleNumber = null;
        }
      }

      slot.lastUpdated = new Date();
      await slot.save();

      // Notify about status change
      if (previousStatus !== slot.status) {
        this.publishNotification({
          type: 'status_change',
          slotNumber: slot.slotNumber,
          previousStatus,
          currentStatus: slot.status,
          timestamp: new Date()
        });
      }

    } catch (error) {
      logger.error('Error handling sensor data:', error);
    }
  }

  publishNotification(notification) {
    if (this.client && this.client.connected) {
      this.client.publish(
        this.topics.notifications,
        JSON.stringify(notification),
        { qos: 1 }
      );
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = MQTTService;