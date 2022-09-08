const { messageQueue, queueName } = require("./config/vars");

const consumeAndForward = async (io) => {
    const channel = messageQueue.channel;
    channel.consume(queueName, (msg) => {
        try {
            if (msg) {
                console.log('message recieved: ', msg.content.toString());
                io.emit('new_message', msg.content.toString());
                channel.ack(msg);
            } else {
                console.log('Consumer cancelled by server');
            }
        } catch (error) {
            console.log('something went wrong ', error.message);
        }
    });
};

module.exports = { consumeAndForward };