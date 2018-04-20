const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const log = require('./log');

function genConfigs (configs) {
    const extractLESS = new ExtractTextPlugin({
        filename: '../css/[name].css',
    });

    let config = configsHelper(configs);

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
                use: extractLESS.extract({
                    fallback: 'style-loader',
                    use: ['css-loader', 'less-loader']
                }),
            }
        ]
    };

    config.resolve = {
        alias: {
            'vue': 'vue/dist/vue.js'
        }
    };

    config.plugins = [
        extractLESS
    ];

    return config;
}

function configsHelper (configs) {
    return {
        entry: configs.entry,
        output: configs.output,
        resolve: configs.resolve,
        module: configs.module,
        plugins: configs.plugins || [],
        mode: configs.mode || process.env.NODE_ENV || 'development',
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
        const webpackConfig = require(process.cwd() + '/configs').webpack;

        for (let i=0; i<webpackConfig.length; i++) {
            
            let config = genConfigs(webpackConfig[i]);

            if (this.isProduction) {
                config.mode = 'production';
                // handleWarnings('Run in production mode.');
            }

            this.compliers.push( webpack(config) );
        }
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

    log.info(stats.toString({
        chunks: false,  // Makes the build much quieter
        colors: true    // Shows colors in the console
    }) + '\n');
}

module.exports = function (build=false) {
    return new WebpackLib(build);
};