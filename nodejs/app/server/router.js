var path = require('path');
var connection = require('./../../config');

var A = require('./controllers/authenticate');
var R = require('./controllers/register');

module.exports = function(app, connection) {
  //Getting user's data registration on post request on '/register'
  app.post('/register', function(req, res) {
    var users = {
      "nome": req.body.nome,
      "cognome": req.body.cognome,
      "country": req.body.country,
      "username": req.body.username,
      "password": req.body.password
    }
    //Check user's data and insert it into database if username does not already exist
    R.register(req.body.nome, req.body.cognome, req.body.country, req.body.username, req.body.password, function(e) {
      if (e) {
        res.sendFile(path.join(__dirname, '../public', 'error.html'));
      } else {
        //Set user session and redirect to game page
        req.session.user = users.username;
        res.redirect('/game');
      }
    });
  });

  //Getting user's data login on post request on '/login'
  app.post('/login', function(req, res) {
  //Using authenticate method to check if username and passoword match
    A.authenticate(req.body.username, req.body.password, function(o) {
      if (!o) {  //if they not match, redirect to error page
        res.sendFile(path.join(__dirname, '../public', 'error.html'));
      } else {
        //If they match, set user session and redirect to game page
        req.session.user = o.user;
        console.log("Provo a salvare la sessione " + req.session.user);
        res.redirect('/game');
      }
    });
  });

  //On get request on '/register' return register page
  app.get('/register', function(req, res) {
	res.sendFile(path.join(__dirname, '../public', 'register.html'));
  });

  // checking user's username and password
  app.post('/checkid', function(req, res) {
	  connection.query('select count(*) as namescount from users where username = ? and password = ?',
	  					[req.body.username, req.body.password],
						function(err, result) {
						        if (err) {
						          console.log('error');
						        } else {
						          var response = result[0].namescount;
						          res.send({'response': response });
						        }
					      });
  });



//Check exisiting username during registration routine
  app.post('/username', function(req, res) {
    var uname = req.body.username;
    connection.query('select count(*) as namescount from users where username = ?', [uname], function(err, result) {
      if (err) {
        console.log('error');
      } else {
        var response = result[0].namescount;
        res.send({
          'response': response
        });
      }
    });
  });

  //On get request on '/game' return game page if user session has been created
  app.get('/game', function(req, res) {
    if (req.session.user == null) {
      console.log("Tentativo di accesso utente non loggato");
      res.redirect('/');
    } else {
      console.log("Sfrutto la sessione");
      res.sendFile(path.join(__dirname, '../public', 'game.html'));
    }
  });

  //On get request on '/profile' return username client session
  app.get('/profile', function(req, res) {
    if (req.session.user == null) {
      res.redirect('/');
    } else {
      res.send({
        user: req.session.user
      });
    }
  });

  //On get request on '/rank' return ranking page
  app.get('/rank', function(req, res) {
    connection.query('select username, score, max_score, vinte from users order by score desc', function(err, result) {
      if (err) {
        console.log('error');
      } else {
        var objs = [];
        for (var i = 0; i < result.length; i++)
          objs.push({
            "username": result[i].username,
            "score": result[i].score,
            "max_score": result[i].max_score,
            "vinte": result[i].vinte
          });
        res.send(JSON.stringify(objs));
      }
    });
  });

};
