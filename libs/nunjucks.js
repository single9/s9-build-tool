const fs = require('fs');
const chokidar = require('chokidar');
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
            noCache: true
        }), {
            trimBlocks: true,
            lstripBlocks: true
        });

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
        let watcher = chokidar.watch(path);

        watcher.on('change', (path) => {
            log.warn(path + ' has changed!');
            this.run();
            this.sendMessage({fileName: path});
        });
    }

    renderFile (tplFile) {

        this.njk.render(tplFile.file, tplFile.render, (err, res) => {

            let fileName = tplFile.name + '.html';
            let filePath = path.join(this.outdir, fileName);
        
            if (err) return this.sendMessage({err, fileName});
            
            fs.writeFile(filePath, res, (err) => {
                if (err) this.sendMessage({err, fileName});
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