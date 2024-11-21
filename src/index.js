const vorpal = require('vorpal')();
const BlockChain = require('./blockChain');
const Table = require('cli-table');
const blockchain = new BlockChain();
const rsa = require('./rsa');


function formatLog(data) {
    if(!data || data.length === 0) {
        return
    }
    if (!Array.isArray((data))) {
        data = [data];
    }
    const first = data[0];
    const head = Object.keys(first);
    const table = new Table({
        head: head,
        colWidths: new Array(head.length).fill(20)
    });

    const result = data.map(item => {
        return head.map(v => JSON.stringify(item[v],null,1))
    })
    table.push(...result);
    console.log(table.toString());
}


// vorpal
//     .command('Welcome yga_blockchain')
//     .action(function(args, callback) {
//         this.log('this is blockchain demo');
//         callback();
//     });

vorpal
    .command('trans <to> <amount>','转账')
    .action(function (args,callback){
        let trans = blockchain.transfer(rsa.keys.pub,args.to,args.amount);
        if(trans) {
            formatLog(trans);
            callback();
        }
    })
vorpal
    .command('mine' ,  '挖矿')
    .action(function (args, callback) {
        const newBlock = blockchain.mine(rsa.keys.pub);
        if (newBlock) {
            formatLog(newBlock);
        }
        callback();
    });

vorpal
    .command('detail <index>','查看区块详情')
    .action(function (args,callback) {
        const block = blockchain.blockchain[args.index];
        this.log(JSON.stringify(block,null,2));
        callback();
    })
vorpal
    .command('balance <address>','余额查询')
    .action(function (args,callback) {
        const balance = blockchain.balance(args.address);
        if(balance) {
            formatLog({balance:args.address});
        }

        callback();
    })

vorpal
    .command('blockchain', '查看区块链')
    .action(function (args, callback) {
        formatLog(blockchain.blockchain);
        callback();
    });
 // 查看本地地址
vorpal
    .command('pub', '查看本地地址')
    .action(function (args, callback) {
        console.log(rsa.keys.pub);
        callback();
    });
    // 查看网络节点列表
vorpal
    .command('peers', '查看网络节点列表')
    .action(function (args, callback) {
        formatLog(blockchain.peers);
        callback();
    });
vorpal
    .command('chat <message>', '跟别的节点通信')
    .action(function (args, callback) {
        blockchain.boardCast({
            type:'hi',
            data:args.message
        })
        callback();
    });
vorpal
    .command('pending', '查看还没被打包的交易')
    .action(function (args, callback) {
        formatLog(blockchain.data);
        callback();
    });


vorpal.exec('help')

vorpal

    .delimiter('yga_blockChain=>')
    .show();


