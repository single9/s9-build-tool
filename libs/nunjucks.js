const fs = require('fs');
const path = require('path');
const events = require('events');
const nunjucks = require('nunjucks');
const log = require('./log');

class NunjucksLib extends events {
    constructor (opts={}) {
        super();

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
                            log.warn(target + ' has changed!');
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

            if (err) return this.sendMessage({err, fileName});

            let fileName = tplFile.name + '.html';
            let filePath = path.join(this.outdir, fileName);
        
            fs.writeFile(filePath, res, (err) => {
                this.sendMessage({err, fileName});
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
    
    /**
     * Send Message
     * 
     * @param {object} paylad 
     * @param {any}    paylad.err       Errors
     * @param {string} paylad.fileName  fileName
     * @memberof NunjucksLib
     */
    sendMessage (paylad) {
        this.emit('message', paylad);
    }
}

module.exports = function (opts) {
    return new NunjucksLib(opts);
};