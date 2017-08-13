const path = require('path');
const writeFile = require('write');
const outdent = require('outdent');
const makeDir = require('make-dir');
const pathExists = require('path-exists');
const Conf = require('conf');
const envPaths = require('env-paths');
const {Docker} = require('node-docker-api');
const {isValid, tldExists} = require('tldjs');

const config = new Conf();
const docker = new Docker({
    socketPath: '/var/run/docker.sock'
});

module.exports.init = opts => {
    opts = Object.assign({
        mysqlDockerImage: 'abiosoft/caddy',
        mysqlDataDirectory: path.join(envPaths('shelf').data, 'mysql'),
        caddyDataDirectory: path.join(envPaths('shelf').data, 'caddy')
    }, opts);

    return new Promise(async (resolve, reject) => {
        if (config.get('installed')) {
            return reject(new Error('Shelf is already installed.'));
        }

        const startMySQL = () => {
            return docker.container.create({
                Image: opts.mysqlDockerImage,
                Binds: [opts.mysqlDataDirectory + ':/var/lib/mysql']
            })
            .then(container => container.start())
            .then(container => container.status());
        };

        const startLoadBalancer = () => {
            return docker.container.create({
                Image: 'abiosoft/caddy',
                Binds: [
                    opts.caddyDataDirectory + '/Caddyfile:/etc/Caddyfile',
                    opts.caddyDataDirectory + '/vhosts:/root/caddy/vhosts'
                ],
                PortBindings: {
                    '80/tcp': [{
                        HostPort: '80'
                    }],
                    '443/tcp': [{
                        HostPort: '80'
                    }]
                }
            })
            .then(container => container.start())
            .then(container => container.status());
        };

        await startMySQL();
        await startLoadBalancer();

        resolve('Shelf inititilised.');
    });
};

module.exports.start = opts => {
    // NOTE: This is to start the api server and the admin/user webui
    return opts;
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
            docker.container.create({
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
