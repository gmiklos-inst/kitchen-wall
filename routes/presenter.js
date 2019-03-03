const express = require('express');
const router = express.Router();
const path = require('path');
const { Hub, sseHub } = require('@toverux/expresse');

const fs = require('fs');
const hub = new Hub();

router.get('/', function(req, res) {
    const uploadDir = path.join(req.app.locals.filesDir, 'presenter');
    const uploadPath = path.join(uploadDir, "presentation.pdf");

    fs.access(uploadPath, fs.constants.F_OK | fs.constants.R_OK, (err) => {
        const params = { page: 'presenter' };

        if (!err) {
            params['startWith'] = 'files/presenter/presentation.pdf';
        }

        res.render('presenter/index', params);

    });
});

router.get('/upload', function(req, res) {
    res.render('presenter/upload', { page: 'upload' });
});

router.get('/upload/events', sseHub({ hub }), (req, res) => {
    res.sse.event('welcome', 'Welcome!');
});

router.post('/upload', (req, res) => {
    const file = req.files.upload;

    const uploadDir = path.join(req.app.locals.filesDir, 'presenter');
    const uploadPath = path.join(uploadDir, "presentation.pdf");

    file.mv(uploadPath, (err) => {
        if (err) {
            console.error(`Failed to upload file: ${err}`);
            return res.status(500).send(err);
        } else {
            hub.event('reload_presentation', "files/presenter/presentation.pdf");
        }

        res.status(200).send();
    });
});

module.exports = router;
