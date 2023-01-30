import { allowedNodeEnvironmentFlags } from "process";

/* eslint-disable */
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

const toYtTabs = ((arr: chrome.tabs.Tab[]):  {[key: number]: chrome.tabs.Tab} => {
  let res: {[key: number]: chrome.tabs.Tab} = {}
  if(!arr) return res
  for(let i = 0; i < arr.length; i++) {
    if(!arr[i].id) return res
    res[arr[i].id!] = arr[i]
  }
  return res
})

// const getYoutubeTabs = (): Promise<{key: chrome.tabs.Tab[]}> | any => {
//   return chrome.storage.session.get(["CurrentTabs"])
// }

const updateTabs = (): {[key: number]: chrome.tabs.Tab} | any => {
  let tabs: chrome.tabs.Tab[] | undefined | any = chrome.storage.session.get(["CurrentTabs"])
  getTabs().then((res) => {
    console.log(tabs)
    if(!checkTabs(tabs, res)) {
      let result = toYtTabs(res)
      chrome.storage.session.set({"CurrentTabs": result}).then(() => {
        return result
      })
    }
  })
}

const getPlaying = (): {[key: number]: chrome.tabs.Tab} | any => {
  chrome.storage.session.get("playing").then((playing) => {
    
  })
  
}

chrome.tabs.onActivated.addListener((currentTab) => {
    chrome.tabs.get(currentTab.tabId).then((tab) => {
      if(tab.url?.includes("youtube.com")) {
        updateTabs().then((tabs) => {
          if(!tabs[tab.id!]) tabs[tab.id!] = tab
          else {
            if(tabs[tab.id!].audible)
          }
          chrome.storage.session.set({"CurrentTabs": tabs})
          console.log(tabs)
        })
      }
    })
})

export {}