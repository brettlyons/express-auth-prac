var express = require('express');
var router = express.Router();
var db = require('monk')('localhost/signup-acct');
var collection = db.get('signup-acct');
var bcrypt = require('bcrypt');

/* GET / */
router.get('/', function(req, res, next){
  var name = "Human";
  var signedIn = false;
  if(req.session.signedIn) {
    name = req.session.name;
    signedIn = req.session.signedIn;
  }
  
  res.render('index', { title: "Index to Signup Forms",
    name: name,
    signedIn: signedIn
  });
});
router.get('/logout', function(req, res, next) {
  req.session = null;
  res.redirect('/');
});
router.get('/signup', function(req, res, next) {
  if (req.session.signedIn) {
    res.redirect('/');
  }
  res.render('signup', {
    title: 'Sign Up',
    errors: null
  });
});

/*POST / */
router.post('/signup', function(req, res, next) {
  var errors = [];
  if(!req.body.name.trim()) {
    errors.push("You must fill in a name");
  }
  if(req.body.password != req.body.passConfirm) {
    errors.push("Both password fields must match");
  }
  if(req.body.password.length < 8 ) {
    errors.push("Password must be more than 8 characters long");
  } 
  // console.log(req.body.name);
  if(req.body.name.trim().length != 0) {
    collection.find({ name: req.body.name }, function(err, dbEntries) {
      if(dbEntries.length == 0 && errors.length == 0)  {
        collection.insert({
          name: req.body.name,
          passwordDigest: bcrypt.hashSync(req.body.password, 12) //req.body.password
        }, function(err, response) {
          res.redirect('/');
        });
      }
      else if(req.body.name === dbEntries[0].name) {
        errors.push("Name field must be unique");
      }
      if(errors.length > 0) {
        reportErrors(req.body);
      }
    });
  }
  function reportErrors(fields) {
    res.render('signup', {
      title: "Signup Corrections",
      name: fields.name,
      password: fields.password,
      passConfirm: fields.passConfirm,
      errors: errors
    });
  }
});
router.get('/signin', function(req, res, next) {
  res.render('signin', {
    title: "Sign In",
    signedIn: false
  });
});
router.post('/signin', function(req, res, next) {
  var errors = [];
  if(req.body.name.trim().length == 0) {
    errors.push("A username is required");
  }
  if(req.body.password.trim().length == 0) {
    errors.push("A password is required")
  }
  // So this is where the "auth" will occur for signin
  // so password needs to be compared to a password in the database.
  // Even though dbEntry is an *accurate* description of the info,
  // as far as variable names go, it could be more domain specific.

  collection.findOne({ name: req.body.name }, function(err, dbEntry) {
    if(!dbEntry) { 
      errors.push("Username/password not found");
      reportErrors(req.body);
    }
    // console.log(bcrypt.compare(req.body.password, dbEntry.passwordDigest));
    if(req.body.name !== dbEntry.name
       || !(bcrypt.compareSync(req.body.password, dbEntry.passwordDigest))) {
      errors.push("Username/password doesn't match");
    }
    if(errors.length > 0) {
      reportErrors(req.body);
    }
    req.session.signedIn = true;
    req.session.name = dbEntry.name;
    res.redirect('/');
  });

  function reportErrors(fields) {
    res.render('signin', {
      title: "Signin Corrections",
      name: fields.name,
      password: fields.password,
      errors: errors
    });
  }
});

module.exports = router;
