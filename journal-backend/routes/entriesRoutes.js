const express = require('express');
const router = express.Router();
const entriesController = require('../controllers/entriesController');

router.get('/', entriesController.getEntries);
router.post('/', entriesController.addEntry);
router.put('/:id', entriesController.updateEntry);
router.delete('/:id', entriesController.deleteEntry);

module.exports = router;
