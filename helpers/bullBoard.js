import {   createBullBoard } from 'bull-board';
import {BullAdapter} from 'bull-board/bullAdapter.js'
import { scheduledPaymentQueue } from './queues.js';


// Set up the queues to be monitored


const { router, setQueues, replaceQueues } = createBullBoard([
  new BullAdapter(scheduledPaymentQueue),
]);

export default router;
