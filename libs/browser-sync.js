const bs = require('browser-sync');
const PORT = process.env.PORT || 3000;

let instance;

module.exports = (function () {
    if (instance) return instance;

    bs.init({
        proxy: {
            target: 'localhost:' + PORT,
            ws: true
        }
    });

    return instance = bs;
})();