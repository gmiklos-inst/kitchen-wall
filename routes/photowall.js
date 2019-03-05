const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const uuid = require('uuid/v1');

const {Hub, sseHub} = require('@toverux/expresse');

const hub = new Hub();

/* GET home page. */
router.get('/', function (req, res) {
    fs.readdir(res.app.locals.filesDir, (err, files) => {
        if (err) {
            return res.status(500).send(err);
        }

        const actualFiles = files
            .map(file => ({
                name: file, stat: fs.lstatSync(path.join(res.app.locals.filesDir, file))
            }))
            .filter(file => file.stat.isFile())
            .sort((a, b) => b.stat.ctimeMs - a.stat.ctimeMs)
            .map(file => file.name);

        res.render('photowall/index', {pageClass: 'page-photowall-index', files: actualFiles});
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
        file.mv(path.join(req.app.locals.filesDir, `upload-${uuid()}.jpg`), (err) => {
            if (err) {
                return res.status(500).send(err);
            } else {
                hub.event('new_file', file.name);
            }
        });
    }

    res.status(200).send();
});

module.exports = router;
