var socket = io();

var myHitSound;
var myMissSound;
var myShotSound;


/**
 * @brief sound manager
 * @param   src [audio resource path]
 */
function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function() {
    this.sound.play();
  }
  this.stop = function() {
    this.sound.pause();
  }
}

var myMusic = new sound("/sound/vangelis.mp3");
var winnerSound = new sound("/sound/winner.mp3");
var loserSound = new sound("/sound/loser.mp3");



$(function() {
  //Successfully connected to server event
  socket.on('connect', function() {
    console.log('Connesso al server.');
    $('#disconnected').hide();
    $('#waiting-room').show();
  });

//retransmission of client's username in case of prevoius error transmission
  socket.on('errorUsername',function(){
    socket.emit('new player',$('#myUsername').text());
  });

//retransmission of opponent's username in case of prevoius error transmission
  socket.on('errorNotification',function(){
    socket.emit('oppNotification');
  });

// Disconnected from server event
  socket.on('disconnect', function() {
    console.log('Disconnesso dal server.');
    $('#waiting-room').hide();
    $('#game').hide();
    $('#disconnected').show();
    myMusic.stop();

  });

  // User has joined a game
  socket.on('join', function(gameId) {
    var username = $('#myUsername').text();
    console.log('Username inviato '+username);
    socket.emit('new player', username);
    Game.initGame();
    $('#messages').empty();
    $('#disconnected').hide();
    $('#waiting-room').hide();
    $('#game').show();
    $('#game-number').html(gameId);
    $('#myScore').html("0");
    $('#oppScore').html("0");
    socket.emit('oppNotification');   //Notify opponent's username
    myMusic.play();
  });



  /**
   * Update player's game state
   */
  socket.on('update', function(gameState) {
    Game.setTurn(gameState.turn);
    Game.updateGrid(gameState.gridIndex, gameState.grid);
  });

//handle on player's current score
  socket.on('scoreME', function(msg) {
    console.log('MSG: ' + msg);
    $('#myScore').html(msg);
  });

//handle opponent's current score
  socket.on('scoreOPP', function(msg) {
    console.log('MSG: ' + msg);
    $('#oppScore').html(msg);
  });

//handle opponent'username
  socket.on('oppUsername', function(msg){
    console.log("Username avversario "+msg);
    $('#oppUsername').html(msg);
  });


  /**
   * Game chat message
   */
  socket.on('chat', function(msg) {
    $('#messages').append('<li><strong>' + msg.name + ':</strong> ' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  });

  /**
   * Game notification
   */
  socket.on('notification', function(msg) {
    $('#messages').append('<li>' + msg.message + '</li>');
    $('#messages-list').scrollTop($('#messages-list')[0].scrollHeight);
  });

  /**
   * Change game player status to winner
   */
  socket.on('gameover_winner', function(isWinner) {
    Game.setGameOver(isWinner);
    myMusic.stop();
    winnerSound.play();

  });

  /**
   * Change game player status to loser
   */
  socket.on('gameover_loser', function(isWinner) {
    Game.setGameOver(isWinner);
    myMusic.stop();
    loserSound.play();

  });

  /**
   * Leave game and join waiting room
   */
  socket.on('leave', function() {
    $('#game').hide();
    $('#waiting-room').show();
    myMusic.stop();


  });

//if client hits a ship, play explosion sound
  socket.on('hit_ship', function() {
     myHitSound = new sound("/sound/explosion.mp3");
     setTimeout("myHitSound.play()",2500);
  });

//if client miss a ship, play splash  sound
  socket.on('miss_ship', function() {
    myMissSound = new sound("/sound/splash.mp3");
    setTimeout("myMissSound.play()",2500);
  });

//if client clicks on valid grid position, play a cannon sound
  socket.on('valid_shot', function() {
    myShotSound = new sound ("/sound/283mmK5.mp3");
    myShotSound.play();
  });

//if client clicks on invalif grid position, play a warning sound
  socket.on('invalid_shot', function() {
    myInvalidShotSound = new sound("/sound/warning.mp3");
    myInvalidShotSound.play();
  });

  /**
   * Send chat message to server
   */
  $('#message-form').submit(function() {
    socket.emit('chat', $('#message').val());
    $('#message').val('');
    return false;
  });

});


/**
 * Send leave game request
 * @param {type} e Event
 */
function sendLeaveRequest(e) {
  e.preventDefault();
  socket.emit('leave');
}

/**
 * Send shot coordinates to server
 * @param {type} square
 */
function sendShot(square) {
  socket.emit('shot', square);
  // myShotSound = new sound ("/sound/283mmK5.mp3");
  // myShotSound.play();
}
