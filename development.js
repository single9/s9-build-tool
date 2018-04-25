const log = require('./libs/log');
const wait = require('./libs/utils').wait;

const nunjucks = require('./libs/nunjucks');
const webpack = require('./libs/webpack');

let _webpack;

function development () {
    process.env.NODE_ENV = 'development';
    
    // start server
    let dev = runApp();
    log.info('Server Started');

    nunjucks({watch: true});
    _webpack = webpack({production: false, server: dev});

    dev.listen(process.env.PORT || 3000);
}

function runApp() {
    return require(process.cwd() + '/src/server/index.js');
}

// process.stdin.resume();//so the program will not close instantly

async function exitHandler(options, err) {
    if (options.cleanup) {
        _webpack.reload();
        await wait(1);
    }
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {cleanup:true, exit:true}));

if (module.parent) {
    module.exports = development;
} else {
    (function () {
        development();
    })();
}