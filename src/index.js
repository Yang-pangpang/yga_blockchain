const vorpal = require('vorpal')();
const BlockChain = require('./blockChain');
const Tbale = require('cli-table');
const blockchain = new BlockChain();


function formatLog(data) {
    if (!Array.isArray((data))) {
        data = [data];
    }
    const first = data[0];
    const head = Object.keys(first);
    const table = new Tbale({
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
    .command('trans <from> <to> <amount>','转账')
    .action(function (args,callback){
        let trans = blockchain.transfer(args.from,args.to,args.amount);
        if(trans) {
            formatLog(trans);
            callback();
        }
    })
vorpal
    .command('mine <address>' ,  '挖矿')
    .action(function (args, callback) {
        const newBlock = blockchain.mine(args.address);
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
    .command('chain', '查看区块链')
    .action(function (args, callback) {
        formatLog(blockchain.blockchain);
        callback();
    });

vorpal.exec('help')

vorpal

    .delimiter('yga_blockChain=>')
    .show();


