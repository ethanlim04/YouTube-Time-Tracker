/* eslint-disable */
const getTabs = async (): Promise<chrome.tabs.Tab[]> => {
  const tabs = await chrome.tabs.query({
    url: ["https://www.youtube.com/*"]
  })
  return tabs;
}

const checkTabs = (arr1: {[key: number]: chrome.tabs.Tab} | undefined, arr2: {[key: number]: chrome.tabs.Tab}) => {
  // console.log("LENGTHS:", arr1?.length, arr2.length)
  if(!arr1 || Object.keys(arr2).length === 0) return false
  if(Object.keys(arr1).length != Object.keys(arr2).length) return false
  for(let i = 0; i < Object.keys(arr1).length; i++) {
    if(Object.keys(arr2).indexOf(Object.keys(arr1)[i]) == -1) return false
  }
  for(let i = 0; i < Object.keys(arr1).length; i++) {
    let keyId = Object.keys(arr1)[i]
    if(!(arr1[keyId].id === arr2[keyId].id && arr1[keyId].windowId === arr2[keyId].windowId && arr1[keyId].url === arr2[keyId].url && arr1[keyId].playing === arr2[keyId].playing)) {
      console.log("DIFFERENT:", arr1[keyId], arr2[keyId])
      return false
    }
  }
  return true
}


const toLocalStorage = (songs) => {
  chrome.storage.local.set({"songs": songs})
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

const updateTabs = (): {[key: number]: chrome.tabs.Tab} | any => {  
  chrome.storage.session.get("CurrentTabs").then((tabs) => {
    getTabs().then((res) => {
      let result = toYtTabs(res)
      console.log(checkTabs(tabs["CurrentTabs"], result))
      if(!checkTabs(tabs["CurrentTabs"], result)) {
        chrome.storage.session.set({"CurrentTabs": result}).then(() => {
          // console.log("updateTabs")
          return result
        })
      }
      else {
        return result
      }
    })
  })
}


chrome.tabs.onActivated.addListener((currentTab) => {
  // console.log("Tab selected")
  chrome.tabs.get(currentTab.tabId).then((tab) => {
    if(tab.url?.includes("youtube.com/watch?v=")) {
      updateTabs().then((tabs) => {
        console.log(tabs)
        if(!tabs[tab.id!]) tabs[tab.id!] = tab
        chrome.storage.session.set({"CurrentTabs": tabs})
      })
    }
  })
})

const getVideoTitle = (tabId: number): Promise<any> => {
  return chrome.scripting.executeScript({target: {tabId: tabId}, files: ['getTitle.js']}).then((res) => {
    // console.log(res)
    return String(res[0].result).trim()
  })
}

const updatePlaying = (tab: chrome.tabs.Tab, title: string, playingStatus: boolean | undefined, currentTime: number) => {
  chrome.storage.session.get("playing").then((res) => {
    // console.log(Object.keys(res))
    let playing = res["playing"]
    if(!playing) playing = {}
    if(Object.keys(playing).indexOf(title) == -1) {
      if(playingStatus) playing[title] = {lastStart: currentTime, lastEnd: 0, lastPlaying: playingStatus, totalPlayTime: 0}
      else playing[title] = {lastStart: 0, lastEnd: 0, lastPlaying: playingStatus, totalPlayTime: 0}
    }
    else {
      if(playingStatus && !playing[title].lastPlaying) { //Paused then started playing again
        if(playing[title].lastEnd - playing[title].lastStart > 0) playing[title].totalPlayTime += (playing[title].lastEnd - playing[title].lastStart)
        playing[title].lastStart = currentTime // - 500
        playing[title].lastPlaying = playingStatus
      }
      else if(!playingStatus && playing[title].lastPlaying) { //Playing then paused
        playing[title].lastEnd = currentTime //- 3500
        if(playing[title].lastEnd - playing[title].lastStart > 0) playing[title].totalPlayTime += playing[title].lastEnd - playing[title].lastStart
        playing[title].lastPlaying = playingStatus
      }
      else { //Playing => Playing or Paused => Paused?????
        console.log("Did not switch status")
      }
    }
    chrome.storage.session.set({"playing": playing})
    toLocalStorage(playing)
  })
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Change status playing??
    if(changeInfo.url) {
      console.log("YES")
      chrome.storage.session.get("CurrentTabs").then((tabs) => {
        if(Object.keys(tabs["CurrentTabs"]).indexOf(String(tabId)) != -1) {
            console.log("WAS YOUTUBE")
          }
      })

    }
    
    
    if(tab.url?.includes("youtube.com/watch?v=")) {
    // console.log(Object.keys(changeInfo))
    let currentTime = Date.now()
    // if(Object.keys(changeInfo).indexOf("url") != -1) {
    //   console.log("URL CHANGE!!!!!")
    // }
    if(Object.keys(changeInfo).indexOf("audible") != -1) {
      console.log("Audible", changeInfo.audible)
      getVideoTitle(tabId).then((title) => {
        updatePlaying(tab, title, changeInfo.audible, currentTime)
      })


      // chrome.scripting.executeScript({target: {tabId: tabId}, files: ['getTitle.js']}).then((title) => {
      //   console.log(title)
      // })
      // let title = "【誕生日に】Ubiquitous dB／湊あくあ【歌ってみた】"
      // updatePlaying(tab, title, changeInfo.audible)
    }
  }
})


// export {}