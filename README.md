S9 Build Tool
=============

A build tool for node.js app development.

This tool will watch any file you changed in project and refresh your browser when the source is built.

Saving your time and get more life.

### Dependiences

- Webpack 4
- Browser Sync
- Nunjucks Template Engine 

### Webpack Loader

- Babel
- Vue
- Less

### Webpack Plugin

- Hot Module Replacement

Installation
-------------

    git clone https://github.com/single9/s9-build-tool.git
    cd s9-build-tool
    npm link

Usage
------------

### Initial project

1. Create A new folder for project.

    mkdir <project_name>
    
2. Initialize the project.

    s9tool init [-n <project_name>]

3. Install dependencies

    npm install

4. Configuring your project

Edit file: `configs.js`

    const webpack = [
        {
            // Most of settings are same as Webpack.
            // But entry is a bit different with normal webpack config.
            // Your entry must be an Array to ensure Webpack's HMR Module
            // work correctly.
            entry: {
                entry: [
                    path.join(__dirname, 'src/views/assets/entry.js')
                ]
            },
            output: {
                path: path.resolve(__dirname, 'build/assets/js'),
                filename: '[name].bundle.js',
                // If you have more than one webpack config, you must ensure this path is unique.
                publicPath: '/public/js'
            },
            // You can add/override any settings you want.
            optimization: {
                splitChunks: {
                    cacheGroups: {
                        default: false,
                        vendor: {
                            test: /node_modules/,
                            name: 'vendor',
                            chunks: 'initial',
                        }
                    },
                }
            }
        }
    ];

    // This is Nunjucks config.
    const template = {
        src: './src/views/njk',     // Source location
        output: './build/views',    // Output location
        files: [
            {
                name: 'index',      // Output file name
                file: 'index.njk',  // Source file name
                render: {           // Render string
                    message: 'Yooo',
                    title: 'Hello!'
                }
            }
        ]
    };

    module.exports = {
        webpack,
        template
    };

5. Start development server

    s9tool dev

When development server is ready, your browser will auto-open immediately.

> The devlopment server is listening on port 3000. And you can change it.

    # change port
    PORT=3333 s9tool dev

6. Coding for fun!

### Build App

    s9tool build

You will get a new folder named `build`. This folder contains all your project need.

Commands
---------

    Usage: s9tool [options] [command]

    Commands:

    init [options]  Initialize the project
    dev             Development mode
    build           Build project

To-Do
---------

- SSR option
- Template engine hook