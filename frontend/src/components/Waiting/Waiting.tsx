import React, { useState } from "react";
import "./styles.css";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

/*
interface Props {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>;
    user: any;
}

function Waiting({ socket }: Props, { user }: Props) {  
*/
interface Props {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>;
}

function Waiting({ socket }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for "game-started" event from server
    socket.on("game-started", () => {
      // Navigate to the Home page
      navigate("/homepage");
    });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <p style={{ fontSize: "24px", textAlign: "center" }}>
        Please wait while players join...
      </p>
    </div>
  );
}

export default Waiting;
