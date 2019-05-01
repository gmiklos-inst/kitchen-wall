const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fileUpload = require('express-fileupload');

const photowallRouter = require('./routes/photowall');

const app = express();

// files setup
const filesDir = path.join(__dirname, 'files');

app.locals.filesDir = filesDir;

app.set('image limit', parseInt(process.env.PHOTOWALL_IMAGE_LIMIT) || 100);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/files', express.static(filesDir));
app.use('/', express.static(__dirname + '/frontend-dist'));

app.use(fileUpload());
app.use('/photowall/:namespace', photowallRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
