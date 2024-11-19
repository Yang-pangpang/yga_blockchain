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

class BlockChain {

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
    // 转账
    transfer(from, to, amount) {
        // 1: 签名校验(后续)
        if(from !== '0') {
            // 交易非挖矿
            const balance = this.balance(from);
            if(balance < amount) {
                console.log('not enough balance',from ,balance,amount);
                return
            }
        }
        const transObj = {from, to, amount};
        this.data.push(transObj);
        return transObj;
    }
    // 查询余额
    balance(address) {
        let balance = 0;
        this.blockchain.forEach(block=>{
            if(!Array.isArray(block.data)) {
                // 创世区块
                return;
            }
            block.data.forEach(bal=>{
                if(address === bal.from) {
                    balance -= bal.amount;
                }
                if(address === bal.to) {
                    balance += bal.amount;
                }
            })
        })
        return balance;
    }
    // 挖矿----打包交易
    mine(address) {
        // 1: 生成新的区块--- 新的账本
        // 2： 不停的计算hash，直到计算出符合条件的hash值

        // 3: 挖矿结束，矿工奖励,每次挖矿成功给100
        this.transfer('0', address, 100);
        const newBlock = this.generateNewBlock();
        // 检验区块是否合法，合法区块新增+1
        if (this.isValidBlock(newBlock) && this.isValidChain(this.blockchain)) {
            this.blockchain.push(newBlock);
            this.data = [];
            return newBlock;
        } else {
            console.log('Error, Invalid Block', newBlock);
        }
    }

    // 生成新区快
    generateNewBlock() {

        let nonce = 0;
        const index = this.blockchain.length;
        const data = this.data;
        const prevHash = this.getLastBlock().hash;
        const timestamp = new Date().getTime();
        let hash = this.computeHash(index, timestamp, prevHash, data, nonce);

        while (hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
            nonce += 1;
            hash = this.computeHash(index, timestamp, prevHash, data, nonce);
        }
        return {
            index,
            data,
            prevHash,
            timestamp,
            nonce,
            hash
        };
    }

    // 计算hash
    computeHash(index, timestamp, prevHash, data, nonce) {
        return crypto
            .createHash('sha256')
            .update(index + timestamp + prevHash + data + nonce)
            .digest('hex')

    }

    computedHashForBlock({index, timestamp, prevHash, data, nonce}) {
        return this.computeHash(index, timestamp, prevHash, data, nonce);
    }

    // 校验区块
    isValidBlock(newBlock, lastBlock = this.getLastBlock()) {
        // 1：区块的Index 等于最新的区块index + 1;
        // 2：区块的timestamp 小于最新区块的timestamp;
        // 3：最新的区块prevHash 等于最新区块的hash;
        // 4: 区块的hash,符合难度要求；
        // 5: 新的hash值是否正确
        if (newBlock.index !== lastBlock.index + 1) {
            return false;
        } else if (newBlock.timestamp <= lastBlock.timestamp) {
            return false;
        } else if (newBlock.prevHash !== lastBlock.hash) {
            return false;
        } else if (newBlock.hash.slice(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
            return false;
        } else if (newBlock.hash !== this.computedHashForBlock(newBlock)) {
            return false;
        }
        return true;
    }

    // 校验CHain
    isValidChain(chain = this.blockchain) {
        for (let i = chain.length - 1; i >= 1; i--) {
            if (!this.isValidBlock(chain[i], chain[i - 1])) {
                return false;
            }
        }
        if (JSON.stringify(chain[0]) !== JSON.stringify(initBlock)) {
            return false;
        }
        return true;
    }

}

let bc = new BlockChain();

module.exports = BlockChain
