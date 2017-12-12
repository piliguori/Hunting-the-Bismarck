/**
 * @file register.js
 *
 * This file implement all the function required for "username check", ie the AJAX request sent to
 * the server to verify the availability of a username.
 * The following approach is "canonical": an XMLHttpRequest object is created and a callback is
 * registered. Such callback will be executed upon receiving the response and will show a message
 * about the availability of the username.
 */

/**
 * [newXMLHttpRequest description]
 * @return {[type]} [description]
 */
function newXMLHttpRequest() {
	var request = null;
	var browser = navigator.userAgent.toUpperCase();
	if(typeof(XMLHttpRequest) == "function" ||
		typeof(XMLHttpRequest) == "object") {
		request = new XMLHttpRequest();
	} else {
		if(window.ActiveXObject && browser.indexOf("MSIE 4") < 0) {
			if(browser.indexOf("MSIE 5") < 0) {
				request = new ActiveXObject("Msxml2.XMLHTTP");
			} else {
				request = new ActiveXObject("Microsoft.XMLHTTP");
			}
		}
	}
	return request;
}

/**
 * The function is called within the callback associated with the "on ready-state change" event of
 * the AJAX request sent to the server to verify the availability of a username. The function will
 * show a message about the availability of the username on the register.html page.
 *
 * @param  responseText is a JSON object, in textual format, "{'response': response}" containing
 * - response : 1, if the username is already used;
 * - response : 0, if the username isn't used;
 */
function manageResponse(responseText) {
	console.log("responseText=" + responseText);
	var str;
	var data = eval("(" + responseText + ")");
	if (data.response == 0) {
		str = "Username disponibile";
		$("#button1").prop("disabled",false);
	} else {
		str = "Username non disponibile"
		$("#button1").prop("disabled", true);
	}
	$("#unameRes").html(str);
}

/**
 * This function is invoked, in the register.html page, every time the #unametxbox textbox generates
 * an "onkeyup" event. The function creates a new AJAX request to the server, in order to verify
 * that the username that the user has entered in the textbox is not already used.
 */
function checkUsername() {
	var usern = document.getElementById("uname").value;
	var req = newXMLHttpRequest();
	req.onreadystatechange = function() {
		if (req.readyState == 4)
		 if (req.status == 200)
			manageResponse(req.responseText);
	}
	req.open("POST", "/username", true);
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	var par = "username=" + escape(usern);
	console.log(par);
	req.send(par);
}

/**
 * This function is invoked every time the user clicks on the "submit" button.
 * The function checks that username and password aren't empty.
 */
function formValidation() {
	var usern = document.getElementById("uname").value;
	var passwd = document.getElementById("passwd").value;

	if (usern == "" || passwd == "") {
		$("#unameRes").html("Questo campo è obbligatorio");
		$("#passwdRes").html("Questo campo è obbligatorio");
		return false;
	}
}
