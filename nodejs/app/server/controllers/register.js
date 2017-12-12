/**
 * @file register.js
 */
var connection = require('./../../../config');

/**
 * This function is used to regester a new player. The name, surname, country, username e password
 * will be saved in the database managed by the connection object.
 *
 * @param  nome     name of the player;
 * @param  cognome  surname of the player;
 * @param  country  country of origin;
 * @param  user     username, will be used for login;
 * @param  pass     password
 * @param  callback a callback that will be called after that the all operation is completed.
 */
exports.register = function(nome, cognome, country, user, pass, callback ){
	var users={
        "username":user,
        "password":pass,
        "nome": nome,
        "cognome": cognome,
        "country": country
    }

    connection.query('INSERT INTO users SET ?',users, function (error, results, fields) {
       if (error) {
         console.log('error');
         callback('db-error');
       }else{
         console.log('Utente registrato con success.');
         callback(null);
      }
    });
}
