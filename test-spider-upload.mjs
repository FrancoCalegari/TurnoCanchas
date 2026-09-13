import fs from 'fs/promises';

async function run() {
    await fs.writeFile('test.txt', 'Hello Spiderweb API');
    
    const KEY = '1a56a7ade443173835913d623649599dee6178a2366a10c22d898fbe58baa2b9';
    const form = new FormData();
    const fileBuf = await fs.readFile('test.txt');
    form.append('files', new Blob([fileBuf]), 'test.txt');
    
    const res = await fetch('https://spiderwebargapi.com.ar/api/v1/storage/projects/32/files', {
        method: 'POST',
        headers: {
            'X-API-KEY': KEY
        },
        body: form
    });
    
    const data = await res.json();
    console.log("Upload response:", JSON.stringify(data, null, 2));
}
run();
