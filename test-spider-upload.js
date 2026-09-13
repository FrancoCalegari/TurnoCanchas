const fs = require('fs');
fs.writeFileSync('test.txt', 'Hello Spiderweb API');

const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
    const KEY = '1a56a7ade443173835913d623649599dee6178a2366a10c22d898fbe58baa2b9';
    const form = new FormData();
    form.append('files', fs.createReadStream('test.txt'));
    
    const res = await fetch('https://spiderwebargapi.com.ar/api/v1/storage/projects/32/files', {
        method: 'POST',
        headers: {
            'X-API-KEY': KEY,
            ...form.getHeaders()
        },
        body: form
    });
    
    const data = await res.json();
    console.log("Upload response:", JSON.stringify(data, null, 2));
}
run();
