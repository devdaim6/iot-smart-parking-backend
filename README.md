# IoT Smart Parking System

## Overview
The IoT Smart Parking System is a modern solution that combines IoT sensors, real-time monitoring, and user management to create an efficient parking management system. The system uses WebSocket technology for real-time communication between sensors and clients, providing instant updates on parking slot availability and status changes. The system is hosted on Microsoft Azure Virtual Machine for reliable cloud infrastructure.

![IoT Parking System](iot-parking.png)

## Features
- **Real-time Monitoring**: Live updates of parking slot status using WebSocket
- **User Authentication**: Secure JWT-based authentication system
- **Slot Management**: Advanced booking and management of parking slots
- **IoT Integration**: Direct communication with IoT sensors
- **Automated Status Updates**: Real-time updates of slot occupancy
- **Vehicle Tracking**: Track vehicles and their parking status
- **Logging System**: Comprehensive system logging for monitoring and debugging
- **Cloud Hosting**: Deployed on Microsoft Azure VM for scalability and reliability

## Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: WebSocket (ws) & Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Winston Logger
- **Security**: CORS, Environment Variables
- **Cloud Platform**: Microsoft Azure Virtual Machine

## System Architecture
The system consists of three main components:
1. **IoT Sensors**: Connected via WebSocket for real-time status updates
2. **Backend Server**: Handles business logic and data management, hosted on Azure VM
3. **Client Applications**: Receive real-time updates via Socket.IO

## Installation

### Prerequisites
- Node.js (v16.20.1 or higher)
- MongoDB
- npm or yarn package manager
- Microsoft Azure account (for deployment)

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/devdaim6/iot-smart-parking-backend.git
   cd iot-smart-parking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following configurations:
   ```env
   # MongoDB
   MONGO_URI=your_mongodb_connection_string

   # JWT
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=90d

   # Server
   PORT=5000

   # Client
   CLIENT_URL=http://localhost:3000
   ```

4. Start the server:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run prod
   ```

## API Documentation

### Authentication Endpoints
```http
POST /api/auth/register
POST /api/auth/login
```

### Parking Slot Endpoints
```http
GET /api/slots
GET /api/slots/available
POST /api/slots/book
POST /api/slots/release
```

### WebSocket Events
```javascript
// Sensor Events
'sensorData' - Receives sensor status updates
'PARKING_UPDATE' - Broadcasts parking status changes
'INITIAL_STATE' - Sends initial parking state to clients

// Error Events
'PARKING_ERROR' - Broadcasts parking-related errors
'ERROR' - General error broadcasts
```

## Database Schema

### User Model
- Username
- Password (hashed)
- Mobile number
- Vehicle number
- Role (user/admin)
- Parking status
- Booking history

### Slot Model
- Slot number
- Status (available/occupied/parked)
- Sensor ID
- Booking information
- Vehicle information
- Timestamp data

## Security Features
- JWT Authentication
- Password Hashing
- CORS Protection
- Environment Variable Security
- Error Handling Middleware
- Input Validation

## Logging
The system uses Winston logger for comprehensive logging:
- Error logs: `error.log`
- Combined logs: `combined.log`

## Error Handling
The system implements a centralized error handling mechanism with:
- Custom error classes
- HTTP status codes
- Operational vs Programming errors
- Error logging

## Development
To contribute to the project:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Production Deployment
1. Set up environment variables
2. Configure MongoDB connection
3. Set up SSL/TLS certificates
4. Configure CORS settings
5. Enable production logging
6. Deploy using PM2 or similar process manager

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support, email [daimdev6+iot+support@gmail.com](mailto:daimdev6+iot+support@gmail.com)

## Contributors
- [Daim Zahoor](https://github.com/devdaim6)

