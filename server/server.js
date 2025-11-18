const express = require("express");
const cors = require("cors");
const path = require("path");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");

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
watchConfig();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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

// Update resource status (for IoT integration)
app.put("/api/resources/:id/status", (req, res) => {
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
app.post("/api/bookings", (req, res) => {
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
    if (b.userName !== userName) return false;
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

  // Create booking
  const booking = {
    id: uuidv4(),
    resourceId,
    resourceName: resource.name,
    startTime: newStart.toISOString(),
    endTime: newEnd.toISOString(),
    userName,
    userEmail: userEmail || "",
    userPhone: userPhone || "",
    notes: notes || "",
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

// Get all bookings (with optional filters)
app.get("/api/bookings", (req, res) => {
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

// Cancel booking
app.delete("/api/bookings/:id", (req, res) => {
  const bookingIndex = inMemoryBookings.findIndex((b) => b.id === req.params.id);
  if (bookingIndex === -1) {
    return res.status(404).json({ error: "Booking not found" });
  }

  inMemoryBookings[bookingIndex].status = "cancelled";
  inMemoryBookings[bookingIndex].cancelledAt = new Date().toISOString();

  res.json({ success: true, message: "Booking cancelled" });
});

// Update booking status (for admin)
app.put("/api/bookings/:id/status", (req, res) => {
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

app.listen(port, () => {
  console.log(`BookAThing server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api`);
});
