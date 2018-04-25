const prefix = '[\x1b[36mbuild-tool\x1b[0m]';

function error(err) {
    process.stderr.write(`${prefix} \x1b[31m${err}\x1b[0m\n\r`);
}

function warn(warnings) {
    process.stdout.write(`${prefix} \x1b[33m${warnings}\x1b[0m\n\r`);
}

function success(msg) {
    process.stdout.write(`${prefix} \x1b[32m${msg}\x1b[0m\n\r`);
}

function info(msg) {
    process.stdout.write(`${prefix} ${msg}\n\r`);
}

module.exports = {
    error,
    warn,
    success,
    info
};