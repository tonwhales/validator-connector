import express from 'express';
import util from 'util';
import childProcess from 'child_process';
import fs from 'fs';
import tmp from 'tmp';
const exec = util.promisify(childProcess.exec);

async function handleCommand(args: { clientSecret: Buffer, serverPublic: Buffer, endpoint: string, command: string }) {

    const secretFile = tmp.fileSync();
    const publicFile = tmp.fileSync();
    try {
        fs.writeFileSync(secretFile.fd, args.clientSecret);
        fs.writeFileSync(publicFile.fd, args.serverPublic);
        let res = await exec('/usr/src/validator-engine-console/validator-engine-console -k ' + secretFile.name + ' -p ' + publicFile.name + ' -a ' + args.endpoint + ' -v 0 --cmd "' + args.command + '"', { timeout: 15000 });

        let stdout = res.stdout.split('\n');
        if (stdout[0].startsWith('connecting')) {
            stdout = stdout.slice(1);
        }
        if (stdout[0].startsWith('local key: ')) {
            stdout = stdout.slice(1);
        }
        if (stdout[0].startsWith('remote key: ')) {
            stdout = stdout.slice(1);
        }
        if (stdout[0].startsWith('conn ready')) {
            stdout = stdout.slice(1);
        }
        return {
            stderr: res.stderr,
            stdout: stdout.join('\n')
        };
    } finally {
        secretFile.removeCallback();
        publicFile.removeCallback();
    }
}

(async () => {
    const app = express();
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    app.get('/', (req, res) => {
        res.send('Welcome to Validator!');
    });
    app.post('/command', express.json(), (req, res) => {
        (async () => {
            try {
                let body = req.body as { clientSecret: string, serverPublic: string, endpoint: string, command: string };
                let response = await handleCommand({
                    clientSecret: Buffer.from(body.clientSecret, 'base64'),
                    serverPublic: Buffer.from(body.serverPublic, 'base64'),
                    endpoint: body.endpoint,
                    command: body.command
                });
                res.status(200).send({
                    ok: true,
                    response
                });
            } catch (e) {
                console.warn(e);
                res.status(500).send({ ok: false });
            }
        })()
    });
    await new Promise<void>((resolve) => app.listen(port, () => resolve()));
    console.log('🚀 Server started at http://localhost:' + port + '/');
})();