/**
 * @file authenticate.js
 */
var connection = require('./../../../config');

/**
 * This function is called when a user attempts to login.
 * The function queries the database, verifying that username and password match. In this case,
 * the callback is called passing a JSON object containing the username and the score. Otherwise,
 * the callback is called passing a null object.
 *
 * @param  user username;
 * @param  pass password;
 * @param  callback a callback that will be called after that the all operation is completed.
 */
exports.authenticate = function(user, pass, callback) {
	connection.query('SELECT * FROM users WHERE username = ?', [user], function(error, results, fields) {
		if (error) {
			console.log("error");
			callback('query-error');
		} else {
			if (results.length > 0 && pass == results[0].password) {
				console.log("Autenticazione avvenuta con successo");
				callback({user: results[0].username, score: results[0].score});
			} else {
				console.log("Username o password non corrispondono");
				callback(null);
			}
  		}
	});
}
