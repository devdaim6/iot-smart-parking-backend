const Slot = require('../models/slot.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/user.model');

exports.getAllSlots = catchAsync(async (req, res) => {
  const slots = await Slot.find().populate('bookedBy', 'username mobile vehicleNumber');
  res.status(200).json({
    status: 'success',
    data: { slots }
  });
});

exports.getAvailableSlots = catchAsync(async (req, res) => {
  const slots = await Slot.find({
    status: 'available',
    bookingStart: null,
    bookingEnd: null,
    isParked: false
  });
  
  res.status(200).json({
    status: 'success',
    data: { slots }
  });
});

exports.bookSlot = catchAsync(async (req, res, next) => {
  const { slotNumber, bookingStart, bookingEnd } = req.body;

  // Check if user is active
  if (!req.user.isActive) {
    return next(new AppError('Your account is not active', 403));
  }

  // Check if user already has a booked slot
  const existingBooking = await Slot.findOne({ bookedBy: req.user._id });
  if (existingBooking) {
    return next(new AppError('You already have a booked slot', 400));
  }

  const slot = await Slot.findOne({ slotNumber });
  
  if (!slot) {
    return next(new AppError('Slot not found', 404));
  }

  if (slot.status !== 'available') {
    return next(new AppError('Slot is not available', 400));
  }

  slot.status = 'occupied';
  slot.bookingStart = bookingStart;
  slot.bookingEnd = bookingEnd;
  slot.bookedBy = req.user._id;
  slot.vehicleNumber = req.user.vehicleNumber;
  slot.lastUpdated = new Date();
  
  await slot.save();

  // Update user's last booking details
  await User.findByIdAndUpdate(req.user._id, {
    lastBookedFrom: bookingStart,
    lastBookedTo: bookingEnd
  });

  res.status(200).json({
    status: 'success',
    data: { slot }
  });
});

exports.releaseSlot = catchAsync(async (req, res, next) => {
  const { slotNumber } = req.body;

  const slot = await Slot.findOne({ slotNumber });

  if (!slot) {
    return next(new AppError('Slot not found', 404));
  }

  if (slot.status !== 'occupied' && slot.status !== 'parked') {
    return next(new AppError('Slot is not currently occupied or parked', 400));
  }

  // Check if the user is authorized to release this slot
  if (slot.bookedBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to release this slot', 403));
  }

  slot.status = 'available';
  slot.bookingStart = null;
  slot.bookingEnd = null;
  slot.bookedBy = null;
  slot.vehicleNumber = null;
  slot.isParked = false;
  slot.lastUpdated = new Date();

  await slot.save();

  // Clear user's last booking details
  await User.findByIdAndUpdate(req.user._id, {
    lastBookedFrom: null,
    lastBookedTo: null
  });

  res.status(200).json({
    status: 'success',
    data: { slot }
  });
});