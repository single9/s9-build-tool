const util = require('util');
const dateFormat = require('dateformat');

let _socket = {};

let log = {
    name: 'App'
};

['info', 'warn', 'error'].forEach((val) => {
    log[val] = function (...content) {
        let str = util.format.apply(null, content);
        let record_time = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss.l', true);
        str = '[' + record_time + '] ' + '[' + val + '] ' + str;
        console[val](str);
        // pushToSocket({id: 0, type: 'Master', status: val, msg: str});
    };
});

function pushToSocket (msg) {
    for (let s in _socket) {
        _socket[s].emit('logs', msg);
    }
}

module.exports = log;
module.exports.setSocketList = function (socket) {
    if (typeof(_socket) === 'object') {
        _socket = socket;
    }
};