import React from "react";
import logo from "./logo.svg";
import HomePage from "./components/Home/Home";
import Landing from "./components/Landing/Landing";
import Waiting from "./components/Waiting/Waiting";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { io } from "socket.io-client";
const socket = io("http://localhost:3001", { transports: ["websocket"] });
socket.connect();

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Landing socket={socket} />} />
          <Route path="/waiting" element={<Waiting socket={socket} />} />
          <Route path="/homepage" element={<HomePage socket={socket} />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
//<Route path="/waiting" element={<Waiting socket={socket} user={user} />} />


// for landing page
//<Route path="/" element={<Landing socket={socket} />} />

// for waiting page
// <Route path="/waiting" element={<Waiting socket={socket} />} />

// for homepage:
// <Route path="/homepage" element={<HomePage socket={socket} />} />
