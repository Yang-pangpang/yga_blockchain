const vorpal = require('vorpal')();
const BlockChain = require('./blockChain');
const blockchain = new BlockChain()

// vorpal
//     .command('Welcome yga_blockchain')
//     .action(function(args, callback) {
//         this.log('this is blockchain demo');
//         callback();
//     });

vorpal
    .command('mine','挖矿')
    .action(function(args, callback) {
        const newBlock = blockchain.mine();
        if(newBlock) {
            console.log(newBlock);
        }
        callback();
    });

vorpal
    .command('chain','查看区块链')
    .action(function(args, callback) {
       this.log(blockchain.blockchain);
        callback();
    });

vorpal.exec('help')

vorpal

    .delimiter('yga_blockChain=>')
    .show();


