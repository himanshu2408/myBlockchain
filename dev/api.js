const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');

const nodeAddress = uuid().split('-').join('');

const himanshucoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function (req, res) {
    res.send(himanshucoin);
})

app.post('/transaction', function (req, res) {
    const blockIndex = himanshucoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    res.json({
            note: `Trasaction will be added in block ${blockIndex}.`
    });
})

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
    res.json({
        note: "New block mined successfully",
        block: newBlock
    });
})


app.listen(3000, function () {
    console.log('Listening on port 3000...');
})