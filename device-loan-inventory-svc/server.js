const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory data store (In a real production scenario, this would be a database like PostgreSQL or MongoDB to ensure true statelessness)
let inventory = [
    { id: '1', brand: 'Apple', model: 'iPad Pro', category: 'Tablet', total_quantity: 20, available_quantity: 20 },
    { id: '2', brand: 'Dell', model: 'XPS 15', category: 'Laptop', total_quantity: 10, available_quantity: 10 },
    { id: '3', brand: 'Canon', model: 'EOS R5', category: 'Camera', total_quantity: 5, available_quantity: 5 },
    { id: '4', brand: 'Sony', model: 'Alpha a7 III', category: 'Camera', total_quantity: 8, available_quantity: 8 },
    { id: '5', brand: 'Apple', model: 'MacBook Air', category: 'Laptop', total_quantity: 15, available_quantity: 15 }
];

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

app.listen(PORT, () => {
    console.log(`Inventory Service running on port ${PORT}`);
});
