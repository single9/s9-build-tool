const path = require('path');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const express = require('express');
const app = express();
const log = require('./log-helper.js');

// PORT
const PORT = process.env.PORT || 3000;
// ROOT Directory path
const ROOT = (process.env.DEV? __dirname + '/../../build' : __dirname);
// View path
const VIEW_PATH = path.join(ROOT, 'views');
// View engine
// app.set('views', VIEW_PATH);
// app.set('view engine', 'html');

app.set('trust proxy', true);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet());

// Static files
app.use('/public', express.static(path.join(VIEW_PATH, '..', 'assets')));

app.get('/', (req, res, next) => {
    res.sendFile(VIEW_PATH + '/index.html');
});

app.get('*', (req, res, next) => {
    if (req.url === '/__webpack_hmr') return next();
    if (/\.hot-update/.test(req.url)) return next();
    res.status(404);
    next('404');
});

// Error Handler
app.use((err, req, res, next) => {
    res.send(err);
    next();
});

if (module.parent) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        log.info('Server started.');
    });
}