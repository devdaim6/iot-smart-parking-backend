const express = require('express');
const { createServer } = require('http');
const WebSocket = require('ws');
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
const server = createServer(app);
const wss = new WebSocket.Server({ server }); // For sensors
const io = new Server(server, {  // For client
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }
}); 

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
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
let parkingSlots = {};

// Initialize parking slots from database
async function initializeParkingSlots() {
  try {
    const slots = await Slot.find({});
    slots.forEach(slot => {
      parkingSlots[slot.sensorId] = {
        occupied: slot.isParked,
        lastUpdated: slot.lastUpdated,
        status: slot.status,
        bookedBy: slot.bookedBy,
        vehicleNumber: slot.vehicleNumber
      };
    });
  } catch (error) {
    console.error('Error initializing parking slots:', error);
  }
}

// Call initialization on startup
initializeParkingSlots();

// Socket.IO connection handling for clients
io.on('connection', (socket) => {
  console.log('Client connected via Socket.IO');
  
  // Send initial state to client
  socket.emit('INITIAL_STATE', { slots: parkingSlots });
});

// WebSocket connection handling for sensors
wss.on('connection', (ws) => {
  console.log('Sensor connected via WebSocket');

  ws.on('message', async (message) => {
    try {
      // Ensure message is a string before parsing
      const messageStr = message.toString();
      const data = JSON.parse(messageStr);
      console.log('Received sensor data:', data);

      // Forward raw sensor data to frontend
      io.emit('SENSOR_DATA', data);

      // Handle Arduino sensor data
      const { slotId, isOccupied } = data;
      const slot = await Slot.findOne({ sensorId: slotId });
      
      if (!slot) {
        console.warn(`No slot found for sensor ${slotId}`);
        return;
      }

      const previousStatus = slot.status;
      if (isOccupied) {
        if (!slot.bookedBy) {
          const errorMsg = {
            type: 'PARKING_ERROR',
            message: 'This slot is not booked. Please book a slot before parking your car.'
          };
          ws.send(JSON.stringify(errorMsg));
          io.emit('PARKING_ERROR', errorMsg);
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

      // Update local parking slots state
      parkingSlots[slotId] = {
        occupied: isOccupied,
        lastUpdated: new Date(),
        status: slot.status,
        bookedBy: slot.bookedBy,
        vehicleNumber: slot.vehicleNumber
      };

      if (previousStatus !== slot.status) {
        broadcastStatus();
      }

    } catch (error) {
      console.error('Message handling error:', error);
      io.emit('ERROR', { message: 'Message handling error', error: error.message });
    }
  });
});

function broadcastStatus() {
  const status = {
    type: 'PARKING_UPDATE',
    slots: parkingSlots,
    availableSlots: Object.values(parkingSlots)
      .filter(slot => slot.status === 'available').length
  };

  // Broadcast to WebSocket clients (sensors)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(status));
    }
  });

  // Broadcast to Socket.IO clients
  io.emit('PARKING_UPDATE', status);
}

function broadcastToArduino(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
