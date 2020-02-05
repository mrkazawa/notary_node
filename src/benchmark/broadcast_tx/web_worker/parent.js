const { Worker } = require('worker_threads');

function runCryptoService(workerData) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./crypto_service.js', { workerData });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}

async function run() {
    const secret = 'NODE0';

    const getPublicKeyOperation = {
        messageType: 'get-public-key',
        secret: secret
    };
    var publicKey = await runCryptoService(getPublicKeyOperation);
    console.log(publicKey);

    const generateIdOperation = {
        messageType: 'generate-id'
    };
    var id = await runCryptoService(generateIdOperation);
    console.log(id);

    const generateHashOperation = {
        messageType: 'generate-hash',
        data: 'a random data'
    };
    var hash = await runCryptoService(generateHashOperation);
    console.log(hash);

    const generateSignatureOperation = {
        messageType: 'generate-signature',
        secret: secret,
        dataHash: hash
    };
    var signature = await runCryptoService(generateSignatureOperation);
    console.log(signature);

    const verifySignatureOperation = {
        messageType: 'verify-signature',
        publicKey: publicKey,
        signature: signature,
        dataHash: hash
    };
    var result = await runCryptoService(verifySignatureOperation);
    console.log(result);
}

run().catch(err => console.error(err));