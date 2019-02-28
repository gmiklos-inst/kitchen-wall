var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { page: 'index' });
});

router.get('/upload', (req, res, next) => {
  console.log(res.locals);
  res.render('upload', { page: 'upload' });
});

router.post('/upload', (req, res, next) => {
  console.log(req.files);
  res.status(200).send();
});

module.exports = router;
