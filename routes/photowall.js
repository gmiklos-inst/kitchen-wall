const express = require('express');
const router = express.Router({mergeParams: true});
const path = require('path');
const fs = require('fs');
const uuid = require('uuid/v1');

const {namespaceDir} = require('./middleware');

router.use(namespaceDir('photowall'));

router.get('/', function (req, res) {
    const imageLimit = req.app.get('image limit');

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
            .slice(0, imageLimit)
            .map(file => path.join(req.uploadBase, file.name));

        res.json({ files: actualFiles, imageLimit });
    });
});

router.post('/upload', (req, res) => {
    for (const [filename, file] of Object.entries(req.files)) {
        const ext = path.extname(filename);
        const finalName = `upload-${uuid()}${ext}`;

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
