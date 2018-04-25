const bs = require('browser-sync');
const PORT = process.env.PORT || 3000;

let instance;

module.exports = (function () {
    if (instance) return instance;

    bs.init({
        proxy: {
            target: 'localhost:' + PORT, // can be [virtual host, sub-directory, localhost with port]
            ws: true // enables websockets
        }
    });

    return instance = bs;
})();