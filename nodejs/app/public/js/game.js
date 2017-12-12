var GameStatus = {
  inProgress: 1,
  gameOver: 2
}
var hitImage = new Image();
  hitImage.src = "img/hit2.png";
var missImage = new Image();
  missImage.src = "img/splash.png";
var viewfinder = new Image();
  viewfinder.src = "img/viewfinder.png"

var shipImageH = new Array();
  shipImageH[2] = new Image();
  shipImageH[2].src = "img/hoodH.gif";
  shipImageH[3] = new Image();
  shipImageH[3].src = "img/romaH.gif";
  shipImageH[4] = new Image();
  shipImageH[4].src = "img/kirovH.gif";
  shipImageH[5] = new Image();
  shipImageH[5].src = "img/bismarckH.gif";

  var shipImageV = new Array();
    shipImageV[2] = new Image();
    shipImageV[2].src = "img/hoodV.gif";
    shipImageV[3] = new Image();
    shipImageV[3].src = "img/romaV.gif";
    shipImageV[4] = new Image();
    shipImageV[4].src = "img/kirovV.gif";
    shipImageV[5] = new Image();
    shipImageV[5].src = "img/bismarckV.gif";

var shipImage = [shipImageH, shipImageV];

var Game = (function() {
  var canvas = [], context = [], grid = [],
      gridHeight = 361, gridWidth = 361, gridBorder = 1,
      gridRows = 10, gridCols = 10, markPadding = 10, shipPadding = 3,
      squareHeight = (gridHeight - gridBorder * gridRows - gridBorder) / gridRows,
      squareWidth = (gridWidth - gridBorder * gridCols - gridBorder) / gridCols,
      turn = false, gameStatus, squareHover = { x: -1, y: -1 };

  canvas[0] = document.getElementById('canvas-grid1');    // This player
  canvas[1] = document.getElementById('canvas-grid2');    // Opponent
  context[0] = canvas[0].getContext('2d');
  context[1] = canvas[1].getContext('2d');

  /**
   * Highlight opponent square on hover
   */
  canvas[1].addEventListener('mousemove', function(e) {
    var pos = getCanvasCoordinates(e, canvas[1]);
    squareHover = getSquare(pos.x, pos.y);
    drawGrid(1);
  });

  /**
   * Mouse moved out of opponent grid. Unhighlight.
   */
  canvas[1].addEventListener('mouseout', function(e) {
    squareHover = { x: -1, y: -1 };
    drawGrid(1);
  });

  /**
   * Fire shot on mouse click event (if it's user's turn).
   */
  canvas[1].addEventListener('click', function(e) {
    if(turn) {
      var pos = getCanvasCoordinates(e, canvas[1]);
      var square = getSquare(pos.x, pos.y);
      sendShot(square);
    }
  });

  /**
   * Get square from mouse coordinates
   * @param {type} x Mouse x
   * @param {type} y Mouse y
   * @returns {Object}
   */
  function getSquare(x, y) {
    return {
      x: Math.floor(x / (gridWidth / gridCols)),
      y: Math.floor(y / (gridHeight / gridRows))
    };
  };

  /**
   * Get mouse position on canvas relative to canvas top,left corner
   * @param {type} event
   * @param {type} canvas
   * @returns {Object} Position
   */
  function getCanvasCoordinates(event, canvas) {
    rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
      y: Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    };
  };

  /**
   * Init new game
   */
  function initGame() {
    var i;

    gameStatus = GameStatus.inProgress;

    // Create empty grids for player and opponent
    grid[0] = { shots: Array(gridRows * gridCols), ships: [] };
    grid[1] = { shots: Array(gridRows * gridCols), ships: [] };

    for(i = 0; i < gridRows * gridCols; i++) {
      grid[0].shots[i] = 0;
      grid[1].shots[i] = 0;
    }

    // Reset turn status classes
    $('#turn-status').removeClass('alert-your-turn').removeClass('alert-opponent-turn')
            .removeClass('alert-winner').removeClass('alert-loser');

    drawGrid(0);
    drawGrid(1);
  };

  /**
   * Update player's or opponent's grid.
   * @param {type} player
   * @param {type} gridState
   * @returns {undefined}
   */
  function updateGrid(player, gridState) {
    grid[player] = gridState;
    drawGrid(player);
  };

  /**
   * Set if it's this client's turn
   * @param {type} turnState
   * @returns {undefined}
   */
  function setTurn(turnState) {
    if(gameStatus !== GameStatus.gameOver) {
      turn = turnState;

      if(turn) {
        $('#turn-status').removeClass('alert-opponent-turn').addClass('alert-your-turn').html('E\' il tuo turno: pronto a fare fuoco!');
      } else {
        $('#turn-status').removeClass('alert-your-turn').addClass('alert-opponent-turn').html('E\' il turno dell\'avversario: fuoco nemico in arrivo.');
      }
    }
  };

  /**
   * Set game over and show winning/losing message
   * @param {Boolean} isWinner
   */
  function setGameOver(isWinner) {
    gameStatus = GameStatus.gameOver;
    turn = false;

    if(isWinner) {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
              .addClass('alert-winner').html('Vittoria! <a href="#" class="btn-leave-game">Rigioca</a>.');
    } else {
      $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
              .addClass('alert-loser').html('Sconfitta! <a href="#" class="btn-leave-game">Rigioca</a>.');
    }
    $('.btn-leave-game').click(sendLeaveRequest);
  }

  /*
   * Draw a grid with squares, ships and shot marks
   */
  function drawGrid(gridIndex) {
    drawSquares(gridIndex);
    drawShips(gridIndex);
    drawMarks(gridIndex);
  };

  /**
   * Draw grid squares/background
   * @param {Number} gridIndex
   */
  function drawSquares(gridIndex) {
    var i, j, squareX, squareY;

    //context[gridIndex].fillStyle = '#222222'
    context[gridIndex].fillStyle = '#000000' //color of the grid
    context[gridIndex].fillRect(0, 0, gridWidth, gridHeight);

    for(i = 0; i < gridRows; i++) {
      for(j = 0; j < gridCols; j++) {
        squareX = j * (squareWidth + gridBorder) + gridBorder;
        squareY = i * (squareHeight + gridBorder) + gridBorder;
        context[gridIndex].fillStyle=' #7AC5CD'; //color of grid square

        // Show a viewfinder if it's user's turn and user hovers over an unfired on, opponent square.
        if(j === squareHover.x && i === squareHover.y &&
                gridIndex === 1 && grid[gridIndex].shots[i * gridCols + j] === 0 && turn) {
          context[gridIndex].drawImage(viewfinder,squareX,squareY,squareWidth,squareHeight);
        }
        else
        context[gridIndex].fillRect(squareX, squareY, squareWidth, squareHeight);
      }
    }
  };

  /**
   * Draw visible ships on grid
   * @param {Number} gridIndex
   */
  function drawShips(gridIndex) {
    var ship, i, x, y,
        shipWidth, shipLength;

    context[gridIndex].fillStyle = '#444444';

    for(i = 0; i < grid[gridIndex].ships.length; i++) {
      ship = grid[gridIndex].ships[i];

      x = ship.x * (squareWidth + gridBorder) + gridBorder + shipPadding;
      y = ship.y * (squareHeight + gridBorder) + gridBorder + shipPadding;
      shipWidth = squareWidth - shipPadding * 2;
      shipLength = squareWidth * ship.size + (gridBorder * (ship.size - 1)) - shipPadding * 2;
      if(ship.horizontal) {
        context[gridIndex].drawImage(shipImage[0][ship.size], x, y, shipLength , shipWidth);
      } else {
        context[gridIndex].drawImage(shipImage[1][ship.size], x, y, shipWidth, shipLength);
      }
    }
  };

  /**
   * Draw shot marks on grid (splash icon for missed and fire icon for hits)
   * @param {Number} gridIndex
   */
  function drawMarks(gridIndex) {
    var i, j, squareX, squareY;
    var colpito = false;
    for(i = 0; i < gridRows; i++) {
      for(j = 0; j < gridCols; j++) {
        squareX = j * (squareWidth + gridBorder) + gridBorder;
        squareY = i * (squareHeight + gridBorder) + gridBorder;

        // draw spalsh icon if there is a missed shot on square
        if(grid[gridIndex].shots[i * gridCols + j] === 1) {
          context[gridIndex].drawImage(missImage, squareX, squareY, squareWidth , squareWidth);


        }
        // draw fire icon on square
        else if(grid[gridIndex].shots[i * gridCols + j] === 2) {
          context[gridIndex].drawImage(hitImage, squareX, squareY, squareWidth , squareWidth);
        }
      }
    }
  };

  return {
    'initGame': initGame,
    'updateGrid': updateGrid,
    'setTurn': setTurn,
    'setGameOver': setGameOver
  };
})();
