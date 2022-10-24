var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const PORT=process.env.PORT
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');


let homeRouter = require('./routes/home')
let userRouter = require('./routes/user');
let adminLoginRouter = require('./routes/admin');


var hbs = require('express-handlebars')
const Handlebars = require('handlebars');
var app = express();
var db = require('./config/connection')
var session = require('express-session')

Handlebars.registerHelper('lt', function( a, b ){
	var next =  arguments[arguments.length-1];
	return (a < b) ? next.fn(this) : next.inverse(this);
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

dotenv.config();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));



app.use((req,res,next)=>{ 
  
  res.header("cache-control", "private,no-cache,no-store,must revalidate");
  res.header("Express", "-3");
  
next();
})

app.use('/',session({resave: true,saveUninitialized: true,secret:'key',cookie:{maxAge:600000}}))

db.connect((err) => {
  if (err) {
    console.log('Connection Error:'+err);
  }else{
    console.log('Database Connected at Port 27017');
  }
})





app.use('/', homeRouter)
app.use('/login', userRouter);
app.use('/admin' ,adminLoginRouter);



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
