const log = require('./libs/log');
const wait = require('./libs/utils').wait;

const nunjucks = require('./libs/nunjucks');
const webpack = require('./libs/webpack');

const PORT = process.env.PORT || 3000;

let _webpack;

async function development () {
    process.env.NODE_ENV = 'development';
    
    // start server
    let dev = runApp();
    log.info('Server Started');

    _webpack = webpack({production: false, server: dev});

    dev.listen(PORT);
    
    let njk = nunjucks({watch: true});

    njk.on('message', (msg) => {
        let err = msg.err;
        let fileName = msg.fileName;

        if (err) log.error(fileName + '\n' + err);

        log.success('Write ' + fileName + ' Done!');

        process.send('reload');
    });
}

function runApp() {
    return require(process.cwd() + '/src/server/index.js');
}

// process.stdin.resume();//so the program will not close instantly

if (module.parent) {
    module.exports = development;
} else {
    (function () {
        development();

        async function exitHandler(options, err) {
            if (options.cleanup) {
                _webpack.sendServerBuildingMessage();
                await wait(1);
            }
            if (err) console.log(err.stack);
            if (options.exit) process.exit();
        }
        
        //do something when app is closing
        process.on('exit', exitHandler.bind(null,{cleanup:true}));
        
        //catches ctrl+c event
        process.on('SIGINT', exitHandler.bind(null, {cleanup:true, exit:true}));
    })();
}