const express = require('express');
const router = express.Router();

router.post('/presigned-url', (req, res) => res.status(501).json({ error: 'Not implemented (Person 4)' }));
router.delete('/:key', (req, res) => res.status(501).json({ error: 'Not implemented (Person 4)' }));

module.exports = router;
