require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const bimRoutes = require('./src/routes/bimRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/bim', bimRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send({ status: 'Central Auth Server is Running', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Auth Server running on http://localhost:${PORT}`);
});
