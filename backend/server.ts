declare var require: any

const { Socket } = require( "socket.io");

const express = require("express");
const app = express();
const http = require("http");
const {Server} = require('socket.io')
const cors = require('cors')
var player_names = [];
var player_ids = [];
var num_players = 0;
var game_status = "waiting"
// const [num_players,setnum_players] = useState(0);

// Create a game state object
const gameState = {
  playerIds: player_ids,
  playerNames: player_names,
  hands: {},
  discardPile: [],
  currentPlayerIndex: 0,
  // playDirection will be 1 for clockwise and -1 for anticlockwise
  playDirection: 1,
  deck: []
};

app.use(cors())
const server = http.createServer(app)
const io = new Server(
    server,{cors:{
        origin:"http://localhost:3001",
        methods: ["GET", "POST"]
    },
})

// const gameState.deck = [];

function dealCards(gameState) {
    // Create a deck of cards
    const colors = ['red', 'yellow', 'green', 'blue'];
    const values = ['num-0', 'num-1', 'num-2', 'num-3', 'num-4', 'num-5', 'num-6', 'num-7', 'num-8', 'num-9', 'skip', 'reverse', 'draw-two'];
    const wilds = ['wild', 'draw-4'];

    for (let color of colors) {
      for (let value of values) {
        gameState.deck.push({ color, value });
        if (value !== '0') {
          gameState.deck.push({ color, value });
        }
      }
    }

    for (let wild of wilds) {
      for (let i = 0; i < 4; i++) {
        gameState.deck.push({ color: 'black', value: wild });
      }
    }

    // set mark for each card in deck
    gameState.deck.forEach((card) => {
      // for all numeric cards, their mark will be the last character of their value
      if (card.value.slice(0, 4) === "num-"){
        card.mark = card.value.slice(-1);
      }
      else if (card.value.slice(0, 4) === "skip"){
        card.mark = "S";
      }
      else if (card.value.slice(0, 7) === "reverse"){
        card.mark = "R";
      }
      else if (card.value.slice(0, 8) === "draw-two"){
        card.mark = "D";
      }
      else if (card.value.slice(0, 6) === "draw-4"){
        card.mark = "D";
      }
      else if (card.value.slice(0, 4) === "wild"){
        card.mark = "W";
      }
    });
  
    // Shuffle the gameState.deck
    for (let i = gameState.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
  
    // Deal the cards to the players
    const numPlayers = gameState.playerIds.length;
    const numCards = 7;
    for (let i = 0; i < numPlayers; i++) {
      gameState.hands[gameState.playerIds[i]] = gameState.deck.splice(0, numCards);
    }
  
    // Set the current player and direction of play
    gameState.currentPlayerIndex = 0;
    gameState.playDirection = 1;

    // Set the top card of the discard pile
    gameState.discardPile.push(gameState.deck.pop());

    //push a specific card onto discard pile for start of game
    //gameState.discardPile.push({ color: 'red', value: 'reverse', mark: 'R' });

    // if first card is an action card, then perform the action on the first player: 
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (topCard.value.slice(0, 4) === "skip"){
      gameState.currentPlayerIndex = 1;
    }
    else if (topCard.value.slice(0, 7) === "reverse"){
      gameState.playDirection = -1;
    }
    else if (topCard.value.slice(0, 8) === "draw-two"){
      gameState.hands[gameState.playerIds[0]].push(gameState.deck.pop(), gameState.deck.pop());
    }
    else if (topCard.value.slice(0, 6) === "draw-4"){
      gameState.hands[gameState.playerIds[0]].push(gameState.deck.pop(), gameState.deck.pop(), gameState.deck.pop(), gameState.deck.pop());
    }
    else if (topCard.value.slice(0, 4) === "wild"){
      // do nothing
    }
  }

server.listen(3001, ()=>{
    console.log("SERVER IS LISTENING ON PORT 3001")
})
io.on("connection",(socket: any)=>{
    console.log("user connected with a socket id", socket.id)
    //add custom events here

    socket.on("start-game", (user: any) => {
        console.log(`The player ${user.name} has started the game`);
        // do something with the player's name
        num_players = num_players + 1;
        player_names[num_players - 1] = user.name;

        // upon every new connection, the server assigns a unique client id and emits it back to the client. At the same time 
        // the server maintains a map of each unique client id against the socket id. In case that an already existing 
        // client id emits an event with a different socket id, a page refresh can be detected. On the client’s end, you would 
        //have to accordingly ensure that once assigned with an ID, it cannot be overwritten in the future by the server.
        player_ids[num_players - 1] = user.userID;
        console.log("num_players:", num_players, "player_names:", player_names, "player_ids:", player_ids);

        if (num_players === 4) {
          // Emit a "game-started" event to all connected clients
          io.emit("game-started");
  
          // Start the game by dealing the cards and updating the game state
          dealCards(gameState);

          /*
          console.log("gameState:", gameState)
          console.log("gameState.playersIds[0]: ", gameState.playerIds[0])
          */
  
          // wait for client to load game
          socket.on("game-loaded", () => {
            // Emit a "game-state" event to the client
            console.log(socket.id, "has loaded the game.")
            io.emit("update-game-state", gameState);
          })
  
          game_status = "started";
      }
      });

    //socket.on("card-played", ({ cardIndex, userID }) => {
    
    // default values provided for all expected properties, because color won't be received sometimes (it is only for wilds)
    // socket.on("card-played", ({ cardIndex, userID, select_color } = { cardIndex: 0, userID: 0, select_color: '' }) => {
    socket.on("card-played", ({ cardIndex, userID }) => {
      var was_wild = false;
    
      // console.log("Color is: ", select_color);

      // Find the player's ID based on the socket ID
      // const playerId = Object.keys(gameState.hands).find(
      //   (playerId) => playerId === socket.id
      // );
      console.log("Card played: ", cardIndex);
      console.log("UserID: ", userID);
      console.log("Gamestate: ", gameState);

      const playerId = userID;
      const playedCard = gameState.hands[playerId][cardIndex];
      console.log("Played card: ", playedCard);
    
      if (playerId) {
        // Get the card from the player's hand
        const playedCard = gameState.hands[playerId][cardIndex];
        
        const isValidCard = true;
        /*
        // Check if the played card is valid (this is also checked client-side)
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const isValidCard =
          playedCard.color === topCard.color ||
          playedCard.value === topCard.value ||
          playedCard.color === "black" ||
          topCard.color === "black" // this condition only true if topCard is a wild card
        */
    
        if (isValidCard) {
          // Remove the card from the player's hand
          gameState.hands[playerId].splice(cardIndex, 1);
    
          // Add the card to the discard pile
          gameState.discardPile.push(playedCard);
  
          // Check for special cards
          if (playedCard.value === "reverse") {
            // Reverse the play direction
            gameState.playDirection *= -1;
          } else if (playedCard.value === "skip") {
            // Skip the next player
            gameState.currentPlayerIndex =
              (gameState.currentPlayerIndex + gameState.playDirection) %
              gameState.playerIds.length;
          } else if (playedCard.value === "draw-two") {
            //if currentPlayerIndex has already been updated, then use: 
            // const nextPlayerId = gameState.playerIds[gameState.currentPlayerIndex];

            // Make the next player draw two cards from the gameState.deck
            const nextPlayerId =
            gameState.playerIds[
              (gameState.currentPlayerIndex + gameState.playDirection) %
                gameState.playerIds.length
            ];

            // deck is finishing before any player has won, so game drawn
            if (gameState.deck.length <= 2){
              io.emit("game-drawn")
            }
            else{
              gameState.hands[nextPlayerId].push(gameState.deck.pop(), gameState.deck.pop());
            }

          } else if (playedCard.value === "wild" || playedCard.value === "draw-4") {
            // TODO: Implement wild card and draw 4 card logic
            // Change the current color to the chosen color
            // gameState.currentColor = chosenColor;
            was_wild = true;

            if (playedCard.value === "draw-4") {
              //if currentPlayerIndex has already been updated, then use: 
              // const nextPlayerId = gameState.playerIds[gameState.currentPlayerIndex];

              // Make the next player draw four cards from the gameState.deck
              const nextPlayerId =
                gameState.playerIds[
                  (gameState.currentPlayerIndex + gameState.playDirection) %
                    gameState.playerIds.length
                ];

              // deck is finishing before any player has won, so game drawn
              if (gameState.deck.length <= 4){
                io.emit("game-drawn")
              }
              else{
                gameState.hands[nextPlayerId].push(
                  gameState.deck.pop(),
                  gameState.deck.pop(),
                  gameState.deck.pop(),
                  gameState.deck.pop()
                );
              }
            }
            // change the color of the card at the top of the discard pile
            // this is so next user can throw card of the selected colour, and to visualize the color for the players
            // gameState.discardPile[gameState.discardPile.length - 1].color = select_color;
          }

          console.log("current player index: ", gameState.currentPlayerIndex);

          // only update the current player index if the card played was not a wild card. else let player play again. 
          if (was_wild === false) {
            // get second last card from discard pile to check if it was a draw-4 card, so next players turn can be skipped
            // this condition is skipped if draw-4 was teh first card played (by checking if discard pile length is greater than 2)
            const secondLastCard = gameState.discardPile[gameState.discardPile.length - 2];

            if (secondLastCard.value !== "draw-4" || gameState.discardPile.length <= 2) {
              gameState.currentPlayerIndex =
              (gameState.currentPlayerIndex + gameState.playDirection + gameState.playerIds.length) %
              gameState.playerIds.length;
          }
          else {
            console.log("skipping next player's turn");
            gameState.currentPlayerIndex =
            (gameState.currentPlayerIndex + gameState.playDirection + gameState.playerIds.length) %
            gameState.playerIds.length;
            gameState.currentPlayerIndex =
            (gameState.currentPlayerIndex + gameState.playDirection + gameState.playerIds.length) %
            gameState.playerIds.length;
          }
          }
        
          // // Update the current player index so next player can take turn
          // gameState.currentPlayerIndex =
          //   (gameState.currentPlayerIndex + gameState.playDirection) %
          //   gameState.playerIds.length;

          console.log("next player index: ", gameState.currentPlayerIndex);
    
          // Emit the updated game state to all clients
          io.emit("update-game-state", gameState);
        } else {
          // If the played card is not valid, send an error message to the client
          socket.emit("invalid-card", {
            message: "The card you played is not valid.",
          });
          console.log("The card you played is not valid.")
        }
      } else {
        // If the player ID is not found, you can send an error message to the client
        socket.emit("player-not-found", {
          message: "Player not found.",
        });
        console.log("Player not found.")
      }
    });

    //socket.on('request-game-state')
    socket.on("pass-turn", ({userID }) => {
      console.log("pass-turn received")

      gameState.currentPlayerIndex =
      (gameState.currentPlayerIndex + gameState.playDirection + gameState.playerIds.length) %
      gameState.playerIds.length;

      console.log("next player index: ", gameState.currentPlayerIndex);

      io.emit("update-game-state", gameState);
    });

    
    // Listen for "pick-from-deck" event from client
    socket.on("pick-from-deck", ({ userID }) => {

      // Get the top card from the draw pile
      const topCard = gameState.deck[gameState.deck.length - 1];

      // Add the top card to this user's hand
      gameState.hands[userID].push(topCard);

      // if deck is empty, then game is drawn
      if (gameState.deck.length <= 1){
        io.emit("game-drawn")
      }
      else{
        // Remove the top card from the draw pile
        gameState.deck.pop();

        // Emit the updated game state to all clients
        io.emit("update-game-state", gameState);
      }
    });
    

    socket.on('request-game-state', () => {
      console.log("request-game-state received")
      io.emit("update-game-state", gameState);
    });

    socket.on("game-won", ({userID, name }) => {
      console.log("user won: ", userID, name)
      game_status = "finished";
      io.emit("game-has-been-won", userID, name);
    });


    socket.on('disconnect', () => {
        console.log('A client has disconnected');
      });
})
