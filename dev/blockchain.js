function Blockchain() {
	this.chain = [];
	this.newTransactions = [];
}

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
	const newBlock = {
		index: this.Chain.length + 1,
		timestamp: Date.now(),
		transactions: this.newTransactions,
		nonce: nonce,
		hash: hash,
		previousBlockHash: previousBlockHash
	};

	this.newTransactions = [];
	this.chain.push(newBlock);

	return newBlock;
}

Blockchain.prototype.getLastBlock - function () {
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewtransaction = function (amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient
    }

    this.newTransactions.push(newTransaction);
}

module.exports = Blockchain;