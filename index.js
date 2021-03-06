#!/usr/bin/env node

const fs = require('fs-extra');
const chokidar = require('chokidar');
const program = require('commander');
const child = require('child_process');
const log = require('./libs/log');
const wait = require('./libs/utils').wait;

const nunjucks = require('./libs/nunjucks');
const webpack = require('./libs/webpack');

const pack = require('./package.json');
const configs = require('./project.json') || pack.project;

const serverDir = configs.rootDir;

process.env.DEV = true;
process.env.VIEW_PATH = __dirname + '/build/';
process.env.PACKAGE_FILE_PATH = __dirname + '/package.json';

program.version(pack.version);

program.command('init')
    .description('Initialize the project')
    .option('-n, --name <name>', 'Project name')
    .option('-f, --force', 'Force run')
    .action((opts) => initProject(opts));

program.command('dev')
    .description('Development mode')
    .action(() => {
        const root = '.';
        const dest = root + '/' + configs.outDir || '';

        log.info('Empty `build` dir.');
        fs.emptyDirSync(dest);

        let devServer = server();

        function server () {
            const argv = [];
            const instance = child.fork(__dirname + '/development.js', argv, {
                silent: false
            });

            instance.on('message', (msg) => {
                if (msg === 'reload') {
                    return wait(1).then(() => require('./libs/browser-sync').reload());
                }

                log.info(msg);
            });

            instance.on('close', (code) => {
                if (code === 232) process.exit();
            });

            return instance;
        }

        chokidar.watch(process.cwd() + '/' + serverDir)
                .on('change', (filename) => restartServer(filename));

        chokidar.watch(process.cwd() + '/configs.js')
                .on('change', (filename) => restartServer(filename));

        async function restartServer (filename) {
            log.warn(filename + ' has changed.');
            // Kill server
            log.warn('Kill old dev server and restart after 2000 milliseconds');
            let isKill = await devServer.kill('SIGINT');

            if (isKill) log.success('Server killed.');
            else log.error('Server failed to kill.');

            // restart server
            await wait(1);
            devServer = server();
            
            log.success('The dev server is restarted.');
        }
    });

program.command('build')
    .description('Build project')
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

function initProject(opts) {

    const check = fs.existsSync('./src');

    if (check && !opts.force) {
        log.error('The `src` folder has already existed.');
        log.error('Use -f option to force run.');
        return;
    }

    log.info('Create source folders.');
    fs.copySync(__dirname + '/src', './src');

    log.info('Create configs file.');
    fs.copyFileSync(__dirname + '/configs.sample.js', './configs.js');

    log.info('Create package.json ...');

    if (typeof(opts.name) === 'string') {
        let sample = require(__dirname + '/package.sample.json');
            sample.name = opts.name;
        fs.outputJSONSync('./package.json', sample, {spaces: 2});
    } else {
        fs.copyFileSync(__dirname + '/package.sample.json', './package.json');
    }

    log.info('Create .gitignore ...');
    fs.copyFileSync(__dirname + '/gitignore.sample', './.gitignore');

    log.info('Create .eslintrc.json ...');
    fs.copyFileSync(__dirname + '/.eslintrc.json', './.eslintrc.json');

    log.info('Installing NPM packages...');

    child.exec('npm i', (err) => {
        if (err) return log.error('Install NPM packages fail.');

        log.success(' ------------------------------------------ ');
        log.success('|   Done! Your project is ready to rock!   |');
        log.success(' ------------------------------------------ ');
        log.warn('Remember to modify the `package.json` file!');
        log.info('Use `s9tool dev` for development.');
        log.info('Use `s9tool build` for build project.');
    });
}

function build(outDir=undefined) {
    process.env.NODE_ENV = 'production';
    
    const root = '.';
    const src = root + '/' + configs.rootDir;
    const dest = root + '/' + (outDir || configs.outDir);
    
    log.info('Empty `build` dir.');
    fs.emptyDirSync(dest);

    log.info('Copy server files to `build`');
    fs.copySync(src, dest);

    if (fs.existsSync(src + '/../../package.json')) {
        log.info('Copy package.json to `buid` folder.');
        fs.copySync(src + '/../../package.json', dest + '/package.json');
    }
    
    log.info('Building views...');

    nunjucks({watch: false});
    webpack({production: true}).build();
}   