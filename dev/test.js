const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

//bitcoin.createNewBlock(123, 'sddsfdvfdv', 'ewrfrefe');

//bitcoin.createNewTransaction(100, 'him', 'abc');

//bitcoin.createNewBlock(123, 'sddsfdvfdv', 'ewrfrefe');

const previousBlockHash = '5565V64C7V7B7474C';
const currentBlockData = [
    {
        amount: 100,
        sender: 'DVHF7F6S5S6D5V6S5D',
        recipient: '65SDFSD87A'
    },
    {
        amount: 10,
        sender: 'DVHF7F6S5S6D5V6S5D',
        recipient: '65SDFSD87A'
    },
    {
        amount: 1000,
        sender: 'DVHF7F6S5S6D5V6S5D',
        recipient: '65SDFSD87A'
    }
];

console.log(bitcoin.proofOfWork(previousBlockHash, currentBlockData));