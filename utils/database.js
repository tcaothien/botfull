const fs = require('fs');
const path = './data/users.json';

function loadUserData() {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function saveUserData(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = { loadUserData, saveUserData };
