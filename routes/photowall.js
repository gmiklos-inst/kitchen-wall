const express = require('express');
const router = express.Router();
const path = require('path');
const { Hub, sseHub } = require('@toverux/expresse');

const fs = require('fs');

const hub = new Hub();

/* GET home page. */
router.get('/', function(req, res) {
    fs.readdir(res.app.locals.filesDir, (err, files) => {
        if (err) {
            return res.status(500).send(err);
        }

        const actualFiles = files.filter(file =>
            fs.lstatSync(path.join(res.app.locals.filesDir, file)).isFile()
        );

        res.render('photowall/index', { pageClass: 'page-photowall-index', files: actualFiles });
    });
});

router.get('/upload/events', sseHub({ hub }), (req, res) => {
    res.sse.event('welcome', 'Welcome!');
});

router.get('/upload', (req, res) => {
    res.render('photowall/upload', { pageClass: 'page-photowall-upload page-upload' });
});

router.post('/upload', (req, res) => {
    for (const file of Object.values(req.files)) {
        file.mv(path.join(req.app.locals.filesDir, file.name), (err) => {
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
