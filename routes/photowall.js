const express = require('express');
const router = express.Router({mergeParams: true});
const path = require('path');
const fs = require('fs');
const uuid = require('uuid/v1');

const {Hub, sseHub} = require('@toverux/expresse');

const hub = new Hub();

router.use((req, res, next) => {
    const namespace = req.params.namespace || 'default';
    const namespaceDir = path.join(res.app.locals.filesDir, 'photowall', namespace);

    fs.mkdir(namespaceDir, {recursive: true}, (err) => {
        if (err) {
            res.status(500).send(err);
        } else {
            next();
        }
    });

    req.uploadBase = '/files/' + path.relative(req.app.locals.filesDir, namespaceDir);
    req.uploadDir = namespaceDir;
});

/* GET home page. */
router.get('/', function (req, res) {
    fs.readdir(req.uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send(err);
        }

        const actualFiles = files
            .map(file => ({
                name: file, stat: fs.lstatSync(path.join(req.uploadDir, file))
            }))
            .filter(file => file.stat.isFile())
            .sort((a, b) => b.stat.ctimeMs - a.stat.ctimeMs)
            .map(file => path.join(req.uploadBase, file.name));

        res.render('photowall/index', { pageClass: 'page-photowall-index', files: actualFiles });
    });
});

router.get('/upload/events', sseHub({hub}), (req, res) => {
    res.sse.event('welcome', 'Welcome!');
});

router.get('/upload', (req, res) => {
    res.render('photowall/upload', {pageClass: 'page-photowall-upload page-upload'});
});

router.post('/upload', (req, res) => {
    for (const file of Object.values(req.files)) {
        const finalName = `upload-${uuid()}.jpg`;

        file.mv(path.join(req.uploadDir, finalName), (err) => {
            if (err) {
                return res.status(500).send(err);
            } else {
                hub.event('new_file', path.join(req.uploadBase, finalName));
            }
        });
    }

    res.status(200).send();
});

module.exports = router;
