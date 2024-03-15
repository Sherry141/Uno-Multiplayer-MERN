# Uno-Multiplayer-MERN

This Uno game project utilizes the *MERN stack, leveraging its abilities of building real-time, multiplayer web applications. The code makes use of WebSockets for seamless player interaction, implements game logic in a distributed environment, and keeps states synced across the server and clients. 

You can watch a video demo of this application being run [here](https://youtu.be/IXvjkyEEZKE). 

This file contains instructions on how to run the application on your computer, the rules of the game, and an explanation of what is going on in the frontend and the backend, across their various files, and how they work together. 


*MERN stack without MongoDB, as persistent storage was not required for the game. 

# Table of Contents
- [Installation and Launching Game](#installation-and-launching-game)
- [Game Rules and Flow](#game-rules-and-flow)
- [Frontend](#frontend)
  - [Landing Page](#landing-page)
  - [Waiting Page](#waiting-page)
  - [Home Page](#home-page)
- [Backend](#backend)
  - [gameState Object](#gamestate-object)
  - [dealCards Function](#dealcards-function)
  - [Connecting New Players](#connecting-new-players)
  - [Handling Various Socket Messages from Players](#handling-various-socket-messages-from-players)

# Installation and Launching Game

To run the application on your computer, please follow the steps: 
 - Clone the repo on your computer
 - Make sure you have Node.js installed (app tested on v20.11.1)
 - Open a terminal in the base directory and type "npm i"
 - Type "cd frontend" to navigate to frontend directory and type "npm i" again
 - Open a terminal in the backend directory and type "ts-node server.ts". This will start the backend server. Keep this terminal window open to let the server run. You can view logs here as players connect, disconnect etc. 
 - Now, open a terminal window in the frontend folder and type "npm start". This should launch the application in your default browser and ask you to enter the player name. If it asks, "Something is already running on port 3000. Would you like to run the app on another port instead?", simply type 'Y'. 
 - Similarly, you will need to open 3 more separate terminal windows in the frontend folder, and type "npm start" in each of them, one by one, to launch a total of 4 instances. 
 - Please enter a name for each of the 4 instances
 - The game should start now, with the board and each player's respective hand being displayed to them


# Game Rules and Flow

### Players
- To get a particular UNO game started, you need to have exactly 4 players. Each player will be playing on their own, meaning there is no coordination.

### Setup
- Initially, each player is given 7 cards, and the rest of the cards are placed in the draw pile. Please note that there are a total of 104 cards for our game:
  - 19 Red cards – 0 to 9
  - 19 Blue cards – 0 to 9
  - 19 Green cards – 0 to 9
  - 19 Yellow cards – 0 to 9
  - 8 Skip cards – two cards of each color
  - 8 Reverse cards – two cards of each color
  - 8 Draw cards – two cards of each color
  - 4 Wild Draw 4 cards
- To start the game, the topmost card from the draw pile will be moved to the discard pile, meaning it will now be shown to all the players, and the game will start.
- If the first card drawn from the draw pile and put into the discard pile is an action card, then the action will be performed by player 1. If it is a wild or draw-4 card, then player 1 can throw any card they want to (no restrictions). 

### Gameplay
- The players then throw their cards in the correct order (player 1, then 2, then 3, and 4).
- Each player must throw a card that matches the number or the color of the card on top of the discard pile. For instance, if the discard pile has a red card that is an 8, you have to place either a red card or a card with an 8 on it. You can also play a Wild card (which can alter the current color in play).
- If the player has no matches or chooses not to play any of their cards even though they might have a match, they must draw a card from the draw pile. If that card can be played, play it. Otherwise, keep the card, and the game moves on to the next person in turn.

### Action Cards
- **Skip card:** Can only be played if it matches the color of the card present in the discard pile. In that case, the next player's turn is skipped.
- **Reverse card:** Can only be played if it matches the color of the card present in the discard pile. In that case, the direction of the gameplay is reversed.
- **Draw cards (draw 2):** Can only be played if it matches the color of the card present in the discard pile or that card is another draw 2 card of any color. In that case, the next player has to draw 2 cards. Please note that the next player draws 2 cards and takes their turn as well. 
- **Wild card:** Can be used over a card of any color, and then the same player can throw another card of any color. Please note that the wild card cannot be used on draw 2 or draw 4 cards.
- **Wild draw 4 card:** Acts just like the wild card except that the next player also has to draw four cards as well as forfeit his/her turn. With this card, you must have no other alternative cards to play that matches the color of the card previously played.

### Ending the Game
- The game is won by a player if they have no cards left. Please note that normally in UNO, players have to say "UNO" when they have 1 card remaining, but we will be ignoring that condition.
- If the deck ends before any of the players wins, then the game will be a draw. 


# Frontend
In the frontend directory, most of the relevant code is placed in src>components. Inside the components directory, we have further subdirectories for each page the app uses. The three main pages are: 

### Home Page
This is the main page of the game where the actual game happens. Players arrive here only when 4 players have successfully connected to the server and entered their names. This page dynamically displays each user's set of cards (which it receives from the backend), and the visuals of the game board. It displays a message indicating which player's turn it is, which the backend server communicates via the gameState object (details in the backend section). 

Many game rules are also implemented here on the frontned. When it is the current player's turn, the "canPlayCard" event handler is used to check which cards are playable according to Uno rules. If a card can be played, it is clickable (a soft glow appears around it when clicked). Similarly, this component checks when a user can draw from the main pile, or pass their turn. These things are amde possible by binding relevant event handlers to elements like buttons or the cards in the JSX markup. For example, clicking a card to select it or interacting with buttons to draw a card or pass the turn invokes these handlers: 

<button onClick={handleDrawCard} disabled={gameEnded}>Pick from deck</button>

This code, for example, attaches the handleDrawCard function to this "Pick from deck" button. 

The home page component also checks when the game has been won (when the player has no cards left) and emits a "game-won" message to the server. 

### Landing Page
This is the page the page a player lands at when they first launch the game. They are asked to enter their name, which is sent to the server. Once they do so, they are redirected to the waiting page. 

### Waiting Page
This is where the user comes to after entering their name, while they are still waiting for the game to begin (which requires 4 players to be connected to the server). This is a simple page that just displays a "Please wait" message. When 4 players have conneceted to the server, the player is automatically redirected to the home page of the game. 


# Backend

The main file in the backend is the server.ts file, which handles the entire setting up of the game and the gameState as it progresses. It communicates all necessary information to the players. 

Some of the main parts of the server.ts include: 

### gameState object
The gameState is an object that keeps track of each player's id, name, and cards, and the game's deck, discard pile, player turn, and direction of play (clockwise/anticlockwise).

### dealCards function
This function is run at the start of the game to create a whole deck of cards, shuffle it, and then to draw 7 cards to each player. It sets the initial player turn and direction of play. It updates the gameState with this information, which is emited to the individual players. 

### Connecting new players
When a new player is connected and fills in their name, it transmits a message to server. The server saves this name, assigns it a unique client id (so we don't have to depend on the socket id, which can be changed), and shares it with the user. It checks if 4 players have joined, and if so, it transmits a "game-started" message to all players, which redirects them from the waiting page to the home page to start the game. 

### When a card is played
Some of the processing and rule checking is done on the frontend, such as checking what cards in a player's hand can be played. But other central rules, such as whose turn it is and what the direction of play is, is determined by the server. Whenever a card is played, the server receives information on what card it was, and updates the gameState accordingly. 

Some examples are: 
 - if it was a "reverse" card, the server inverts the direction of play
 - if it was a "skip" card, the server updates the currentPlayerIndex in the gameState to skip the next player's turn
 - if it was a "draw-two" card, the server adds two more cards from the deck to the next player's hand

### Handling various socket messages from players: 

#### "pass-turn"
If a user requests to pass a turn (because they do not have a valid card to play), the client handles it and gives the new turn to the next player. 

#### "pick-from-dick"
If a user requests to pick a card from deck, the client pushes a card from the deck and adds it to the client's hand. At the same time, it checks if there are cards left in the deck after drawing, and if there are not, it declares the game as having been drawn. 

#### "game-won"
If a user claims they have won the game (because they have no cards left in their hand), the client emits a relevant message to all players and finishes the game. 

#### request-game-state
If a user requests the updated game state at any time, the client emits this. 