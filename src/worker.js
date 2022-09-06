const { messageQueue, queueName } = require("./config/vars");

const consumeAndForward = async (io) => {
    const channel = messageQueue.channel;
    channel.consume(queueName, (msg) => {
        if (msg) {
            console.log('message recieved: ', msg.content.toString());
            io.emit('new_message', msg.content.toString());
            channel.ack(msg);
        } else {
            console.log('Consumer cancelled by server');
        }
    }, { noAck: false });
};

module.exports = { consumeAndForward };