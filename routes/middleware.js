const path = require('path');
const fs = require('fs');

module.exports.namespaceDir = function(name) {
    return (req, res, next) => {
        const namespace = req.params.namespace || 'default';
        const namespaceDir = path.join(res.app.locals.filesDir, name, namespace);

        fs.mkdir(namespaceDir, {recursive: true}, (err) => {
            if (err) {
                res.status(500).send(err);
            } else {
                next();
            }
        });

        req.uploadBase = '/files/' + path.relative(req.app.locals.filesDir, namespaceDir);
        req.uploadDir = namespaceDir;
    };
}