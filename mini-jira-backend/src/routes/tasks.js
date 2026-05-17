const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet (Person 2)' });
});

router.get('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet (Person 2)' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet (Person 2)' });
});

router.put('/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet (Person 2)' });
});

router.delete('/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet (Person 2)' });
});

module.exports = router;
