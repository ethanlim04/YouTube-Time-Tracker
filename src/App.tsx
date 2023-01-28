import React from 'react';
import logo from './logo.svg';
import './App.css';
function App() {
  
  function test(){
    chrome.tabs.query({active: true, currentWindow: true}, (tabs: any) => {
      const activeTabId: number = tabs[0].id
      chrome.scripting.executeScript({
        target: {tabId: activeTabId},
        func: () => alert("working now")
      })
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
  // return (
  //   <div className="App">
  //     <button onClick={test}>Send Alert</button>
  //   </div>
  // )
}

export default App;
