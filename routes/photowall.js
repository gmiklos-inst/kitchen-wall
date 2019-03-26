const express = require('express');
const router = express.Router({mergeParams: true});
const path = require('path');
const fs = require('fs');
const uuid = require('uuid/v1');

const {namespaceDir} = require('./middleware');

router.use(namespaceDir('photowall'));

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

        res.render('photowall/index', { pageClass: 'page-photowall-index', title: 'Photo wall', files: actualFiles, namespace: req.params.namespace });
    });
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
                const io = req.app.get('io.photowall');
                io.in(req.params.namespace).emit('new_file', path.join(req.uploadBase, finalName));
            }
        });
    }

    res.status(200).send();
});

module.exports = router;
