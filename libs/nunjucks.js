const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const log = require('./log');

class NunjucksLib {
    constructor (opts={}) {
        const tplConfig = this.tplConfig = require(process.cwd() + '/configs').template;

        this.src = tplConfig.src;
        this.outdir = tplConfig.output;
        this.njk = new nunjucks.Environment(new nunjucks.FileSystemLoader(this.src, {
            autoescape: false,
            watch: opts.watch,
        }));

        if (opts.watch === true) {
            this.recursiveWatch(this.src);
        }
        
        this.run();
    }

    run () {
        this.createOutDirectory();

        let tplFiles = this.tplConfig.files;
        for (let i=0; i<tplFiles.length; i++) {
            let tplFile = tplFiles[i];
            this.renderFile(tplFile);
        }
    }

    recursiveWatch (path) {
        fs.readdir(path, (err, files) => {
            if (err) return log.error(err);

            files.forEach((file) => {
                let target = path + '/' + file;

                fs.stat(target, (err, stats) => {
                    if (!stats.isDirectory()) {
                        fs.watchFile(target, () => {
                            log.warn(target, 'has changed!');
                            this.run();
                        });
                    } else {
                        this.recursiveWatch(target);
                    }
                });
            });
        });
    }

    renderFile (tplFile) {

        this.njk.render(tplFile.file, tplFile.render, (err, res) => {

            if (err) return log.error(err);

            let fileName = tplFile.name + '.html';
            let filePath = path.join(this.outdir, fileName);
        
            fs.writeFile(filePath, res, (err) => {
                if (err) log.error(err);
                log.success('Write ' + fileName + ' Done!');
            });
        });
    }

    createOutDirectory () {
        // Creates output directory if it's not exists.
        let outdirs = this.outdir.split('/');
        let dir = process.cwd();

        for (let i=1; i<outdirs.length; i++) {
            
            dir += '/' + outdirs[i];

            let exists = fs.existsSync(dir);

            if (!exists) {
                fs.mkdirSync(dir);
            }
        }
    }
}

module.exports = function (opts) {
    return new NunjucksLib(opts);
};