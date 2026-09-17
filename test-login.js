require('dotenv').config();
const { executeQuery } = require('./config/db');
const bcrypt = require('bcryptjs');

async function test() {
    const hash = await bcrypt.hash('123456', 10);
    console.log("Hash:", hash);
    const match = await bcrypt.compare('123456', hash);
    console.log("Match:", match);
}
test();
