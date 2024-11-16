# IoT Backend Project

## Overview

This project is an IoT backend service designed to manage and process data from IoT devices. It includes features for handling MQTT communication, logging, and managing device slots. The backend is built using Node.js and TypeScript, ensuring a robust and scalable architecture.

## Table of Contents

- [Installation](#installation)

- [Configuration](#configuration)

- [Usage](#usage)

- [API Documentation](#api-documentation)

- [Features](#features)

- [Contributing](#contributing)

- [License](#license)

- [Contact](#contact)

## Installation

To get started with the project, follow these steps:

1. **Clone the repository:**

   ```bash

   git clone https://github.com/yourusername/iot-backend.git

   cd iot-backend

   ```

2. **Install dependencies:**

   Ensure you have Node.js installed, then run:

   ```bash

   npm install

   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory and configure the necessary environment variables. Refer to the `.env.example` file for guidance.

## Configuration

- **MQTT Service:** Configure the MQTT broker settings in `services/mqtt.service.js`.

- **Logging:** Adjust logging settings in `utils/logger.js`.

- **Database:** Ensure your database is set up and configured in `models/slot.model.js`.

## Usage

To start the server, run:

```bash

npm start

```

The server will start on the port specified in your `.env` file.

## API Documentation

### Slot Management

- **GET /api/slots**: Retrieve all slots (requires authentication).

- **GET /api/slots/available**: Get available slots (requires authentication).

- **POST /api/slots/book**: Book a slot (requires authentication).

### Auth Management

- **POST /api/auth/register**: Register a new user.

- **POST /api/auth/login**: Login with existing user credentials.

### MQTT Communication

- **Endpoint**: Details on how to connect and communicate with the MQTT broker.

### Logging

- **Logs**: Access logs are stored in `combined.log` and error logs in `error.log`.

## Features

- **MQTT Communication:** Efficient handling of MQTT messages for IoT devices.

- **Logging:** Comprehensive logging using `combined.log` and `error.log`.

- **Slot Management:** Manage device slots with CRUD operations.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.

2. Create a new branch (`git checkout -b feature/YourFeature`).

3. Commit your changes (`git commit -m 'Add some feature'`).

4. Push to the branch (`git push origin feature/YourFeature`).

5. Open a pull request.


## Contact

For questions or support, please contact [Daim Zahoor](mailto:daimdev6@gmail.com).
