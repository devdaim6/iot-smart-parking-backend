const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const AppError = require('./utils/appError');
const connectDB = require('./config/database');
const slotRoutes = require('./routes/slot.routes');
const Slot = require('./models/slot.model');
const User = require('./models/user.model');
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
});

// WebSocket logic
const parkingSlots = {
  slot1: false,
  slot2: false,
  slot3: false,
  slot4: false
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('parkingStatus', parkingSlots);

  socket.on('sensorData', async (data) => {
    try {
      const { sensorId, occupied } = data;
      const slot = await Slot.findOne({ sensorId });
      if (!slot) {
        console.warn(`No slot found for sensor ${sensorId}`);
        return;
      }

      const previousStatus = slot.status;
      if (occupied) {
        if (!slot.bookedBy) {
          socket.emit('parkingError', {
            message: 'This slot is not booked. Please book a slot before parking your car.'
          });
          return;
        }

        if (slot.bookedBy && slot.vehicleNumber) {
          slot.status = 'parked';
          slot.isParked = true;
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

      if (previousStatus !== slot.status) {
        io.emit('parkingStatus', parkingSlots);
      }
    } catch (error) {
      console.error('Error handling sensor data:', error);
    }
  });

  socket.on('servoControl', (command) => {
    console.log('Servo control command:', command);
    io.emit('deviceCommand', {
      type: 'servo',
      command: command
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
