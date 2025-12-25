const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.log('Body:', body);
                    reject(e);
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function test() {
    const receiverClean = '0xTestReceiverReceive' + Date.now();
    const receiver = ' ' + receiverClean + ' ';
    const sender = '0xTestSender' + Date.now();

    console.log(`Testing with Receiver (Dirty): '${receiver}'`);
    console.log(`Testing with Receiver (Clean Query): '${receiverClean}'`);

    const txData = {
        id: 'test-uuid-' + Date.now(),
        fromAddress: sender,
        toAddress: receiver,
        totalAmount: 50,
        destinationChain: 'Polygon',
        status: 'PENDING',
        tokenSymbol: 'USDC',
        createdAt: Date.now()
    };

    console.log('Creating transaction...');
    try {
        const createRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/transactions',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, txData);
        console.log('Create Response:', createRes);

        if (!createRes.success) return;

        console.log('Fetching history...');
        const listRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: `/api/transactions?address=${receiverClean}`,
            method: 'GET'
        });

        console.log(`Found ${listRes.transactions ? listRes.transactions.length : 0} transactions`);
        if (listRes.transactions && listRes.transactions.length > 0) {
            const tx = listRes.transactions[0];
            if (tx.toAddress === receiver && tx.status === 'PENDING') {
                console.log('SUCCESS: Pending Incoming Transaction found via API!');
            } else {
                console.log('FAILURE: Transaction data mismatch');
            }
        } else {
            console.log('FAILURE: No transactions found for receiver in list response');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
