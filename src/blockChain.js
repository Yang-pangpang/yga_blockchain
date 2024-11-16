const crypto = require('crypto');


// 创世区块
const initBlock = {
    index: 0,
    data: 'this is Genesis block',
    prevHash: '0',
    timestamp: 1731725937902,
    nonce: 18056,
    hash: '0000a2769ad710da27823be8eaf3bd60d63bd51d79495c5410b6a80536fda35f'
}

class blockChain {

    constructor() {
        this.blockchain = [
            initBlock
        ];
        this.data = [];
        this.difficulty = 4;
    }

    // 获取最新区块
    getLastBlock() {
        return this.blockchain[this.blockchain.length - 1];
    }

    // 挖矿
    mine() {
        // 1: 生成新的区块--- 新的账本
        // 2： 不停的计算hash，直到计算出符合条件的hash值

        let nonce = 0;
        const index = this.blockchain.length;
        const data = 'this is Genesis block';
        const prevHash = this.getLastBlock().hash;
        const timestamp = new Date().getTime();
        let hash = this.computeHash(index, timestamp, prevHash, data, nonce);

        while (hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
            nonce += 1;
            hash = this.computeHash(index, timestamp, prevHash, data, nonce);
        }
        console.log('mine over:', {
            index,
            data,
            prevHash,
            timestamp,
            nonce,
            hash
        });

    }

    // 生成新区快
    generateNewBlock() {

    }

    // 计算hash
    computeHash(index, timestamp, prevHash, data, nonce) {
        return crypto
            .createHash('sha256')
            .update(index + timestamp + prevHash + data + nonce)
            .digest('hex')

    }

    // 校验区块
    isValidBlock() {

    }

    // 校验hash
    isValidHash() {

    }
}

let bc = new blockChain();
bc.mine();
