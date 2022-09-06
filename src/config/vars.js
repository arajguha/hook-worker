require('dotenv-safe').config();

module.exports = {
    port: process.env.PORT,
    messageQueue: {
        connection: null,
        channel: null,
        host: process.env.RABBIT_MQ_HOST || 'localhost',
        port: process.env.RABBIT_MQ_PORT || 5672,
    },
    queueName: process.env.QUEUE_NAME || 'webhook_tasks'
};