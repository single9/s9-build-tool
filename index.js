#!/usr/bin/env node

const fs = require('fs-extra');
const program = require('commander');
const child = require('child_process');
const log = require('./libs/log');

const nunjucks = require('./libs/nunjucks');
const webpack = require('./libs/webpack');

const pack = require('./package.json');
const configs = require('./project.json') || pack.project;

process.env.DEV = true;
process.env.VIEW_PATH = __dirname + '/build/';
process.env.PACKAGE_FILE_PATH = __dirname + '/package.json';

const serverDir = configs.rootDir;
let ignore = ['.git', /node_modules/, /desktop/];

if (configs.ignore) {
    ignore = ignore.concat(configs.ignore);
}

let isChange = false;

program.version(pack.version);

program.command('init')
    .description('Initialize the project.')
    .action(() => initProject());

program.command('dev')
    .description('Development mode.')
    .action(() => runDev());

program.command('build')
    .description('Build project.')
    .action(() => build());

program.parse(process.argv);

// if args < 0, print help.
if (program.args.length < 1) {
    outputHelp();
}

function outputHelp() {
    program.outputHelp(); // Output Help
    process.exit();
}

function initProject() {
    log.info('Create source folders.');

    fs.mkdirsSync('./src/server');
    fs.mkdirsSync('./src/views');
    fs.mkdirsSync('./src/views/njk');
    fs.mkdirsSync('./src/views/assets');

    log.info('Create configs file.');
    fs.copyFileSync(__dirname + '/configs.sample.js', './configs.js');

    log.info('Create .gitignore file.');
    fs.copyFileSync(__dirname + '/gitignore.sample', './.gitignore');

    log.success('Done! Your project is ready to rock!');
}

async function runDev() {
    process.env.NODE_ENV = 'development';
    
    // start server
    let dev = runApp();
    log.info('Server Started');
    // watch all source files
    fs.watch(process.cwd() + '/' + serverDir, {
        recursive: true
    }, async (event, filename) => {
        if (ignore.indexOf(filename) > -1) return;
        if (event === 'change' && isChange === false) {
            isChange = true;

            log.warn(filename + ' changed.');
            // Kill server
            log.warn('Kill old dev server and restart after 500 milliseconds');
            await dev.kill('SIGINT');
            // restart server
            let re = setTimeout(() => {
                dev = runApp();

                log.success('The dev server is restarted.');

                isChange = false;
                clearTimeout(re);
            }, 500);
        }
    });

    nunjucks({watch: true});
    webpack({production: false}).watch();
}

async function build() {
    let root = '.';
    let src = root + '/' + configs.rootDir;
    let dest = root + '/' + configs.outDir;
    
    log.info('Remove `build` dir.');
    await fs.remove(dest);

    await wait(2);

    log.info('Copy server files to `build`');
    await fs.copySync(src, dest);

    if (fs.existsSync(src + '/../../package.json')) {
        log.info('Copy package.json to `buid` folder.');
        await fs.copySync(src + '/../../package.json', dest + '/package.json');
    }
    
    log.info('Building views...');

    nunjucks({watch: false});
    webpack({production: true}).build();
}

function wait (seconds=1) {
    return new Promise((resolve) => {
        let st = setTimeout(() => {
            clearTimeout(st);
            resolve(true);
        }, seconds * 1000);
    });
}

function runApp() {
    const argv = [];
    const run = child.fork(process.cwd() + '/src/server/index.js', argv, {
        silent: false
    });

    run.on('message', log.info);

    run.on('close', (code) => {
        if (code === 232) process.exit();
    });

    return run;
}