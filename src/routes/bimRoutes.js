const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Base path: /bim

/**
 * GET /bim/widgets
 * Requires 'read' permission for 'Widgets' feature in 'BIMCAPABILITY' module
 */
router.get('/widgets', authenticate, authorize('BIMCAPABILITY', 'Widgets', 'read'), (req, res) => {
    res.json({
        message: 'Successfully fetched BIM widgets',
        data: [
            { id: 1, name: 'Widget A', type: 'Sensor' },
            { id: 2, name: 'Widget B', type: 'Actuator' }
        ]
    });
});

/**
 * PUT /bim/widgets
 * Requires 'edit' permission for 'Widgets' feature in 'BIMCAPABILITY' module
 */
router.put('/widgets', authenticate, authorize('BIMCAPABILITY', 'Widgets', 'edit'), (req, res) => {
    res.json({
        message: 'Successfully updated BIM widget',
        updated: req.body
    });
});

/**
 * DELETE /bim/widgets
 * Requires 'delete' permission for 'Widgets' feature in 'BIMCAPABILITY' module
 */
router.delete('/widgets', authenticate, authorize('BIMCAPABILITY', 'Widgets', 'delete'), (req, res) => {
    res.json({
        message: 'Successfully deleted BIM widget'
    });
});

module.exports = router;
