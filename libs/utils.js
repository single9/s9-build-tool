let wait = function (seconds=1) {
    return new Promise((resolve) => {
        let st = setTimeout(() => {
            clearTimeout(st);
            resolve(true);
        }, seconds * 1000);
    });
};

module.exports.wait = wait;