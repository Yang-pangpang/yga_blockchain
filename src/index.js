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
        colWidths: new Array(head.length).fill(30)
    });

    const result = data.map(item => {
        return head.map(v => item[v])
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
    .command('mine', '挖矿')
    .action(function (args, callback) {
        const newBlock = blockchain.mine();
        if (newBlock) {
            formatLog(newBlock);
        }
        callback();
    });

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


