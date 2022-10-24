var express = require('express');
var router = express.Router();


/* GET Home page. */
router.get('/', function(req, res, next) {
  res.render('home/home', { title: 'Home' , home:true, link1: '/stylesheets/home.css'});
});



module.exports = router;

