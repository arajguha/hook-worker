const http = require('http');
const socketIO = require('socket.io');
const rabbitMQ = require('./config/rabbitmq');
const { port } = require('./config/vars');
const { consumeAndForward } = require('./worker');

process.on('uncaughtException', (err) => {
    console.log('exiting...uncaughtException ', err);
    process.exit(-1);
});

rabbitMQ
    .connect()
    .then(() => {
        const httpServer = http.createServer();
        const io = socketIO(httpServer, {
            cors: {
              origin: "http://127.0.0.1:5500",
              methods: ["GET", "POST"]
            }
          });

        io.on('connection', socket => {
            /**
             * starts forwarding data only when
             * client is ready to receive and also
             * new message is available in the queue
             */
            console.log(`client connected. socketId: ${socket.id}`);

            socket.on('client_ready', () => {
                consumeAndForward(io);
            });

            socket.on('disconnect', () => {
                console.log(`client disconnected. socketId: ${socket.id}`);
            });
        });

        httpServer.listen(port, () => console.log(`server started on port ${port}`));
    })
    .catch(err => {
        console.log('exiting...error in startup ', err);
        process.exit(-1);
    });
