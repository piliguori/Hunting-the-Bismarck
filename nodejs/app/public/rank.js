/**
 * @file rank.js
 *
 * This file implement all the function required to generate a rank page.
 *
 * This time we will follow the jquery approach, with the intent to show the benefits of using it in
 * terms of reducing line codes.
 */

/**
 * This function is called when the rank.html page is ready or every time the user hits the "update"
 * button. The function creates a new request and registers a callback.
 */
function getRanking() {
	$.get('/rank',
/**
 * This is the callback function called when the response is received. It will create a new table in
 * the page: each row shows some information about the players, such as username, total score,
 * number of games won, excetera...
 * Such table will be inserted in the "@ranking" div in the rank.html page.
 *
 * @param data is a JSON object, in textual form, containing a set of record, each of which contains
 * the following fields:
 * 	- "username": the username of a player;
 * 	- "score": total score of a player;
 * 	- "max_score": the highest score reached in a single game;
 * 	- "vinte": the number of games won.
 */
	function (data) {
		var jdata = eval("(" + data + ")");
		var htmlStr = "<table><tr><th>User</th><th>score</th><th>max score</th><th>p. vinte</th></tr>";
		for (var i = 0; i < jdata.length; i++) {
			htmlStr += "<tr><td>" + jdata[i].username + "</td><td>" + jdata[i].score + "</td><td>" + jdata[i].max_score + "</td><td>" + jdata[i].vinte + "</td></tr>";
			console.log("username: " + jdata[i].username + " score: " + jdata[i].score + " p.vinte: " + jdata[i].vinte);
		}
		htmlStr += "</table>";
		$("#ranking").html(htmlStr);
	});
}
