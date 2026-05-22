const express = require('express');
const router = express.Router();

router.post('/', (req, res) => res.status(501).json({ error: 'Not implemented (Person 3)' }));
router.get('/', (req, res) => res.status(501).json({ error: 'Not implemented (Person 3)' }));
router.get('/:id', (req, res) => res.status(501).json({ error: 'Not implemented (Person 3)' }));
router.put('/:id', (req, res) => res.status(501).json({ error: 'Not implemented (Person 3)' }));
router.delete('/:id', (req, res) => res.status(501).json({ error: 'Not implemented (Person 3)' }));

module.exports = router;
