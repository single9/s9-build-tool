const path = require('path');

const webpack = [
    {
        entry: {
            entry: [
                path.join(__dirname, 'src/views/assets/entry.js')
            ]
        },
        output: {
            path: path.resolve(__dirname, 'build/assets/js'),
            filename: '[name].bundle.js',
            publicPath: '/public/js'
        }
    }
];

const template = {
    src: './src/views/njk',
    output: './build/views',
    files: [
        {
            name: 'index', file: 'index.njk',
            render: {
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