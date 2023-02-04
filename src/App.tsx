/* eslint-disable */
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';

function App() {
  // const [tabs, setTabs] = useState<chrome.tabs.Tab[]>()
  const [songs, setSongs] = useState<{title: chrome.tabs.Tab}>()

  useEffect(() => {
    chrome.storage.local.get("songs").then((data) => {
      setSongs(data["songs"])
    })
    return;
  }, [])
  if(songs) {
    console.log('songs ', songs)
    const res = Object.keys(songs!).map(song => <li>{song}</li>)
    return (
      <div className="App">
        <ul>{res}</ul>
      </div>
    )
  }


  return (
    <div className="App">
      {/* <ul>{res}</ul> */}
    </div>
  );


  // return (
  //   <div className="App">
  //     <header className="App-header">
  //       <img src={logo} className="App-logo" alt="logo" />
  //       <p>
  //         Edit <code>src/App.tsx</code> and save to reload.
  //       </p>
  //       <a
  //         className="App-link"
  //         href="https://reactjs.org"
  //         target="_blank"
  //         rel="noopener noreferrer"
  //       >
  //         Learn React
  //       </a>
  //       <p>Current Time: {currTime}</p>
  //     </header>
  //   </div>
  // );
}

export default App;