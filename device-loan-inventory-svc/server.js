const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const seeds = require('./data/seeds');

// In-memory data store (In a real production scenario, this would be a database like PostgreSQL or MongoDB to ensure true statelessness)
let inventory = [...seeds];

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'device-loan-inventory-svc' });
});

// Read-only interface for frontend and booking service
app.get('/devices', (req, res) => {
    res.json(inventory);
});

app.get('/devices/:id', (req, res) => {
    const device = inventory.find(d => d.id === req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
});

// Controlled inventory update interface ONLY for booking service
// Expects: { action: 'borrow' | 'return', count: number }
app.patch('/devices/:id/inventory', (req, res) => {
    const { action, count } = req.body;
    const device = inventory.find(d => d.id === req.params.id);

    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    if (!count || count <= 0) {
        return res.status(400).json({ error: 'Invalid count' });
    }

    if (action === 'borrow') {
        if (device.available_quantity < count) {
            return res.status(409).json({ error: 'Insufficient inventory' });
        }
        device.available_quantity -= count;
    } else if (action === 'return') {
        if (device.available_quantity + count > device.total_quantity) {
             // Basic integrity check, though in real world we might audit this
             device.available_quantity = device.total_quantity;
        } else {
            device.available_quantity += count;
        }
    } else {
        return res.status(400).json({ error: 'Invalid action. Use "borrow" or "return".' });
    }

    console.log(`Inventory updated for ${device.model}: ${device.available_quantity}/${device.total_quantity}`);
    res.json(device);
});

// Only start server if not running in Azure Functions
if (!process.env.AZURE_FUNCTIONS_WORKER_RUNTIME) {
    app.listen(PORT, () => {
        console.log(`Inventory Service running on port ${PORT}`);
    });
}

module.exports = app;
