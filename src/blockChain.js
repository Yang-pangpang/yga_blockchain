const crypto = require('crypto');
const dgram = require('dgram');
const rsa = require('./rsa');


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
        // 区块难度
        this.difficulty = 4;
        // 所有的网络节点信息, address port
        this.peers = [];
        this.remote = [];
        // 种子节点
        this.seed = {port: 5300, address: 'localhost'};
        this.udp = dgram.createSocket('udp4');
        this.init();
    }

    init() {
        this.bindP2p();
        this.bindExit();
    }

    bindP2p() {
        this.udp.on('message', (data, remote) => {
            const {address, port} = remote;
            try {
                const action = JSON.parse(data);
                if (action.type) {
                    this.dispatch(action, {address, port});
                }
            } catch (err) {
                console.error('Failed to process message:', err.message);
            }
        });

        this.udp.on('listening', () => {
            const address = this.udp.address();
            console.log(`UDP listening on ${address.address}:${address.port}`);
        });

        this.udp.on('error', (err) => {
            console.error('UDP socket error:', err.message);
        });

        const port = Number(process.argv[2]) || 0;
        this.startNode(port);
    }

    startNode(port) {
        this.udp.bind(port, (err) => {
            if (err) {
                console.error(`Failed to bind port ${port}:`, err.message);
                process.exit(1);
            }
        });

        if (port !== this.seed.port) {
            this.send({type: 'newPeer'}, this.seed.port, this.seed.address);
        }

        this.peers.push(this.seed);
    }

    send(message, port, address) {
        this.udp.send(JSON.stringify(message), port, address);
    }

    boardCast(action) {
        // 广播全场
        this.peers.forEach(v => {
            this.send(action, v.port, v.address);
        })
    }

    dispatch(action, remote) {
        // 接受到的网络消息在此处理
        switch (action.type) {
            case 'newPeer' :
                // 种子节点要做的事情
                // 1: 你的公网ip和port
                this.send({
                    type: 'remoteAddress',
                    data: remote
                }, remote.port, remote.address)
                // 2: 现在全部节点的列表
                this.send({
                    type: 'peerList',
                    data: this.peers
                }, remote.port, remote.address)
                // 3： 告诉所有已知节点  来了个新的ip
                this.boardCast({
                    type: 'board',
                    data: remote
                })
                // 4：告诉你现在区块链的数据
                this.send({
                    type: 'blockchain',
                    data: JSON.stringify({
                        blockchain: this.blockchain,
                        trans:this.data
                    })
                }, remote.port, remote.address)
                this.peers.push(remote);
                console.log('new peer', remote);
                break;
            // 同步本地区块链
            case 'blockchain':
                let allData = JSON.parse(action.data);
                let newChain = allData.blockchain;
                let newTrans = allData.trans;
                this.replaceChain(newChain);
                this.replaceTrans(newTrans);
                break;
            case 'remoteAddress':
                // 存储远程消息   退出的时候用
                this.remote = action.data;
                break;
            case 'peerList':
                const newPeers = action.data;
                this.addPeers(newPeers);
                break;
            case 'board':
                let remotePeer = action.data;
                this.peers.push(remotePeer);
                console.log('【信息】,新增了一条peer');
                this.send({type: 'hi'}, remote.port, remote.address)
                break;
            case 'trans':
                // 网络上收到的交易请求
                // 是否有重复交易
                if (!this.data.find(v => this.isEqualObj(v, action.data))) {
                    console.log('【信息】:新的交易');
                    this.addTrans(action.data);
                    this.boardCast({type: 'trans', data: action.data})
                }
                break;
            case 'hi':
                // console.log(`${remote.address}:${remote.port}: ${action.data}`)
                break;
            case 'mine':
                // 网络上有人挖矿成功
                const lastBlock = this.getLastBlock();
                if (lastBlock.hash === action.data.hash) {
                    // 重复的消息
                    return
                }
                if (this.isValidBlock(action.data, lastBlock)) {
                    console.log('【信息】：有人挖矿成功');
                    this.blockchain.push(action.data);
                    // 清空本地data信息
                    this.data = [];
                    this.boardCast({
                        type: 'mine',
                        data: action.data
                    })
                } else {
                    console.log('挖矿的区块不合法')
                }
                break;
            default:
                console.log('this is default');
        }
    }

    isEqualObj(obj1, obj2) {
        const key1 = Object.keys(obj1);
        const key2 = Object.keys(obj2);
        if (key1.length !== key2.length) {
            // key数量不同
            return false;
        }
        return key1.every(key => obj1[key] === obj2[key]);
    }

    // isEqualPeer(peer1, peer2) {
    //     return peer1.address === peer2.address && peer1.port === peer2.port
    // }

    addPeers(peers) {
        peers.forEach(peer => {
            if (!this.peers.find(v => this.isEqualPeer(peer, v))) {
                this.peers.push(peer);
            }
        })
    }

    bindExit() {
        process.on('exit', () => {
            console.log('【信息】: 离开信息')
        })
    }

    // 获取最新区块
    getLastBlock() {
        return this.blockchain[this.blockchain.length - 1];
    }

    // 转账
    transfer(from, to, amount) {
        const timestamp = new Date().getTime();
        const signature = rsa.sign({from, to, amount, timestamp});
        const signTaw = {from, to, amount, timestamp, signature};
        // 1: 签名校验(后续)
        if (from !== '0') {
            // 交易非挖矿
            const balance = this.balance(from);
            if (balance < amount) {
                console.log('not enough balance', from, balance, amount);
                return
            }
            this.boardCast({type: 'trnas', data: signTaw});
        }

        this.data.push(signTaw);
        return signTaw;
    }

    // 查询余额
    balance(address) {
        let balance = 0;
        this.blockchain.forEach(block => {
            if (!Array.isArray(block.data)) {
                // 创世区块
                return;
            }
            block.data.forEach(bal => {
                if (address === bal.from) {
                    balance -= bal.amount;
                }
                if (address === bal.to) {
                    balance += bal.amount;
                }
            })
        })
        return balance;
    }

    isValidTransfer(trans) {
        // 检验是否是合法转账
        return rsa.verify(trans, trans.from)
    }

    addTrans(trans) {
        if (this.isValidTransfer(trans)) {
            this.data.push(trans);
        }
    }
    replaceTrans(trans) {
        if(trans.every(v=>this.isValidTransfer(v))) {
            this.data = trans;
        }
    }
    // 挖矿----打包交易
    mine(address) {
        // 校验所有交易合法性
        // 只要有不合法的就报错
        // if(this.data.every(v=>this.isValidTransfer(v))) {
        //     console.log('trans not valid');
        //     return
        // }
        this.data = this.data.filter(v => this.isValidTransfer(v));
        // 1: 生成新的区块--- 新的账本
        // 2： 不停的计算hash，直到计算出符合条件的hash值

        // 3: 挖矿结束，矿工奖励,每次挖矿成功给100

        this.transfer('0', address, 100);


        const newBlock = this.generateNewBlock();
        // 检验区块是否合法，合法区块新增+1
        if (this.isValidBlock(newBlock) && this.isValidChain(this.blockchain)) {
            this.blockchain.push(newBlock);
            this.data = [];
            console.log('挖矿成功')
            this.boardCast({type: 'mine', data: newBlock});
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

    replaceChain(newChain) {
        // 先不校验交易
        if (newChain.length === 1) {
            return
        }
        if (this.isValidChain(newChain) && newChain.length > this.blockchain.length) {
            // 复制一份
            this.blockchain = JSON.parse(JSON.stringify(newChain))
        } else {
            console.log('[error]:不合法链')
        }
    }


}

let bc = new BlockChain();

module.exports = BlockChain
