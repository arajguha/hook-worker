const { messageQueue, queueName } = require("../config/vars");
const logger = require("./logger");

const consumeAndForward = async (io) => {
    const channel = messageQueue.channel;
    channel.consume(queueName, (msg) => {
        try {
            if (msg) {
                logger.debug('message recieved: ', msg.content.toString());
                io.emit('new_message', msg.content.toString());
                channel.ack(msg);
            } else {
                logger.info('Consumer cancelled by server');
            }
        } catch (error) {
            console.log(error);
            logger.error('something went wrong ', error.message);
        }
    });
};

module.exports = { consumeAndForward };