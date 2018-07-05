const webpack = require('webpack');
const WebpackDevMiddleware = require('webpack-dev-middleware');
const WebpackHotMiddleware = require('webpack-hot-middleware');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
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
                    return /node_modules/.test(modulePath) && !/\.vue\.js/.test(modulePath);
                },
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['babel-preset-env']
                    },
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
                    'vue-style-loader',
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
            clear: true,
        }),
        new MiniCssExtractPlugin({
            filename: '../css/[name].css',
            chunkFilename: '../css/[name].css'
        }),
        new VueLoaderPlugin(),
    ]);

    if(devMode) {
        config.plugins = config.plugins.concat([
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
        ]);

        for (let e in config.entry) {
            if (typeof(config.entry[e].push) === 'undefined') continue;
            config.entry[e].push(__dirname + '/../node_modules/webpack-hot-middleware/client?name='+ config.name +'&path=/__webpack_hmr_'+  config.name + '&timeout=5000&heartbeat=1000&reload=true');
        }
    } else {
        config.performance = { 
            hints: false     // disable warning
        };

        Object.assign(config.optimization, {
            minimizer: [
                new UglifyJsPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: true
                  }),
                new OptimizeCSSAssetsPlugin({})
            ]
        });
    }

    return config;
}

/**
 * Configs Helper
 * 
 * @param {object} configs 
 * @return {{
        entry: any,
        output: any,
        resolve: any,
        module: any,
        plugins: [],
        mode: string,
        optimization: any
    }}
 */
function configsHelper (configs) {

    return Object.assign({
        /** @type Array */
        plugins: [],
        /** @type String */
        mode: process.env.NODE_ENV || configs.mode || 'development',
        optimization: {}
    }, configs);
}

class WebpackLib {
    /**
     * Creates an instance of WebpackLib.
     * @param {object} [opts={}] 
     * @param {boolean} [opts.production=false]   Production mode?
     * @memberof WebpackLib
     */
    constructor (opts={}, callback) {
        this.compliers = [];
        this.watchers = [];
        this.isProduction = opts.production || false;
        this.server = opts.server || undefined;
        this.WebpackHotMiddlewares = [];

        this.genCompilers(callback);
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

    genCompilers (callback) {
        this.compliers = [];
        const webpackConfig = require(process.cwd() + '/configs').webpack;
        let errs = [];

        for (let i=0; i<webpackConfig.length; i++) {
            
            if (this.isProduction) {
                webpackConfig[i].mode = 'production';
            }

            let config = genConfigs(webpackConfig[i]);
            let compiler = webpack(config);

            if (this.server) {

                this.server.use(WebpackDevMiddleware(compiler, {
                    logLevel: 'warn',
                    publicPath: config.output.publicPath,
                }));

                this.WebpackHotMiddlewares[i] = WebpackHotMiddleware(compiler, {
                    name: config.name,
                    path: '/__webpack_hmr_'+  config.name,
                    timeout: 5000,
                    heartbeat: 1000
                });

                this.server.use(this.WebpackHotMiddlewares[i]);
            }

            this.compliers.push( compiler );
            if ((this.compliers.length >= webpackConfig.length) && callback) callback(errs);
        }
    }

    sendServerBuildingMessage () {
        this.WebpackHotMiddlewares.forEach((middleware) => {
            if (!middleware || !middleware.publish) return;
            middleware.publish({
                action: 'building',
                name: 'server file',
            });
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

    if (process.env.NODE_ENV === 'production') {
        log.info(stats.toString({
            chunks: false,  // Makes the build much quieter
            colors: true    // Shows colors in the console
        }));
    }
}

/**
 * WebpackLib
 * 
 * @param {object}    [opts={}] 
 * @param {boolean}   [opts.production=false]   Production mode?
 * @param {function([]):void}  callback         Callback function
 * @returns WebpackLib
 */
module.exports = function (opts, callback) {
    return new WebpackLib(opts, callback);
};