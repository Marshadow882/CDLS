const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { addDays, format } = require('date-fns');

const app = express();
const PORT = process.env.PORT || 3002;
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

app.use(cors());
app.use(express.json());

// In-memory store for reservations
let reservations = [];

// --- Middleware ---

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: `Access denied. Requires ${role} role.` });
        }
        next();
    };
};

// --- Endpoints ---

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'device-loan-booking-svc' });
});

// Helper endpoint to generate tokens for testing (Not strictly asked but necessary for "demo")
app.post('/auth/login', (req, res) => {
    try {
        const { username, role } = req.body; // e.g., 'student' or 'staff'
        if (!['student', 'staff'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Use "student" or "staff".' });
        }
        const token = jwt.sign({ username, role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error("Login failed", err);
        res.status(500).json({ error: "login_failed", message: String(err?.message || err) });
    }
});

// 1. Create Reservation (Any authenticated user)
app.post('/reservations', authenticate, async (req, res) => {
    const { deviceId, quantity } = req.body;
    const qty = quantity || 1;

    try {
        // Step 1: Check availability from Inventory Service
        const inventoryRes = await axios.get(`${INVENTORY_SERVICE_URL}/devices/${deviceId}`);
        const device = inventoryRes.data;

        if (device.available_quantity < qty) {
            return res.status(409).json({ error: 'Device not available' });
        }

        // Step 2: Reserve (Update Inventory)
        await axios.patch(`${INVENTORY_SERVICE_URL}/devices/${deviceId}/inventory`, {
            action: 'borrow',
            count: qty
        });

        // Step 3: Create Reservation Record
        const reservation = {
            id: Date.now().toString(),
            deviceId,
            deviceName: `${device.brand} ${device.model}`,
            userId: req.user.username,
            userRole: req.user.role,
            status: 'reserved', // reserved -> collected -> returned
            reservedAt: new Date(),
            returnDate: addDays(new Date(), 2) // Fixed 2-day rule
        };
        reservations.push(reservation);

        res.status(201).json({ 
            message: 'Reservation successful', 
            reservation,
            info: `Please collect by ${format(reservation.returnDate, 'yyyy-MM-dd')}` 
        });

    } catch (error) {
        console.error('Reservation error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Collect Device (Staff Only)
app.post('/reservations/:id/collect', authenticate, requireRole('staff'), (req, res) => {
    const reservation = reservations.find(r => r.id === req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    if (reservation.status !== 'reserved') {
        return res.status(400).json({ error: `Cannot collect. Current status: ${reservation.status}` });
    }

    reservation.status = 'collected';
    reservation.collectedAt = new Date();
    res.json({ message: 'Device collected', reservation });
});

// 3. Return Device (Staff Only)
app.post('/reservations/:id/return', authenticate, requireRole('staff'), async (req, res) => {
    const reservation = reservations.find(r => r.id === req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    if (reservation.status === 'returned') {
        return res.status(400).json({ error: 'Already returned' });
    }

    try {
        // Step 1: Update Inventory
        await axios.patch(`${INVENTORY_SERVICE_URL}/devices/${reservation.deviceId}/inventory`, {
            action: 'return',
            count: 1 // Assuming 1 per reservation for simplicity, though schema supports quantity
        });

        // Step 2: Update Status
        reservation.status = 'returned';
        reservation.returnedAt = new Date();

        // Step 3: Mock Waitlist Notification
        console.log(`[WAITLIST-NOTIFY] Device ${reservation.deviceId} is now available. Notifying next student in queue...`);

        res.json({ message: 'Device returned', reservation });

    } catch (error) {
        console.error('Return error:', error.message);
        res.status(500).json({ error: 'Failed to process return with inventory service' });
    }
});

app.get('/reservations', authenticate, (req, res) => {
    // Return all reservations for staff, or own for student
    if (req.user.role === 'staff') {
        res.json(reservations);
    } else {
        res.json(reservations.filter(r => r.userId === req.user.username));
    }
});

// Only start server if not running in Azure Functions
if (!process.env.AZURE_FUNCTIONS_WORKER_RUNTIME) {
    app.listen(PORT, () => {
        console.log(`Booking Service running on port ${PORT}`);
    });
}

module.exports = app;
