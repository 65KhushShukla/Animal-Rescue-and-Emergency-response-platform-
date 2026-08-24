const express = require('express');
const router = express.Router();
const { getAiTriage } = require('../controllers/aiController');

router.post('/triage', getAiTriage);

module.exports = router;
