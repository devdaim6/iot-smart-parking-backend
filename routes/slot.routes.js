const express = require('express');
const slotController = require('../controllers/slot.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/', protect, slotController.getAllSlots);
router.get('/available', protect, slotController.getAvailableSlots);
router.post('/book', protect, slotController.bookSlot);
router.post('/release', protect, slotController.releaseSlot);

module.exports = router;
