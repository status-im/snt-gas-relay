const EventEmitter = require('events');
const Web3 = require('web3');
const config = require('../config/config.js');
const ContractSettings = require('./contract-settings');
const MessageProcessor = require('./message-processor');
const JSum = require('jsum');
const logger = require('consola');
const winston = require('winston');
var cache = require('memory-cache');

// Setting up logging
const wLogger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({filename: 'gas-relayer.log'})
  ]
});
logger.clear().add(new logger.WinstonReporter(wLogger));


// Service Init
logger.info("Starting...");
const events = new EventEmitter();

// Web3 Connection
const connectionURL = `${config.node.local.protocol}://${config.node.local.host}:${config.node.local.port}`;
const wsProvider = new Web3.providers.WebsocketProvider(connectionURL, {headers: {Origin: "gas-relayer"}});
const web3 = new Web3(wsProvider);

web3.eth.net.isListening()
.then(() => events.emit('web3:connected', connectionURL))
.catch(error => {
  logger.error(error);
  process.exit();
});


events.on('web3:connected', connURL => {
  logger.info("Connected to '" + connURL + "'");
  let settings = new ContractSettings(config, web3, events, logger);
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
    logger.info("Not enough balance available for processing transactions");
    logger.info("> Account: " + config.node.blockchain.account);
    logger.info("> Balance: " + nodeBalance);

    if(exitSubs){
      web3.shh.clearSubscriptions();
    }

    process.exit(0);
  }
};

events.on('exit', () => {
  web3.shh.clearSubscriptions();
  logger.info("Closing service...");
  process.exit(0);
});

events.on('setup:complete', async (settings) => {
  // Verifying relayer balance
  await verifyBalance();

  shhOptions.kId = await web3.shh.newKeyPair();

  const symKeyID = await web3.shh.addSymKey(config.node.whisper.symKey);
  const pubKey = await web3.shh.getPublicKey(shhOptions.kId);

  // Listening to whisper
  // Individual subscriptions due to https://github.com/ethereum/web3.js/issues/1361
  // once this is fixed, we'll be able to use an array of topics and a single subs for symkey and a single subs for privKey
  logger.info(`Sym Key: ${config.node.whisper.symKey}`);
  logger.info(`Relayer Public Key: ${pubKey}`);
  logger.info("Topics Available:");
  for(let contract in settings.contracts) {
    logger.info("- " + settings.getContractByTopic(contract).name + ": " + contract + " [" + (Object.keys(settings.getContractByTopic(contract).allowedFunctions).join(', ')) + "]");
    shhOptions.topics = [contract];

    // Listen to public channel - Used for reporting availability
    events.emit('server:listen', Object.assign({symKeyID}, shhOptions), settings);

    // Listen to private channel - Individual transactions
    events.emit('server:listen', Object.assign({privateKeyID: shhOptions.kId}, shhOptions), settings);
  }
});

const replyFunction = (message) => (text, receipt) => {
  if(message.sig !== undefined){

      let payloadContent;
      if(typeof text === 'object'){
        payloadContent = {...text, receipt};
      } else {
        payloadContent = {text, receipt};
      }

      web3.shh.post({ 
          pubKey: message.sig, 
          sig: shhOptions.kId,
          ttl: config.node.whisper.ttl, 
          powTarget:config.node.whisper.minPow, 
          powTime: config.node.whisper.powTime, 
          topic: message.topic, 
          payload: web3.utils.fromAscii(JSON.stringify(payloadContent, null, " "))
      }).catch(console.error);
  }
};

const extractInput = (message) => {
    let obj = {
        contract: null,
        address: null,
        action: null
    };

    try {
        const msg = web3.utils.toAscii(message.payload);
        let parsedObj = JSON.parse(msg);
        obj.contract = parsedObj.contract;
        obj.address = parsedObj.address;
        obj.action = parsedObj.action;
        if(obj.action == 'transaction'){
          obj.functionName = parsedObj.encodedFunctionCall.slice(0, 10);
          obj.functionParameters = "0x" + parsedObj.encodedFunctionCall.slice(10);
          obj.payload = parsedObj.encodedFunctionCall;
        } else if(obj.action == 'availability') {
          obj.gasToken = parsedObj.gasToken;
          obj.gasPrice = parsedObj.gasPrice;
        }
    } catch(err){
      logger.error("Couldn't parse " + message);
    }
    
    return obj;
};


let messagesCheckSum = {};

events.on('server:listen', (shhOptions, settings) => {
  let processor = new MessageProcessor(config, settings, web3, events, logger, cache);
  web3.shh.subscribe('messages', shhOptions, async (error, message) => {
    if(error){
      logger.error(error);
      return;
    }

    verifyBalance(true);
    
    const input = extractInput(message);
    const inputCheckSum = JSum.digest({input}, 'SHA256', 'hex');

    const reply = replyFunction(message, inputCheckSum);

    if(cache.get(inputCheckSum)){
      reply("Duplicated message received");
    } else {
      let validationResult; 
      switch(input.action){
        case 'transaction':

          cache.put(inputCheckSum, (new Date().getTime()), 86400000);

          processor.processTransaction(settings.getContractByTopic(message.topic), 
                        input, 
                        reply);
          break;
        case 'availability':
          validationResult = await processor.processStrategy(settings.getContractByTopic(message.topic), 
                                input, 
                                reply,
                                settings.buildStrategy("./strategy/AvailabilityStrategy", message.topic)
                              );
          if(validationResult.success && validationResult.message) {
            messagesCheckSum[inputCheckSum] = (new Date().getTime());
            reply(validationResult.message);
          }
  
          break;
        default: 
          reply("unknown-action");        
      }
    }
  });
});


// Daemon helper functions

process.on("uncaughtException", function(err) {
  // TODO
  logger.error(err);  
});

process.once("SIGTERM", function() {
  logger.info("Stopping...");
});
