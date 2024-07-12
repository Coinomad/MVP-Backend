import { BullAdapter, setQueues, router } from 'bull-board';
import { paymentQueue } from './queue.js';

// Set up the queues to be monitored
setQueues([
  new BullAdapter(paymentQueue),
]);

export default router;
