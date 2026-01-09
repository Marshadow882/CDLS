const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));

app.get('/config', (req, res) => {
    res.json({
        INVENTORY_API: process.env.INVENTORY_API || 'http://localhost:3001',
        BOOKING_API: process.env.BOOKING_API || 'http://localhost:3002'
    });
});

app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});
