const express = require("express");
const cors = require("cors");
const path = require("path");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const helmet = require("helmet");

require("dotenv").config();

const {
  loadConfig,
  getConfig,
  getAllResources,
  getResource,
  getWorkingHours,
  getSlotDuration,
  getBusinessInfo,
  getAppInfo,
  getEmbedSettings,
  getDefaults,
  watchConfig,
  validateConfig,
} = require("./configLoader");

// Initialize Firebase (optional - can work without it)
let db = null;
try {
  db = require("./db");
  console.log("Firebase initialized");
} catch (e) {
  console.log("Firebase not configured - using in-memory storage");
}

// In-memory storage fallback
const inMemoryBookings = [];
const resourceStatus = {};

const app = express();
const port = process.env.PORT || 5000;

// Load and validate configuration
loadConfig();
validateConfig();
if (!process.env.VERCEL) {
  watchConfig();
}

// Security middleware
app.use(helmet()); // Add security headers

// Configure CORS - restrict to specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check against whitelist
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.static(path.join(__dirname, "build")));

// Rate limiting to prevent DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes only
app.use('/api/', limiter);

// Stricter rate limiting for booking creation
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 booking attempts per hour
  message: 'Too many booking attempts, please try again later.',
});

// Simple API key authentication middleware for admin routes
const authenticateAdmin = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    // If no admin key is configured, allow access (backward compatibility)
    console.warn('Warning: ADMIN_API_KEY not configured. Admin endpoints are unprotected!');
    return next();
  }

  if (apiKey !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }

  next();
};

// ============================================
// API ENDPOINTS
// ============================================

// Get app configuration (public)
app.get("/api/config", (req, res) => {
  const config = getConfig();
  res.json({
    app: getAppInfo(),
    business: getBusinessInfo(),
    embed: getEmbedSettings(),
    defaults: getDefaults(),
  });
});

// Get all resources
app.get("/api/resources", (req, res) => {
  const resources = getAllResources();
  res.json(resources);
});

// Get single resource
app.get("/api/resources/:id", (req, res) => {
  const resource = getResource(req.params.id);
  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }
  res.json(resource);
});

// Get resource status (on/off)
app.get("/api/resources/:id/status", (req, res) => {
  const resource = getResource(req.params.id);
  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  // Check if resource has real-time status
  if (!resource.showStatus) {
    return res.json({ status: "not_tracked" });
  }

  // Get current booking for the resource
  const now = moment();
  const status = resourceStatus[req.params.id] || "available";

  // Check if currently booked
  const currentBooking = inMemoryBookings.find((b) => {
    if (b.resourceId !== req.params.id || b.status === "cancelled") return false;
    const start = moment(b.startTime);
    const end = moment(b.endTime);
    return now.isBetween(start, end);
  });

  res.json({
    status: currentBooking ? "in_use" : status,
    currentBooking: currentBooking
      ? {
          id: currentBooking.id,
          userName: currentBooking.userName,
          endTime: currentBooking.endTime,
        }
      : null,
    lastUpdated: new Date().toISOString(),
  });
});

