var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var mysql = require('../database');

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
    req.session.user = user;
    res.redirect('/');
  })
})

/* 首页 */
router.get('/', function (req, res, next) {
  // 通过 page 实现切换分页页面
  var page = req.query.page || 1;
  var start = (page - 1) * 8;
  var end = page * 8;
  var queryCount = 'SELECT COUNT(*) AS articleNum FROM article';
  var queryArticle = 'SELECT * FROM article ORDER BY articleID DESC LIMIT ' + start + ',' + end;
  mysql.query(queryArticle, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return
    }
    var articles = rows;
    // console.log(articles);

    articles.forEach(function (ele) {
      var year = ele.articleTime.getFullYear();
      var month = ele.articleTime.getMonth() + 1 + 1 > 10 ? ele.articleTime.getMonth() + 1 : '0' + ele.articleTime.getMonth();
      var date = ele.articleTime.getDate() + 1 > 10 ? ele.articleTime.getDate() : '0' + ele.articleTime.getDate();
      ele.articleTime = year + '-' + month + '-' + date
    });

    mysql.query(queryCount, function (err, rows, fields) {
      // 文章总数量
      var articleNum = rows[0].articleNum;
      // console.log(articleNum);
      // 分页数
      var pageNum = Math.ceil(articleNum / 8);
      res.render('index', {
        articles: articles,
        user: req.session.user,
        pageNum: pageNum,
        page: page,
        articleNum: articleNum
      });
    })
  })

});

/* 文章内容页 */
router.get('/article/:articleID', function (req, res, next) {
  var articleID = req.params.articleID;
  var query = 'SELECT * FROM article WHERE articleID=' + mysql.escape(articleID);
  mysql.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return
    }
    // console.log(rows)
    var article = rows[0];
    var query = 'UPDATE article SET articleClick=articleClick+1 WHERE articleID=' + mysql.escape(articleID)
    mysql.query(query, function (err, rows, fields) {
      if (err) {
        console.log(err);
        return
      }

      // console.log(article);
      var year = article.articleTime.getFullYear();
      var month = article.articleTime.getMonth() + 1 + 1 > 10 ? article.articleTime.getMonth() + 1 : '0' + article.articleTime.getMonth();
      var date = article.articleTime.getDate() + 1 > 10 ? article.articleTime.getDate() : '0' + article.articleTime.getDate();
      article.articleTime = year + '-' + month + '-' + date
      res.render('article', { article: article, user: req.session.user })
    })
  })
})

/* 文章发布页面实现 */
router.get('/edit', function (req, res, next) {
  var user = req.session.user;
  if (!user) {
    res.redirect('login')
    return
  }
  res.render('edit', { user: req.session.user })
})
// 文章发布
router.post('/edit', function (req, res, next) {
  var title = req.body.title;
  var content = req.body.content;
  var author = req.session.user.authorName;
  var query = 'INSERT article  SET articleTitle=' + mysql.escape(title) + ', articleAuthor=' + mysql.escape(author) + ', articleContent=' + mysql.escape(content) + ',articleTime=CURDATE()';
  mysql.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return
    }
    res.redirect('/')
  })
})

/* 友情链接 */
router.get('/friends', function (req, res, next) {
  res.render('friends', { user: req.session.user });
})

/* 关于博客 */
router.get('/about', function (req, res, next) {
  res.render('about', { user: req.session.user });
})

/* 博客登出 */
router.get('/logout', function (req, res, next) {
  req.session.user = null;
  res.redirect('/')
})

/* 修改文章页面 */
router.get('/modify/:articleID', function (req, res, next) {
  var articleID = req.params.articleID;
  var user = req.session.user;
  var query = 'SELECT * FROM article WHERE articleID=' + mysql.escape(articleID);
  if (!user) {
    res.redirect('/login');
    return
  }

  mysql.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return
    }
    var article = rows[0];
    var title = article.articleTitle;
    var content = article.articleContent;
    console.log(title, content);
    res.render('modify', { user: user, title: title, content: content });
  })
})

/* 提交修改文章 */
router.post('/modify/:articleID', function (req, res, next) {
  var articleID = req.params.articleID;
  var user = req.session.user;
  var title = req.body.title;
  var content = req.body.content;
  console.log(req.body);
  // console.log(title);
  // console.log(content);
  var query = 'UPDATE article SET articleTitle=' + mysql.escape(title) + ',articleContent=' + mysql.escape(content) + ' WHERE articleID=' + mysql.escape(articleID);
  mysql.query(query, function (err, row, fields) {
    if (err) {
      console.log(err);
      return
    }
    res.redirect('/')
  })
})

/* 删除文章 */
router.get('/delete/:articleID', function (req, res, next) {
  var articleID = req.params.articleID;
  var user = req.session.user;
  var query = 'DELETE FROM article WHERE articleID=' + mysql.escape(articleID);
  if (!user) {
    res.redirect('/login');
    return
  }
  mysql.query(query, function (err, rows, fields) {
    if (err) {
      console.log(err);
      return
    }
    res.redirect('/')
  })
})

module.exports = router;
