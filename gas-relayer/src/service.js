const EventEmitter = require('events');
const Web3 = require('web3');
const config = require('../config/config.js');
const ContractSettings = require('./contract-settings');
const MessageProcessor = require('./message-processor');

// IDEA: A node should call an API (probably from a status node) to register itself as a 
//      token gas relayer.

console.info("Starting...");
const events = new EventEmitter();

// Web3 Connection
let connectionURL = `${config.node.local.protocol}://${config.node.local.host}:${config.node.local.port}`;
const web3 = new Web3(connectionURL);

web3.eth.net.isListening()
.then(() => events.emit('web3:connected', connectionURL))
.catch(error => {
  console.error(error);
  process.exit();
});


events.on('web3:connected', connURL => {
  console.info("Connected to '%s'", connURL);
  let settings = new ContractSettings(config, web3, events);
  settings.process();
});

// Setting up Whisper options
const shhOptions = {
  ttl: config.node.whisper.ttl,
  minPow: config.node.whisper.minPow
};

const verifyBalance = async (exitSubs) => {
  const nodeBalance = await web3.eth.getBalance(config.node.blockchain.account);
  if(web3.utils.toBN(nodeBalance).lte(web3.utils.toBN(100000))){ // TODO: tune minimum amount required for transactions
    console.log("Not enough balance available for processing transactions");
    console.log("> Account: %s", config.node.blockchain.account);
    console.log("> Balance: %s", nodeBalance);

    if(exitSubs){
      web3.shh.clearSubscriptions();
    }

    process.exit(0);
  }
};

events.on('exit', () => {
  web3.shh.clearSubscriptions();
  console.log("Closing service...");
  process.exit(0);
});

events.on('setup:complete', async (settings) => {
  // Verifying relayer balance
  await verifyBalance();

  shhOptions.symKeyId = await web3.shh.addSymKey(config.node.whisper.symKey);
  shhOptions.kId = await web3.shh.newKeyPair();

  // Listening to whisper
  console.info(`Sym Key: ${config.node.whisper.symKey}`);
  console.info("Topics Available:");
  for(let contract in settings.contracts) {
    console.info("- %s: %s [%s]", settings.getContractByTopic(contract).name, contract,  Object.keys(settings.getContractByTopic(contract).allowedFunctions).join(', '));
    shhOptions.topics = [contract];
    events.emit('server:listen', shhOptions, settings);
  }

  /*
  if(config.heartbeat.enabled){

    web3.shh.addSymKey(config.heartbeat.symKey)
      .then(heartbeatSymKeyId => { 

        for(let tokenAddress in settings.getTokens()){

          let heartbeatPayload = settings.getToken(tokenAddress);
          heartbeatPayload.address = tokenAddress;

          setInterval(() => {
              web3.shh.post({ 
                symKeyID: heartbeatSymKeyId, 
                sig: keyId,
                ttl: config.node.whisper.ttl, 
                powTarget:config.node.whisper.minPow, 
                powTime: config.node.whisper.powTime,
                topic: web3.utils.toHex("relay-heartbeat-" + heartbeatPayload.symbol).slice(0, 10),
                payload: web3.utils.toHex(JSON.stringify(heartbeatPayload))
            }).catch((err) => {
              console.error(err);
              process.exit(-1);
            });
          }, 60000);

        }
    });
  }*/
});

events.on('server:listen', (shhOptions, settings) => {
  let processor = new MessageProcessor(config, settings, web3, shhOptions.kId, events);
  web3.shh.subscribe('messages', shhOptions, (error, message) => {
    verifyBalance(true);
    processor.process(error, message);
  });
});

// Daemon helper functions

process.on("uncaughtException", function(err) {
  // TODO
  console.error(err);  
});

process.once("SIGTERM", function() {
  console.log("Stopping...");
});
