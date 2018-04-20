function error(err) {
    process.stderr.write(`\x1b[31m${err}\x1b[0m\n`);
}

function warn(warnings) {
    process.stdout.write(`\x1b[33m${warnings}\x1b[0m\n`);
}

function success(msg) {
    process.stdout.write(`\x1b[32m\n${msg}\n\x1b[0m`);
}

function info(msg) {
    process.stdout.write(`${msg}\n`);
}

module.exports = {
    error,
    warn,
    success,
    info
};