var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var mysql = require('../database');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
// 登录页
router.get('/login', function (req, res, next) {
  res.render('login', { message: '' })
})
// 登陆信息验证
router.post('/login', function (req, res, next) {
  var name = req.body.name;
  var password = req.body.password;
  var hash = crypto.createHash('md5');
  hash.update(password);
  password = hash.digest('hex');
  var query = 'SELECT * FROM author WHERE authorName=' + mysql.escape(name) + 'AND authorPassword=' + mysql.escape(password);
  mysql.query(query, function (err, rows, fields) {
    if (err) {
      console.log('error', err);
      return;
    }
    var user = rows[0];
    if (!user) {
      res.render('login', { message: '用户名或密码错误！' });
      return;
    }
    req.session.userSign = true;
    req.session.userID = user.authorID
    res.redirect('/');
  })
})

module.exports = router;
