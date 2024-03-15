
import React, { useState } from 'react'
import './styles.css'
import io from 'socket.io-client';
// import { useHistory } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';


interface Props {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>;
}

// sessionStorage.setItem('name', "");
// sessionStorage.setItem('userID', "0");

function Landing({ socket }: Props) {  
//function Landing() {

    //console.log("hello world ")
    const navigate = useNavigate();
    
    const [name,setName] = useState('');
    const [userID,setUserID] = useState(0);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
        const randomNum = Math.floor(Math.random() * 899) + 100;
        setUserID(randomNum);
    };

    const handleStartGame = () => {
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    // Set the name and userID in session storage for later use
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('userID', userID.toString());

    const user = {
        name,
        userID
      };
    // const socket = io('http://localhost:3001');
    socket.emit('start-game', user);

    // Navigate to the waiting page
    // history.push('/waiting');
    navigate('/waiting');
    
    //console.log("name: ", name);
    };
      


  return (
    <div>
        <form className='input'>
        <input type='input' placeholder ='Enter player name' className="input__box" onChange={handleNameChange}/>
        <button className="input_submit" type="submit" onClick={handleStartGame}>Go</button>
        </form>
    </div>
  )
}


export default Landing