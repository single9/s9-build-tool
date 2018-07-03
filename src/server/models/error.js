module.exports = function (err, req, res, next) {
    switch (err) {
        case '404':
            res.status(404);
            break;
        default:
            res.status(404);
            break;
    }

    console.error(err);
    res.send(err);
    next();
};