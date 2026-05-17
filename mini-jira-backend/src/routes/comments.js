const express = require('express');
const router = express.Router();

router.post('/', (req, res) => res.status(501).json({ error: 'Not implemented (Person 3)' }));
router.get('/:taskId', (req, res) => res.status(501).json({ error: 'Not implemented (Person 3)' }));

module.exports = router;
