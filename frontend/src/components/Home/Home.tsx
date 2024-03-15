import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import "./Home.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// an interface for the props that we use
interface HomePageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
}

interface Card {
  color: string;
  value: string;
  mark: string;
}

function HomePage({ socket }: HomePageProps) {
  // const navigate = useNavigate();

  // Get the name and userID from session storage
  const name = sessionStorage.getItem("name");
  const userIDStr = sessionStorage.getItem("userID");
  const userID = userIDStr ? parseInt(userIDStr) : undefined;
  const [currentPlayerId, setCurrentPlayerId] = useState(0);
  const [currentPlayerIndex, setcurrentPlayerIndex] = useState(0);
  const [haveDrawn, setHaveDrawn] = useState(0);
  const [drawPile, setDrawPile] = useState<Card[]>([]);
  const [gameEnded, setGameEnded] = useState(false);

  // get names of players
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [name3, setName3] = useState("");
  const [name4, setName4] = useState("");

  //const currentPlayerIndex = gameState.currentPlayerIndex;
  //const [currentPlayerName, setCurrentPlayerName] = useState('');
  //var currentPlayerId = 0;

  const [gameState, setGameState] = useState(null); // state to hold game state received from server
  const [myCards, setMyCards] = useState<Card[]>([]);
  //const [topCard, setTopCard] = useState<Card>();
  const [topCard, setTopCard] = useState<Card>({
    color: "",
    value: "",
    mark: "",
  });

  const [selectedCardIndex, setSelectedCardIndex] = useState(-1); // state to hold the index of the selected card in the current player's hand

  useEffect(() => {
    socket.emit("game-loaded");
  }, []);

  useEffect(() => {
    socket.on("game-started", () => {
      socket.emit("request-game-state");
    });
  }, []);

  // When someone has won
  useEffect(() => {
    socket.on("game-has-been-won", (winningID, winningName) => {
      if (winningID === userID) {
        alert("Congratulations! You have won!");
      } else {
        alert(`${winningName} has won the game.`);
      }
      setGameEnded(true);
    });
  }, []);

  // When game has been drawn
  useEffect(() => {
    socket.on("game-drawn", () => {
      alert(`Game has been drawn.`);
      setGameEnded(true);
    });
  }, []);

  useEffect(() => {
    //socket.emit("game-loaded");

    // Listen for "game-started" event from server
    const handleGameStateUpdate = (gameState: any) => {
      console.log(gameState);
      setGameState(gameState); // update game state
      // set myCards to the cards for the current player
      setcurrentPlayerIndex(gameState.currentPlayerIndex);
      setDrawPile(gameState.deck);
      //const currentPlayerIndex = gameState.currentPlayerIndex;
      console.log("Current Player Index: ", currentPlayerIndex);
      //console.log("gameState.playerIds[0] ", gameState.playerIds[0]);

      setCurrentPlayerId(gameState.playerIds[gameState.currentPlayerIndex]);

      //currentPlayerId = gameState.playerIds[currentPlayerIndex];
      console.log("Current Player ID: ", currentPlayerId);

      // set this user's own cards
      if (userID) {
        setMyCards(gameState.hands[userID]);
      }

      // setMyCards(currentPlayer.cards);
      console.log("Game state: ", gameState);
      console.log("My cards:", myCards);

      // set names of players (to display on board) if they are in game
      if (gameState.playerNames[0]) {
        setName1(gameState.playerNames[0]);
      }
      if (gameState.playerNames[1]) {
        setName2(gameState.playerNames[1]);
      }
      if (gameState.playerNames[2]) {
        setName3(gameState.playerNames[2]);
      }
      if (gameState.playerNames[3]) {
        setName4(gameState.playerNames[3]);
      }

      setTopCard(gameState.discardPile[gameState.discardPile.length - 1]);
    };

    socket.on("update-game-state", handleGameStateUpdate);

    return () => {
      // Clean up the socket listener when the component unmounts
      socket.off("update-game-state", handleGameStateUpdate);
    };
  }, []);

  // function to check if it is current player's turn
  //   if (userID === currentPlayerId) {
  //     // console.log("It's your turn!");
  //   }

  const handleDrawCard = () => {
    // can only draw if it is this player's turn
    if (userID === currentPlayerId) {
      // can only draw card if the player has not already drawn in this turn
      if (haveDrawn === 0) {
        socket.emit("pick-from-deck", { userID });
        setHaveDrawn(1);
      }
    }
  };

  const handlePass = () => {
    // can only pass if it is this player's turn
    if (userID === currentPlayerId) {
      // only let player pass if they have drawn a card
      if (haveDrawn === 1) {
        // reset haveDrawn
        setHaveDrawn(0);
        socket.emit("pass-turn", { userID });
      }
    }
  };

  const canPlayCard = (card: Card) => {
    // get the top card on the discard pile
    // check if gameState is not null
    if (!gameState) {
      return false;
    }
    if (!topCard) {
      return false;
    }

    if (gameEnded === true) {
      console.log("gameEnded: ", gameEnded);
      return false;
    }
    //const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    // check if it's the current player's turn
    // if it is not, return false, which ensures that the player cannot click any buttons
    // and therefore cannot make any moves
    if (userID !== currentPlayerId) {
      return false;
    }

    // check if the player has any alternative cards to play
    const hasAlternativeCard = myCards.some(
      (playerCard: any) =>
        playerCard.color === topCard.color && playerCard.value !== "draw-4"
    );

    // check if the card matches the color or value of the top card or if it's a wild card
    // if the card is a draw-4 card, the player must not have any alternative cards to play
    return (
      (card.color === topCard.color ||
        card.value === topCard.value ||
        card.color === "black" ||
        topCard.color === "black") &&
      !(card.value === "draw-4" && hasAlternativeCard) &&
      !(
        (card.value === "wild" || card.value === "draw-4") &&
        (topCard.value === "draw-4" || topCard.value === "draw-two")
      )
    );
  };

  // function to handle card selection
  const handleCardClick = (index: number) => {
    // check if the selected card can be played
    const selectedCard = myCards[index];

    console.log("Selected card: ", selectedCard);

    if (canPlayCard(selectedCard)) {
      setSelectedCardIndex(index);
    }
  };

  // function to handle playing a selected card
  const playSelectedCard = () => {
    // check if a card is selected
    if (selectedCardIndex !== -1) {
      if (userID === currentPlayerId) {
        /* /* Code to let user select color when playing a wild card: 
        // if it is a wild card, ask user for color. then emit selected color along with the card and user info
        const validColors = ["red", "blue", "green", "yellow"];

        if (myCards[selectedCardIndex].color === "black") {
          let color = "";
          while (!validColors.includes(color)) {
            const color2 = prompt("Choose a color: red, blue, green, yellow");
            if (color2 === null) {
              // The user clicked cancel or closed the dialog and received value is null
              return;
            } else {
              color = color2;
            }
          }
          // console.log("Color: ", color);
          socket.emit("card-played", {
            cardIndex: selectedCardIndex,
            userID: userID
            // select_color: color,
          });
        } else {
          // if it is a non-wild card, emit a "card-played" event to the server with the selected card without color
          socket.emit("card-played", {
            cardIndex: selectedCardIndex,
            userID: userID,
          });
        }
        */

        // when we don't need to care about handling wild cards and their colors separately:
        socket.emit("card-played", {
          cardIndex: selectedCardIndex,
          userID: userID,
        });

        console.log("Card played: ", myCards[selectedCardIndex]);
      }

      // Winning condition
      if (myCards.length === 1) {
        socket.emit("game-won", { name: name, userID: userID });
        // alert("Congratulations! You have won!");
      }

      // clear the selected card index
      setSelectedCardIndex(-1);

      // reset haveDrawn to 0 for future turn
      setHaveDrawn(0);
    }
  };

  //<div className="card discard-pile black">
  return (
    <>
      <div className="main-container">
        <div className="game-container">
          <div className="heading-container">
            <h1>UNO</h1>
          </div>
          <div className="game-table-container">
            <div className="game-table">
              <div className="card-area">
                <div className="card discard-pile black">
                  <span className="inner">
                    <span className="mark">U</span>
                  </span>
                </div>
                <div className={`card ${topCard.value} ${topCard.color}`}>
                  <span className="inner">
                    <span className="mark">{topCard.mark}</span>
                  </span>
                </div>
              </div>

              <div className="game-players-container">
                <div className="player-tag player-one">{name1}</div>
              </div>

              <div className="game-players-container">
                <div className="player-tag player-two">{name2}</div>
              </div>

              <div className="game-players-container">
                <div className="player-tag player-three">{name3}</div>
              </div>

              <div className="game-players-container">
                <div className="player-tag player-four">{name4}</div>
              </div>
            </div>
          </div>
          <div className="select-rang-container">
            <button
              className="button-select-rang"
              onClick={handleDrawCard}
              disabled={gameEnded}
            >
              Pick from deck
            </button>
            <button
              className="button-select-rang"
              onClick={handlePass}
              disabled={gameEnded}
            >
              Pass
            </button>
          </div>
        </div>
        <div className="messages-and-cards-container">
          <div className="right-side-container messages-container">
            <h1>Messages</h1>
            <div className="message-box">
              <div className="message-content-container">
                {`It's player ${currentPlayerIndex + 1}'s turn`}
              </div>
              <div className="message-content-container">
                Let's play Uno!
              </div>
            </div>
          </div>
          <div className="right-side-container my-cards-container">
            <h1>My Cards</h1>
            <div className="my-cards-inner-container">
              {myCards.map((card: Card, index: number) => (
                <div
                  className={`card ${card.value} ${card.color} ${
                    canPlayCard(card) ? "selectable" : ""
                  } ${selectedCardIndex === index ? "selected" : ""}`}
                  key={index}
                  onClick={() => handleCardClick(index)}
                >
                  <span className="inner">
                    <span className="mark">{card.mark}</span>
                  </span>
                </div>
              ))}
            </div>
            <button onClick={playSelectedCard} disabled={gameEnded}>
              Play selected card
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
export default HomePage;
