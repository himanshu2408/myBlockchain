const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rp = require('request-promise');

const nodeAddress = uuid().split('-').join('');

const himanshucoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function (req, res) {
    res.send(himanshucoin);
})

app.post('/transaction', function (req, res) {
    const newTransaction = req.body;
    const blockIndex = himanshucoin.addTransactionToPendingTransactions(newTransaction);

    res.json({
            note: `Trasaction will be added in block ${blockIndex}.`
    });
})

app.post('/transaction/broadcast', function (req, res) {
    const newTransaction = himanshucoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    himanshucoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromimses = [];
    himanshucoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };

        requestPromimses.push(rp(requestOptions));
    });
    Promise.all(requestPromimses)
        .then(data => {
            res.json({
                note: `Transaction created and broadcast successfully.`
            });
        });
});

app.get('/mine', function (req, res) {
    const previousBlock = himanshucoin.getLastBlock();
    const previousBlockHash = previousBlock['hash'];
    const currentBlockData = {
        transactions: himanshucoin.pendingTransactions,
        index: previousBlock['index'] + 1
    }
    const nonce = himanshucoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = himanshucoin.hashBlock(previousBlockHash, currentBlockData, nonce);

    himanshucoin.createNewTransaction(12.5, '00', nodeAddress)

    const newBlock = himanshucoin.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    himanshucoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            const requestOptions = {
                uri: himanshucoin.currentNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 12.5,
                    sender: "00",
                    recipient: nodeAddress
                },
                json: true
            };
            return rp(requestOptions);
        })
        .then(data => {
            res.json({
                note: "New block mined and broadcast successfully.",
                block: newBlock
            });
        })
})


app.post('/receive-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = himanshucoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if (correctHash && correctIndex) {
        himanshucoin.chain.push(newBlock);
        himanshucoin.pendingTransactions = [];
        res.json({
            note: `New Block received and accepted.`,
            newBlock: newBlock
        });
    }
    else {
        res.json({
            note: `New Block rejected.`,
            newBlock: newBlock
        })
    }
});


// register a node and broadcast it to whole network
app.post('/register-and-broadcast-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    
    if (himanshucoin.networkNodes.indexOf(newNodeUrl) == -1) {
        himanshucoin.networkNodes.push(newNodeUrl);
    }
    const regNodesPromises = [];
    himanshucoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl : newNodeUrl },
            json: true
        };
        regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises)
        .then(data => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...himanshucoin.networkNodes, himanshucoin.currentNodeUrl] },
                json: true
            };

            return rp(bulkRegisterOptions);
        })
        .then(data => {
            res.json({
                   note: `New Node registered with network successfully.`
            });
        });
})

// register  a node to the network
app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = himanshucoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = himanshucoin.currentNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
        himanshucoin.networkNodes.push(newNodeUrl);
    }
    res.json({
        note: `New Node registered successfully.`
    });
    
})


// register  multiple nodes to the network
app.post('/register-nodes-bulk', function (req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;

    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = himanshucoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = himanshucoin.currentNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode){
            himanshucoin.networkNodes.push(networkNodeUrl);
        }
    });
    res.json({
        note: `Bulk registration successfull.`
    });
})


app.get('/consensus', function (req, res) {
    const requestPromises = [];
    himanshucoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        };
        requestPromises.push(rp(requestOptions));

        Promise.all(requestPromises)
            .then(blockchains => {
                const currentChainLength = himanshucoin.chain.length;
                let maxChainLength = currentChainLength;
                let newLongestChain = null;
                let newPendingTransactions = null;
                blockchains.forEach(blockchain => {
                    if (blockchain.chain.length > maxChainLength) {
                        maxChainLength = blockchain.chain.length;
                        newLongestChain = blockchain.chain;
                        newPendingTransactions = blockchain.pendingTransactions;
                    }
                });

                if (!newLongestChain || (newLongestChain && !himanshucoin.chainIsValid(newLongestChain))) {
                    res.json({
                        note: 'Current chain has not been replaced.',
                        chain: himanshucoin.chain
                    });
                }
                else if (newLongestChain && himanshucoin.chainIsValid(newLongestChain)) {
                    himanshucoin.chain = newLongestChain;
                    himanshucoin.pendingTransactions = newPendingTransactions;

                    res.json({
                        note: 'This chain has been replaced.',
                        chain: himanshucoin.chain
                    });
                }
            });
    });
});

app.get('/block/:blockHash', function (req, res) {
    const blockHash = req.params.blockHash;
    const correctBlock = himanshucoin.getBlock(blockHash);
    res.json({
        block: correctBlock
    });
});

app.get('/transaction/:transactionId', function (req, res) {
    const transactionId = req.params.transactionId;
    const transactionData = himanshucoin.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    });
});

app.get('/address/:address', function (req, res) {
    const address = req.params.address;
    const addressData = himanshucoin.getAddressData(address);
    res.json({
        addressData: addressData
    });
});

app.listen(port, function () {
    console.log(`Listening on port ${port}...`);
})