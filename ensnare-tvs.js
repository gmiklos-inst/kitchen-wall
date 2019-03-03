const SsdpClient = require('node-ssdp').Client;
const ssdpClient = new SsdpClient();
const LgClient = require('lgtv2');
const inquirer = require('inquirer');
const os = require('os');
const Netmask = require('netmask').Netmask;

const publicAddresses = Object.values(os.networkInterfaces())
            .flatMap(addresses =>
                addresses.filter(address => !address.internal && address.family === 'IPv4')
            )
            .map(({address, cidr}) => ({ address, block: new Netmask(cidr) }));

const LG_NAME_HEADER = 'DLNADEVICENAME.LGE.COM';

const foundTvsMap = new Map();


ssdpClient.on('response', (headers, statusCode, rinfo) => {
    if (headers[LG_NAME_HEADER]) {
        const name = headers[LG_NAME_HEADER];
        foundTvsMap.set(rinfo.address, decodeURI(name))
    }
});

ssdpClient.search('ssdp:all');

console.log("Finding TVs...");

setTimeout(() => {
    const foundTvs = Array.from(foundTvsMap.entries()).map(([address, name]) => ({value: {address, name}, name}));

    inquirer.prompt([
        {
            type: 'checkbox',
            message: 'Select TVs to ensnare',
            name: 'tvs',
            choices: foundTvs,
            validate: function (answer) {
                console.log(answer);

                if (answer.length < 1) {
                    return 'You must choose at least one TV.';
                }

                return true;
            }
        }
    ]).then(answers => {
        const tvClients = answers.tvs.map(tv => {
            let tvClient = new LgClient({url: `ws://${tv.address}:3000`});

            const publicAddress = (publicAddresses.find(publicAddress => publicAddress.block.contains(tv.address)) || publicAddresses[0]).address;
            const targetUrl = `http://${publicAddress}:3000/presenter`;

            return tvClient
                    .on('error', err => console.error(`Error on ${tv.name} / ${tv.address}: ${err}`))
                    .on('prompt', () => console.log(`${tv.name} / ${tv.address}: asking for confirmation`))
                    .on('connecting', () => console.log(`Connecting to ${tv.name} / ${tv.address}...`))
                    .on('connect', () => {
                        console.log(`Connected to ${tv.name} / ${tv.address}`);

                        tvClient.request('ssap://system.launcher/open', {target: targetUrl}, (err, res) => {
                            if (err) {
                                console.error(`Unable to open browser on ${tv.name} / ${tv.address}: ${error}`);
                            } else {
                                console.log(`Sent browser request to ${tv.name} / ${tv.address}: ${JSON.stringify(res)}`);
                            }
                        });
                    });
            }
        );

        setTimeout(() => tvClients.forEach(client => client.disconnect()), 30000);
    });

}, 5000);