const http = require('http');
const numCPUs = require('os').cpus().length;
const rabbitMQ = require('./config/rabbitmq');
const cluster = require('cluster');
const { Server } = require('socket.io');
const { setupMaster, setupWorker } = require('@socket.io/sticky');
const { createAdapter, setupPrimary } = require('@socket.io/cluster-adapter');
const { port } = require('./config/vars');
const { consumeAndForward } = require('./utils/worker');
const logger = require('./utils/logger');

const setUpWorkerProcess = async () => {
    await rabbitMQ.connect();

    const httpServer = http.createServer();
    const io = new Server(httpServer, {
        cors: {
            origin: "http://127.0.0.1:5500",
            methods: ["GET", "POST"]
        }
    });

    // cluster adapter
    io.adapter(createAdapter());

    // setup connection with the primary process
    setupWorker(io);

    io.on('connection', socket => {
        /**
         * starts forwarding data only when
         * client is ready to receive and also
         * new message is available in the queue
         */
        logger.info(`client connected. socketId: ${socket.id}`);

        socket.on('client_ready', () => {
            consumeAndForward(io);
        });

        socket.on('disconnect', () => {
            logger.info(`client disconnected. socketId: ${socket.id}`);
        });
    });

    logger.info(`Worker ${process.pid} started`);
};


if (cluster.isMaster) {
    logger.info(`Master ${process.pid} is running`);

    const httpServer = http.createServer();

    // setup sticky sessions
    setupMaster(httpServer, {
        loadBalancingMethod: "least-connection",
    });

    // setup connections between the workers
    setupPrimary();

    // needed for packets containing buffers (you can ignore it if you only send plaintext objects)
    // Node.js < 16.0.0
    cluster.setupMaster({
        serialization: "advanced",
    });
    // Node.js > 16.0.0
    // cluster.setupPrimary({
    //   serialization: "advanced",
    // });

    httpServer.listen(port);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker) => {
        logger.error(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    setUpWorkerProcess()
        .catch(err => {
            logger.error(`exiting...something went wrong in child process ${process.pid}`, err);
            process.exit(-1);
        });
}

process.on('uncaughtException', (err) => {
    logger.error('exiting...uncaughtException ', err);
    process.exit(-1);
});
