const webpack = require('webpack');
const WebpackDevMiddleware = require('webpack-dev-middleware');
const WebpackHotMiddleware = require('webpack-hot-middleware');
// const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const log = require('./log');
const wait = require('./utils').wait;

function genConfigs (configs) {
    
    let config = configsHelper(configs);
    const devMode = config.mode !== 'production';

    config.module = {
        rules: [
            {
                test: /\.js$/,
                exclude: function(modulePath) {
                    return /node_modules/.test(modulePath);
                },
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['babel-preset-env']
                    }
                }
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.(png|jpg|JPG|gif|svg|eot|ttf|woff|woff2)$/,
                loader: 'url-loader',
                options: {
                    limit: configs.limitValue || 10000,
                    name: '/imgs/[name].[ext]',
                }
            },
            {
                test: /\.less$/,
                use: [
                    devMode? 'style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader',
                    'less-loader'
                ]
            }
        ]
    };

    config.resolve = {
        alias: {
            'vue': 'vue/dist/vue.js'
        }
    };

    config.plugins = config.plugins.concat([
        new ProgressBarPlugin({
            format: 'Build [:bar] :percent (:elapsed seconds)',
            clear: false,
        }),
        new MiniCssExtractPlugin({
            filename: '../css/[name].css',
            chunkFilename: '../css/[id].css'
        })
    ]);

    if(devMode) {
        config.plugins = config.plugins.concat([
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
        ]);

        for (let e in config.entry) {
            if (typeof(config.entry[e].push) === 'undefined') continue;
            config.entry[e].push(__dirname + '/../node_modules/webpack-hot-middleware/client?path=/__webpack_hmr&timeout=2000&heartbeat=1000&reload=true');
        }
    } else {
        config.optimization = {
            minimizer: [
              new OptimizeCSSAssetsPlugin({})
            ]
        };
    }

    return config;
}

/**
 * Configs Helper
 * 
 * @param {object} configs 
 */
function configsHelper (configs) {
    return {
        entry: configs.entry,
        output: configs.output,
        resolve: configs.resolve,
        module: configs.module,
        /** @type Array */
        plugins: configs.plugins || [],
        /** @type String */
        mode: process.env.NODE_ENV || configs.mode || 'development',
    };
}

class WebpackLib {
    /**
     * Creates an instance of WebpackLib.
     * @param {object} [opts={}] 
     * @param {boolean} [opts.production=false]   Production mode?
     * @memberof WebpackLib
     */
    constructor (opts={}) {
        this.compliers = [];
        this.watchers = [];
        this.isProduction = opts.production || false;
        this.server = opts.server || undefined;

        this.genCompilers();
    }

    watch () {
        this.doAction((compiler) => {
            let watching = compiler.watch({
                aggregateTimeout: 300,
            }, webpackListener.bind(this));

            this.watchers.push(watching);
        });
    }

    stopWatching (callback) {
        let total = this.watchers.length;

        while (total > 0) {
            let watcher = this.watchers.shift();

            watcher.close(() => {
                total--;

                if (total <= 0) {
                    callback(true);
                }
            });
        }
    }

    build () {
        this.doAction((compiler) => {
            compiler.run(webpackListener.bind(this));
        });
    }

    genCompilers () {
        this.compliers = [];
        const webpackConfig = require(process.cwd() + '/configs').webpack;

        for (let i=0; i<webpackConfig.length; i++) {
            
            if (this.isProduction) {
                webpackConfig[i].mode = 'production';
            }

            let config = genConfigs(webpackConfig[i]);
            let compiler = webpack(config);

            if (this.server) {
                compiler.run((err) => {
                    if (err) {
                        return log.error(err);
                    }

                    this.webpackDevMiddleware = WebpackDevMiddleware(compiler, {
                        logLevel: 'warn',
                        publicPath: config.output.publicPath,
                        // writeToDisk: true
                    });

                    this.webpackHotMiddleware = WebpackHotMiddleware(compiler);

                    this.server.use(this.webpackDevMiddleware);
                    this.server.use(this.webpackHotMiddleware);

                    // Wait 2 seconds (timeout) and then notify client to reload page.
                    wait(2).then(() => {
                        this.webpackHotMiddleware.publish({
                            name: 'server',
                            action: 'sync',
                            time: 0,
                            hash: 'wqwodihaofaoefa',
                            warnings: [],
                            errors: [],
                        });
                    });
                });
            }
            
            this.compliers.push( compiler );

        }
    }

    reload (seconds=2) {
        // Wait a few seconds and then notify client to reload page.
        wait(seconds).then(() => {
            if (!this.webpackHotMiddleware) return;

            this.webpackHotMiddleware.publish({
                name: 'server',
                action: 'sync',
                time: 0,
                hash: 'wqwodihaofaoefa',
                warnings: [],
                errors: [],
            });
        });
    }

    sendServerBuildingMessage () {
        if (!this.webpackHotMiddleware) return;
        
        this.webpackHotMiddleware.publish({
            action: 'building',
            name: 'server file',
        });
    }

    /**
     * Do the Action.
     * 
     * @param {function} action 
     * @memberof WebpackLib
     */
    doAction (action) {
        this.compliers.forEach((compiler) => {
            action(compiler);
        });
    }
}

function webpackListener (err, stats) {
    if (err)
        return log.error(err);

    let jsonStats = stats.toJson();

    if (jsonStats.errors.length > 0)
        return log.error(jsonStats.errors);
    if (jsonStats.warnings.length > 0)
        log.warn(jsonStats.warnings);

    // log.info(stats.toString({
    //     chunks: false,  // Makes the build much quieter
    //     colors: true    // Shows colors in the console
    // }) + '\n');
}
/**
 * 
 * 
 * @param {object} [opts={}] 
 * @param {boolean} [opts.production=false]   Production mode?
 * @returns 
 */
module.exports = function (opts) {
    return new WebpackLib(opts);
};