let fs = require('fs');
let EC = require('elliptic').ec;
let ec = new EC('secp256k1');
let keypair = ec.genKeyPair();


const keys = generateKeys()
console.log(keys);


generateKeys();

// 1: 获取公私钥对（持久化）
function generateKeys() {
    const fileName = './wallet.json';
    try {
        let res = JSON.parse(fs.readFileSync(fileName));
        if (res.prv && res.pub && getPub(res.prv) === res.pub) {
            keypair = ec.keyFromPrivate(res.prv);
            return res;
        } else {
            // 验证失败，重新申城
            throw 'not valid wallet.json'
        }
    } catch (error) {
        // 文件不存在或者文件被容不合法,重新生成
        const res = {
            prv: keypair.getPrivate('hex').toString(),
            pub: keypair.getPublic('hex').toString()
        }
        fs.writeFileSync(fileName, JSON.stringify(res));
        return res
    }
}

// 根据私钥算出公钥
function getPub(prv) {
    return ec.keyFromPrivate(prv).getPublic('hex').toString();
}


// 2: 签名

function sign({from, to, amount}) {
    const bufferMsg = Buffer.from(`${from}-${to}-${amount}`);
    let signature = Buffer.from(keypair.sign(bufferMsg).toDER()).toString('hex');
    return signature;

}


// 3: 校验签名
function verify({from, to, amount, signature}, pub) {
    const keypairTemp = ec.keyFromPublic(pub, 'hex');
    const bufferMsg = Buffer.from(`${from}-${to}-${amount}`);
    return keypairTemp.verify(bufferMsg, signature);

}

module.exports = {
    sign,
    verify,
    keys

}

// const trans = {from:'yonga',to:'live',amount:100};
// // const trans1 = {from:'yonga1',to:'live',amount:'100'};
//
// const signature = sign(trans);
// trans.signature = signature;
// console.log(signature);
//
// const isVerify = verify(trans,keys.pub);
// console.log(isVerify)


