const { createBullBoard } = require('bull-board');
const { BullAdapter } = require('bull-board/bullAdapter.js');
const { scheduledPaymentQueue } = require('./queues.js');

// Set up the queues to be monitored
const { router, setQueues, replaceQueues } = createBullBoard([
  new BullAdapter(scheduledPaymentQueue),
]);

module.exports = router;
