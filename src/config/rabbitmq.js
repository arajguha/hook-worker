const amqplib = require('amqplib');
const set = require('set-value');
const logger = require('../utils/logger');
const { messageQueue, queueName } = require('./vars');

const connect = async () => {
    try {
        const connection = await amqplib.connect(`amqp://${messageQueue.host}:${messageQueue.port}`);
        const channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: true });
        set(messageQueue, 'connection', connection);
        set(messageQueue, 'channel', channel);

        logger.info('rabbitMQ connection has been setup');

    } catch (error) {
        logger.error('error while connecting to rabbitmq ', error);
        process.exit(-1);
    }
};

module.exports = { connect };