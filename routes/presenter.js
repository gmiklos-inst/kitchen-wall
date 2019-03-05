const express = require('express');
const router = express.Router({ mergeParams: true });
const path = require('path');

const { Hub, sseHub } = require('@toverux/expresse');
const {namespaceDir} = require('./middleware');

const fs = require('fs');
const hub = new Hub();

router.use(namespaceDir('presenter'));

router.use((req, res, next) => {
    const presentationFileName = "presentation.pdf";
    req.presentationPath = path.join(req.uploadDir, presentationFileName);
    req.presentationUrl = path.join(req.uploadBase, presentationFileName);

    next();
});

router.get('/', function(req, res) {
    fs.access(req.presentationPath, fs.constants.F_OK | fs.constants.R_OK, (err) => {
        const params = { pageClass: 'page-presenter-index' };

        if (!err) {
            params['startWith'] = req.presentationUrl;
        }

        res.render('presenter/index', params);
    });
});

router.get('/upload', function(req, res) {
    res.render('presenter/upload', { pageClass: 'page-presenter-upload page-upload' });
});

router.get('/upload/events', sseHub({ hub }), (req, res) => {
    res.sse.event('welcome', 'Welcome!');
});

router.post('/upload', (req, res) => {
    const file = req.files.upload;

    file.mv(req.presentationPath, (err) => {
        if (err) {
            console.error(`Failed to upload file: ${err}`);
            return res.status(500).send(err);
        } else {
            hub.event('reload_presentation', req.presentationUrl);
        }

        res.status(200).send();
    });
});

module.exports = router;
