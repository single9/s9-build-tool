S9 Build Tool
=============

This is a build tool for myself.

- Webpack 4
- Nunjucks Template Engine

Installation
-------------

    git clone https://github.com/single9/s9-build-tool.git
    cd s9-build-tool
    npm link

Usage
------------

### Initial project

    s9tool init
    # re-initial
    s9tool init -f

### Development

    s9tool dev

> The devlopment server is listening on port 3000.

    # change port
    PORT=3333 s9tool dev

### Build

    s9tool build