// Update resource status (for IoT integration) - Protected
app.put("/api/resources/:id/status", authenticateAdmin, (req, res) => {
  const resource = getResource(req.params.id);
  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const { status } = req.body;
  if (!["available", "in_use", "maintenance", "offline"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  resourceStatus[req.params.id] = status;
  res.json({ success: true, status });
});

// Get available slots for a resource on a specific date
app.get("/api/resources/:id/slots", (req, res) => {
  const resource = getResource(req.params.id);
  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  const { date, timezone = "UTC" } = req.query;
  if (!date) {
    return res.status(400).json({ error: "Date parameter required" });
  }

  const requestedDate = moment.tz(date, timezone);
  const dayName = requestedDate.format("dddd").toLowerCase();
  const workingHours = getWorkingHours(resource.id, dayName);

  if (!workingHours || !workingHours.enabled) {
    return res.json({ slots: [], message: "Resource not available on this day" });
  }

  const slotDuration = getSlotDuration(resource.id);
  const slots = [];

  // Parse working hours
  const [startHour, startMin] = workingHours.start.split(":").map(Number);
  const [endHour, endMin] = workingHours.end.split(":").map(Number);

  let currentSlot = requestedDate
    .clone()
    .hour(startHour)
    .minute(startMin)
    .second(0);
  const endTime = requestedDate.clone().hour(endHour).minute(endMin).second(0);

  // Get existing bookings for this resource and date
  const dayStart = requestedDate.clone().startOf("day");
  const dayEnd = requestedDate.clone().endOf("day");
  const existingBookings = inMemoryBookings.filter((b) => {
    if (b.resourceId !== resource.id || b.status === "cancelled") return false;
    const bookingStart = moment(b.startTime);
    return bookingStart.isBetween(dayStart, dayEnd, null, "[]");
  });

  // Generate slots
  while (currentSlot.clone().add(slotDuration, "minutes").isSameOrBefore(endTime)) {
    const slotEnd = currentSlot.clone().add(slotDuration, "minutes");

    // Check if slot overlaps with existing bookings
    const isBooked = existingBookings.some((b) => {
      const bookingStart = moment(b.startTime);
      const bookingEnd = moment(b.endTime);
      return (
        currentSlot.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart)
      );
    });

    // Check if slot is in the past
    const isPast = currentSlot.isBefore(moment());

    slots.push({
      start: currentSlot.toISOString(),
      end: slotEnd.toISOString(),
      startFormatted: currentSlot.format("HH:mm"),
      endFormatted: slotEnd.format("HH:mm"),
      available: !isBooked && !isPast,
      isPast,
      isBooked,
    });

    currentSlot.add(slotDuration, "minutes");
  }

  res.json({
    resource: resource.name,
    date: date,
    timezone,
    slotDuration,
    slots,
  });
});

// Create a booking
app.post("/api/bookings", bookingLimiter, (req, res) => {
  const {
    resourceId,
    startTime,
    endTime,
    userName,
    userEmail,
    userPhone,
    notes,
  } = req.body;

  // Validate required fields
  if (!resourceId || !startTime || !endTime || !userName) {
    return res.status(400).json({
      error: "Missing required fields: resourceId, startTime, endTime, userName",
    });
  }

  // Sanitize and validate inputs
  const sanitizedUserName = validator.escape(validator.trim(userName));
  if (sanitizedUserName.length < 2 || sanitizedUserName.length > 100) {
    return res.status(400).json({ error: "Name must be between 2 and 100 characters" });
  }

  // Validate email if provided
  let sanitizedEmail = '';
  if (userEmail && userEmail.trim()) {
    if (!validator.isEmail(userEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    sanitizedEmail = validator.normalizeEmail(userEmail);
  }

  // Validate phone if provided
  let sanitizedPhone = '';
  if (userPhone && userPhone.trim()) {
    sanitizedPhone = validator.trim(userPhone);
    // Basic phone validation (allows international formats)
    if (sanitizedPhone.length > 0 && (sanitizedPhone.length < 7 || sanitizedPhone.length > 20)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }
  }

  // Sanitize notes
  let sanitizedNotes = '';
  if (notes) {
    sanitizedNotes = validator.escape(validator.trim(notes));
    if (sanitizedNotes.length > 500) {
      return res.status(400).json({ error: "Notes must be less than 500 characters" });
    }
  }

  // Validate date/time format
  if (!moment(startTime).isValid() || !moment(endTime).isValid()) {
    return res.status(400).json({ error: "Invalid date/time format" });
  }

  const resource = getResource(resourceId);
  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  // Check for conflicts
  const newStart = moment(startTime);
  const newEnd = moment(endTime);

  const hasConflict = inMemoryBookings.some((b) => {
    if (b.resourceId !== resourceId || b.status === "cancelled") return false;
    const existingStart = moment(b.startTime);
    const existingEnd = moment(b.endTime);
    return newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);
  });

  if (hasConflict) {
    return res.status(409).json({ error: "Time slot already booked" });
  }

  // Check max bookings per day
  const bookingDate = newStart.clone().startOf("day");
  const userBookingsToday = inMemoryBookings.filter((b) => {
    if (b.resourceId !== resourceId || b.status === "cancelled") return false;
    if (b.userName !== sanitizedUserName) return false;
    const bDate = moment(b.startTime).startOf("day");
    return bDate.isSame(bookingDate);
  });

  if (
    resource.maxBookingsPerDay &&
    userBookingsToday.length >= resource.maxBookingsPerDay
  ) {
    return res.status(400).json({
      error: `Maximum ${resource.maxBookingsPerDay} bookings per day for this resource`,
    });
  }

  // Create booking with sanitized data
  const booking = {
    id: uuidv4(),
    resourceId,
    resourceName: resource.name,
    startTime: newStart.toISOString(),
    endTime: newEnd.toISOString(),
    userName: sanitizedUserName,
    userEmail: sanitizedEmail,
    userPhone: sanitizedPhone,
    notes: sanitizedNotes,
    status: resource.requiresConfirmation ? "pending" : "confirmed",
    createdAt: new Date().toISOString(),
  };

  inMemoryBookings.push(booking);

  // Also save to Firebase if available
  if (db) {
    db.collection("bookings")
      .doc(booking.id)
      .set(booking)
      .catch((err) => console.error("Firebase save error:", err));
  }

  res.status(201).json({
    success: true,
    booking,
    message: resource.requiresConfirmation
      ? "Booking request submitted for approval"
      : "Booking confirmed",
  });
});

// Get all bookings (with optional filters) - Protected (admin only)
app.get("/api/bookings", authenticateAdmin, (req, res) => {
  const { resourceId, startDate, endDate, status, userName } = req.query;

  let filtered = [...inMemoryBookings];

  if (resourceId) {
    filtered = filtered.filter((b) => b.resourceId === resourceId);
  }

  if (startDate) {
    const start = moment(startDate);
    filtered = filtered.filter((b) => moment(b.startTime).isSameOrAfter(start));
  }

  if (endDate) {
    const end = moment(endDate);
    filtered = filtered.filter((b) => moment(b.startTime).isSameOrBefore(end));
  }

  if (status) {
    filtered = filtered.filter((b) => b.status === status);
  }

  if (userName) {
    filtered = filtered.filter((b) =>
      b.userName.toLowerCase().includes(userName.toLowerCase())
    );
  }

  // Sort by start time
  filtered.sort((a, b) => moment(a.startTime).diff(moment(b.startTime)));

  res.json(filtered);
});

// Get single booking
app.get("/api/bookings/:id", (req, res) => {
  const booking = inMemoryBookings.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  res.json(booking);
});

// Cancel booking - Protected (admin only)
app.delete("/api/bookings/:id", authenticateAdmin, (req, res) => {
  const bookingIndex = inMemoryBookings.findIndex((b) => b.id === req.params.id);
  if (bookingIndex === -1) {
    return res.status(404).json({ error: "Booking not found" });
  }

  inMemoryBookings[bookingIndex].status = "cancelled";
  inMemoryBookings[bookingIndex].cancelledAt = new Date().toISOString();

  res.json({ success: true, message: "Booking cancelled" });
});

// Update booking status (for admin) - Protected
app.put("/api/bookings/:id/status", authenticateAdmin, (req, res) => {
  const { status } = req.body;
  if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const booking = inMemoryBookings.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  booking.status = status;
  booking.updatedAt = new Date().toISOString();

  res.json({ success: true, booking });
});

// Get dashboard stats
app.get("/api/stats", (req, res) => {
  const now = moment();
  const todayStart = now.clone().startOf("day");
  const todayEnd = now.clone().endOf("day");
  const weekStart = now.clone().startOf("week");
  const weekEnd = now.clone().endOf("week");

  const todayBookings = inMemoryBookings.filter((b) => {
    const start = moment(b.startTime);
    return start.isBetween(todayStart, todayEnd) && b.status !== "cancelled";
  });

  const weekBookings = inMemoryBookings.filter((b) => {
    const start = moment(b.startTime);
    return start.isBetween(weekStart, weekEnd) && b.status !== "cancelled";
  });

  const activeResources = getAllResources().length;

  res.json({
    todayBookings: todayBookings.length,
    weekBookings: weekBookings.length,
    totalBookings: inMemoryBookings.filter((b) => b.status !== "cancelled")
      .length,
    activeResources,
    pendingApprovals: inMemoryBookings.filter((b) => b.status === "pending")
      .length,
  });
});

// Embed endpoint - returns config optimized for iframe embedding
app.get("/api/embed/config", (req, res) => {
  const embedSettings = getEmbedSettings();
  const resources = getAllResources();
  const appInfo = getAppInfo();

  res.json({
    embed: embedSettings,
    app: appInfo,
    resources: resources.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      color: r.color,
      icon: r.icon,
    })),
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

if (!process.env.VERCEL && require.main === module) {
  app.listen(port, () => {
    console.log(`BookAThing server running on port ${port}`);
    console.log(`API available at http://localhost:${port}/api`);
  });
}

module.exports = app;
