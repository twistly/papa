const path = require('path');
const writeFile = require('write');
const outdent = require('outdent');
const makeDir = require('make-dir');
const pathExists = require('path-exists');
const {Docker} = require('node-docker-api');
const {isValid, tldExists} = require('tldjs');

const docker = new Docker({
    socketPath: '/var/run/docker.sock'
});

//
// class User {
//     constructor(opts) {
//         this._id = uuidv4();
//         this.username = opts.username;
//         this.domains = opts.domains;
//     }
// }
//
// class Domain {
//     constructor(opts) {
//         this._id = uuidv4();
//         this.url = opts.url;
//     }
// }
//
// const domain = new Domain({
//     url: 'example.com'
// });
// const user = new User({
//     username: 'user123',
//     domains: [
//         domain
//     ]
// });
//
// log(user);

module.exports.start = opts => {
    return opts;
    //
    // docker run --name some-mariadb -v /var/lib/mysql:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mariadb:tag
    // docker run -d \
    // -p 80:80 \
    // -p 443:443 \
    // -v $(pwd)/caddy/Caddyfile:/etc/Caddyfile \
    // -v $(pwd)/caddy/vhosts:/root/caddy/vhosts \
    // --name=load-balancer \
    // abiosoft/caddy
};

module.exports.adddomain = opts => {
    return new Promise(async (resolve, reject) => {
        const {username, domain} = opts;

        if (username && domain) {
            // Checks if domain is valid and tld exists.
            const isDomainValid = await Promise.all([isValid(domain), tldExists(domain)]).then(results => !results.includes(false));

            if (!isDomainValid) {
                return reject(new Error(`${domain} is not a valid domain.`));
            }

            const basePath = path.join(__dirname, '/root/sites');
            const sitePath = path.join(basePath, `${username}/${domain}`);
            const exists = await pathExists(sitePath);

            if (exists) {
                return reject(new Error('Domain path already exists.'));
            }

            await makeDir(sitePath + '/www');
            await makeDir(sitePath + '/logs');
            return resolve(`Finished setting up domain ${domain}.`);
        }
        return reject(new Error('Username or domain was missing from adddomain.'));
    });
};

module.exports.createContainer = opts => {
    return new Promise((resolve, reject) => {
        const Image = opts.image || 'abiosoft/caddy:php';
        const {user, domain} = opts;

        if (user && domain) {
            return docker.container.create({
                Image,
                Labels: {
                    domain,
                    user: String(user._id)
                },
                Binds: [
                    path.join(__dirname, '/caddy/php/Caddyfile') + ':/etc/Caddyfile',
                    path.join(__dirname, `/root/sites/${user.username}/${domain}/www`) + ':/srv',
                    path.join(__dirname, `/root/sites/${user.username}/${domain}/logs`) + ':/logs'
                ]
            })
            .then(container => container.start())
            .then(container => container.status())
            .then(async container => {
                const {data} = container;

                const ip = data.NetworkSettings.IPAddress;
                const containerId = data.Id;

                const template = outdent`
                    # Host ${containerId}
                    # User ${user._id}
                    http://${domain} {
                        tls off
                        log stdout
                        errors stdout
                        proxy / ${ip}:2015 {
                            transparent
                        }
                    }
                `;

                const basePath = path.join(__dirname, '/caddy/vhosts');
                const vhostPath = path.join(basePath, `/${domain}`);
                const exists = await pathExists(vhostPath);

                if (exists) {
                    console.log(`Overriding the Caddy file for ${domain} at ${vhostPath}.`);
                }

                // Create basePath incase it's a new install.
                await makeDir(basePath);
                writeFile(vhostPath, template).then(() => {
                    console.log('done');
                });
                return resolve('Container running.');
            });
        }
        return reject(new Error('Username or domain was missing from createContainer.'));
    });
};

module.exports.adduser = opts => {
    return new Promise(async (resolve, reject) => {
        const {username} = opts;

        if (username) {
            const basePath = path.join(__dirname, '/root/sites');
            const userPath = path.join(basePath, `/${username}`);
            const exists = await pathExists(userPath);

            if (exists) {
                return reject(new Error('User path already exists.'));
            }
            await makeDir(userPath);
            resolve(`Finished setting up user ${username}.`);
        }
    });
};
