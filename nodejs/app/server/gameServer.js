var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

module.exports = function(io, connection) {

  var BattleshipGame = require('./game/game.js');
  var GameStatus = require('./game/gameStatus.js');

  var users = {};
  var gameIdCounter = 1;

  io.on('connection', function(socket) {
    // create user object for additional data
    users[socket.id] = {
      nickname: null,
      score: 0, // player's initial score
      inGame: null,
      player: null,
      hit: 0
    };

    socket.on('new player', function(msg) {
      if (msg == "") {
        console.log("**************Errore Username, notifico ritrasmissione************");
        io.to(socket.id).emit('errorUsername');
      } else {
        users[socket.id].nickname = msg;
        console.log("STAMPO IL NICKNAME :" + users[socket.id].nickname);
      }
    });


    // join waiting room until there are enough players to start a new game
    socket.join('waiting room');

    /**
     * Handle chat messages
     */
    socket.on('chat', function(msg) {
      if (users[socket.id].inGame !== null && msg) {
        console.log((new Date().toISOString()) + ' Chat message from ' + users[socket.id].nickname + ': ' + msg);

        // Send message to opponent
        socket.broadcast.to('game' + users[socket.id].inGame.id).emit('chat', {
          name: users[socket.id].nickname,
          message: entities.encode(msg),
        });

        // Send message to self
        io.to(socket.id).emit('chat', {
          name: users[socket.id].nickname,
          message: entities.encode(msg),
        });
      }
    });

    socket.on('oppNotification', function() {
      var game = users[socket.id].inGame,
        opponent;
      if (game !== null) {
        if (game.currentPlayer === users[socket.id].player) {
          opponent = game.currentPlayer === 0 ? 1 : 0;
          // Check if username of players is null to avoid error during game session
          // server notify to client if username is null through a retransmission
          if (!users[game.getPlayerId(opponent)].nickname) {
            console.log("Errore in oppNotification OPPONENT *********");
            io.to(socket.id).emit('errorNotification', null);
          } else {
            if (!users[socket.id].nickname) {
              console.log("Errore in oppNotification YOU *********");
              io.to(socket.id).emit('errorNotification', null);
            } else {
              io.to(game.getPlayerId(opponent)).emit('oppUsername', users[socket.id].nickname);
              io.to(socket.id).emit('oppUsername', users[game.getPlayerId(opponent)].nickname);
            }
          }
        }
      }
    });

    /**
     * Handle shot from client
     */
    socket.on('shot', function(position) {
      var game = users[socket.id].inGame,
        opponent, score;


      if (game !== null) {
        // Is it this users turn?
        if (game.currentPlayer === users[socket.id].player) {
          opponent = game.currentPlayer === 0 ? 1 : 0;
          if (game.shoot(position)) {
            // Valid shot
            io.to(socket.id).emit('valid_shot');

            //Update player's score
            score = game.getPlayerScore(opponent);
            users[socket.id].score = score;

            //Is the game over?
            checkGameOver(game);

            // Update game state on both clients.
            io.to(socket.id).emit('update', game.getGameState(users[socket.id].player, opponent));
            io.to(game.getPlayerId(opponent)).emit('update', game.getGameState(opponent, opponent));

            //Notify to clients their score and their opponent's score
            io.to(socket.id).emit('scoreME', game.getPlayerScore(opponent));
            io.to(game.getPlayerId(opponent)).emit('scoreOPP', game.getPlayerScore(opponent));

            //Notify to players if they have shot or not a ship
            if (game.getPlayerShot(opponent)) {
              io.to(socket.id).emit('hit_ship');
              io.to(game.getPlayerId(opponent)).emit('hit_ship');
            } else {
              io.to(socket.id).emit('miss_ship');
              io.to(game.getPlayerId(opponent)).emit('miss_ship');
            }
          }
          else {
            //Invalid shot
            io.to(socket.id).emit('invalid_shot');
          }
        }
      }
    });

    /**
     * Handle leave game request
     */
    socket.on('leave', function() {
      if (users[socket.id].inGame !== null) {
        leaveGame(socket);

        socket.join('waiting room');
        joinWaitingPlayers();
      }
    });

    /**
     * Handle client disconnect
     */
    socket.on('disconnect', function() {
      console.log((new Date().toISOString()) + ' ID ' + users[socket.id].nickname + ' disconnesso.');

      leaveGame(socket);

      delete users[socket.id];
    });

    joinWaitingPlayers();
  });


  /**
   * Create games for players in waiting room
   */
  function joinWaitingPlayers() {
    var players = getClientsInRoom('waiting room');

    if (players.length >= 2) {
      // 2 player waiting. Create new game!
      var game = new BattleshipGame(gameIdCounter++, players[0].id, players[1].id);

      // create new room for this game
      players[0].leave('waiting room');
      players[1].leave('waiting room');
      players[0].join('game' + game.id);
      players[1].join('game' + game.id);


      users[players[0].id].player = 0;
      users[players[1].id].player = 1;
      users[players[0].id].inGame = game;
      users[players[1].id].inGame = game;

      io.to('game' + game.id).emit('join', game.id);

      // send initial ship placements
      io.to(players[0].id).emit('update', game.getGameState(0, 0));
      io.to(players[1].id).emit('update', game.getGameState(1, 1));

      console.log("Due utenti si sono uniti al  game ID " + game.id);
    }
  }

  /**
   * Leave user's game
   * @param {type} socket
   */
  function leaveGame(socket) {
    if (users[socket.id].inGame !== null) {
      console.log((new Date().toISOString()) + ' ID ' + users[socket.id].nickname + ' left game ID ' + users[socket.id].inGame.id);

      // Notifty opponent
      socket.broadcast.to('game' + users[socket.id].inGame.id).emit('notification', {
        message: 'L\' avversario ha abbandonato la battaglia.'
      });

      if (users[socket.id].inGame.gameStatus !== GameStatus.gameOver) {
        // Game is unfinished, abort it.
        users[socket.id].inGame.abortGame(users[socket.id].player);
        checkGameOver(users[socket.id].inGame);
      }

      socket.leave('game' + users[socket.id].inGame.id);

      users[socket.id].nickname = null;
      users[socket.id].inGame = null;
      users[socket.id].player = null;
      users[socket.id].score = 0;
      users[socket.id].max_score = 0;
      users[socket.id].vinte = 0;
      users[socket.id].hit = 0;

      io.to(socket.id).emit('leave');
    }
  }
  /**
   * [updatePlayer description]
   * @param  {[string]} username [player's score]
   * @param  {[int]} score    [player's score]
   * @param  {[int]} winner   [winner flag: if is set to 1 it refers to winner, otherwise it refers to loser]
   * @return {[null]}
   */

  function updatePlayer(username, score, winner) {

    //tmp variables
    var tmp_score = 0;
    var vinte = 0;
    var max_score = 0;

    //query select on the player's score and update of it
    connection.query('SELECT score FROM users WHERE username = ? ', [username], function(error, results) {
      if (error) {
        console.log('error');
      } else {
        tmp_score = results[0].score;
        tmp_score += score;

        connection.query('UPDATE users set score = ? where username = ?', [tmp_score, username], function(error, results) {
          if (error) {
            console.log('error');
          } else {
            console.log('UPDATE SCORE GENERALE: ' + tmp_score + ' . Utente: ' + username);
          }

        });
      }
    });

    //query select on the player's max_score and update of it if current score is higher than it
    connection.query('SELECT max_score FROM users where username = ?', [username], function(error, results) {
      if (error) {
        console.log('error');
      } else {
        max_score = results[0].max_score;
        if (score > max_score) {
          connection.query('UPDATE users set max_score = ? where username = ?', [score, username], function(error, results) {
            if (error) {
              console.log('error');
            } else {
              console.log('UPDATE MAX SCORE: ' + max_score + ' . Utente: ' + username);
            }
          });

        }
      }
    });

    //query update of winner's won match
    if (winner) {
      connection.query('SELECT vinte FROM users WHERE username = ? ', [username], function(error, results) {
        if (error) {
          console.log('error');
        } else {
          vinte = results[0].vinte + 1;
          connection.query('UPDATE users set vinte = ? where username = ?', [vinte, username], function(error, results) {
            if (error) {
              console.log('error');
            } else {
              console.log('***UPDATE vinte: ' + vinte + '. Utente: ' + username);
            }
          });

        }
      });
    }
  }


  /**
   * @brief Notify players if game over.
   * @param {type} game
   */
  function checkGameOver(game) {
    var score;
    if (game.gameStatus === GameStatus.gameOver) {
      console.log((new Date().toISOString()) + ' Game ID ' + game.id + ' ended.');
      console.log("WINNER: " + users[game.getWinnerId()].nickname + " WINNER SCORE: " + users[game.getWinnerId()].score);
      updatePlayer(users[game.getWinnerId()].nickname, users[game.getWinnerId()].score, 1);
      updatePlayer(users[game.getLoserId()].nickname, users[game.getLoserId()].score, 0);

      io.to(game.getWinnerId()).emit('gameover_winner', true);
      io.to(game.getLoserId()).emit('gameover_loser', false);
    }
  }

  /**
   * Find all sockets in a room
   * @param {type} room
   * @returns {Array}
   */
  function getClientsInRoom(room) {
    var clients = [];
    for (var id in io.sockets.adapter.rooms[room]) {
      clients.push(io.sockets.adapter.nsp.connected[id]);
    }
    return clients;
  }
};
