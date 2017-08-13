#!/usr/bin/env node
'use strict';
const meow = require('meow');
const shelf = require('.');

const cli = meow(`
	Usage
	  $ shelf [input]

	Options
	  --foo    Lorem ipsum [Default: false]

	Examples
	  $ shelf adduser xo
	  Finished setting up user xo.

	  $ shelf adddomain xo example.com
	  Finished setting up domain example.com.
	  Container running.
	  done
`, {
    boolean: [
        'init'
    ]
});

const command = cli.input[0];
const flags = cli.flags;

if (flags.init === true) {
    shelf.init().then(msg => console.log(msg)).catch(err => console.error(err.message));
} else if (command === 'adddomain' || command === 'deldomain') {
    const username = cli.input[1];
    const domain = cli.input[2];
    shelf.adddomain({
        username,
        domain
    }).then(msg => console.log(msg)).catch(err => console.error(err.message));

    shelf.createContainer({
        user: {
            _id: 100,
            username
        },
        domain
    }).then(msg => console.log(msg)).catch(err => console.error(err.message));
} else if (command === 'adduser' || command === 'deluser') {
    const username = cli.input[1];

    shelf.adduser({
        username
    }).then(msg => console.log(msg)).catch(err => console.error(err.message));

    // @NOTE: Check ~/code/shelf-old for code
    // 1. Create/Delete user account
    // 2. Add/Remove containers linked to their account
    // 3. Add/Remove vhost file from Caddy
    // 4. Reload Caddy
    // 5. Add/Remove their sftp account
} else {
    cli.showHelp();
}
