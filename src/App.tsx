/* eslint-disable */
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';

const getTabs = async (): Promise<chrome.tabs.Tab[]> => {
  const tabs = await chrome.tabs.query({
    url: ["https://www.youtube.com/*"]
  })
  return tabs;
}

const checkTabs = (arr1: chrome.tabs.Tab[] | undefined, arr2: chrome.tabs.Tab[]) => {
  if(!arr1 || arr2.length === 0) return false;
  if(arr1.length != arr2.length) return false;
  for(let i = 0; i < arr1.length; i++) {
    if(!(arr1[i].id === arr2[i].id && arr1[i].windowId === arr2[i].windowId && arr1[i].url === arr2[i].url)) {
      return false
    }
  }
  return true
}

const toYtTabs = ((arr: chrome.tabs.Tab[]) => {
  let res: {[key: number]: chrome.tabs.Tab} = {}
  if(!arr) return res
  for(let i = 0; i < arr.length; i++) {
    if(!arr[i].id) return res
    res[arr[i].id!] = arr[i]
  }
  return res
})

function App() {
  // const [tabs, setTabs] = useState<chrome.tabs.Tab[]>()
  useEffect(() => {
    // let tabs: chrome.tabs.Tab[] | undefined | any = chrome.storage.session.get(["CurrentTabs"])
    // getTabs().then((res) => {
    //   console.log(tabs)
    //   if(!checkTabs(tabs, res)) {
    //     chrome.storage.session.set({"CurrentTabs": toYtTabs(res)})
    //   }
    // })
    console.log(chrome.storage.local.get("songs"))
  })

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
}

export default App;