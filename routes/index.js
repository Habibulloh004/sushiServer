import express from 'express';
import clickController from '../controllers/click.controller.js';
import paymeController from '../controllers/payme.controller.js';
import paymeMiddleware from '../middlewares/payme.middleware.js';
import transactionController from '../controllers/transaction.controller.js';

const router = express.Router();
// CLICK routes
router.post('/click/prepare', clickController.prepare);
router.post('/click/complete', clickController.complete);
router.post('/click/checkout', clickController.checkout);

// PAYME routes
router.post('/payme/pay', paymeMiddleware, paymeController.pay);
router.post('/payme/checkout', paymeController.checkout);

router.get('/transaction/:id', transactionController.getById)

export default router; // Use export default
