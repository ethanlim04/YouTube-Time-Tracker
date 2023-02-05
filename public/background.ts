/* eslint-disable */

const getTabs = async (): Promise<chrome.tabs.Tab[]> => {
  const tabs = await chrome.tabs.query({
    url: ["https://www.youtube.com/watch*"]
  })
  return tabs;
}

const checkTabs = (arr1: {[key: number]: {tab: chrome.tabs.Tab, title: string}} | undefined, arr2: {[key: number]: {tab: chrome.tabs.Tab, title: string}}) => {
  if(!arr1 || Object.keys(arr2).length === 0) {
    console.log("Storage is Null")
    return false
  }
  if(Object.keys(arr1).length != Object.keys(arr2).length) {
    console.log("Length Different")
    return false
  }
  for(let i = 0; i < Object.keys(arr1).length; i++) {
    if(Object.keys(arr2).indexOf(Object.keys(arr1)[i]) == -1) return false
  }
  for(let i = 0; i < Object.keys(arr1).length; i++) {
    let keyId = Object.keys(arr1)[i]
    if(!(arr1[keyId].tab.id === arr2[keyId].tab.id && arr1[keyId].tab.windowId === arr2[keyId].tab.windowId && arr1[keyId].tab.url === arr2[keyId].tab.url && arr1[keyId].tab.playing === arr2[keyId].tab.playing)) {
      // console.log("DIFFERENT:", arr1[keyId], arr2[keyId])
      console.log("Tab information different")
      return false
    }
  }
  return true
}


const toLocalStorage = (songs) => {
  chrome.storage.local.set({"songs": songs})
}

const getVideoTitle = (tab: chrome.tabs.Tab): string => {
  let tempTitle = String(tab.title).trim()
  if(tempTitle.length > 10) {
    if(tempTitle[0] === "(")
      return tempTitle.substring(3, tempTitle.length - 10).trim()
  }
  return tempTitle.substring(0, tempTitle.length - 10).trim()
}

const toYtTabs = ((arr: chrome.tabs.Tab[]):  {[key: number]: {tab: chrome.tabs.Tab, title: string}} => {
  let res: {[key: number]: {tab: chrome.tabs.Tab, title: string}} = {}
  if(!arr) return res
  for(let i = 0; i < arr.length; i++) {
    if(!arr[i].id) return res
    res[arr[i].id!] = {"tab": arr[i], "title": getVideoTitle(arr[i])}
  }
  return res
})

const updateTabs = async (): Promise<any> => {  
  let tabs = await chrome.storage.sync.get("CurrentTabs")
  let result = toYtTabs(await getTabs())
  // console.log("CHECK TABS", checkTabs(tabs["CurrentTabs"], result))
  if(!checkTabs(tabs["CurrentTabs"], result)) {
    chrome.storage.sync.set({"CurrentTabs": result}).then(() => {
      return result
    })
  }
  else {
    return result
  }
}


const setPlaying = (playing: {[title: string]: {lastStart: number, lastEnd: number, totalPlayTime: number, lastPlaying: boolean, totalPlayTimeDates: {[day: string]: number}}}, tab: chrome.tabs.Tab, title: string, playingStatus: boolean, currentTime: number) => {
  let date: string = String(new Date().toISOString().slice(0, 10))
  if(Object.keys(playing).indexOf(title) == -1) {
    let dateObj = {}
    dateObj[date] = 0;
    if(playingStatus) playing[title] = {lastStart: currentTime, lastEnd: 0, lastPlaying: playingStatus, totalPlayTime: 0, totalPlayTimeDates: dateObj}
    else playing[title] = {lastStart: 0, lastEnd: 0, lastPlaying: playingStatus, totalPlayTime: 0, totalPlayTimeDates: dateObj}
  }
  else {
    if(playingStatus && !playing[title].lastPlaying) { //Paused then started playing again
      playing[title].lastStart = currentTime // - 500
      playing[title].lastPlaying = playingStatus
    }
    else if(!playingStatus && playing[title].lastPlaying) { //Playing then paused
      playing[title].lastEnd = currentTime - 1500 //- 3500
      if(playing[title].lastEnd - playing[title].lastStart > 0) {
        playing[title].totalPlayTime += playing[title].lastEnd - playing[title].lastStart
        
        if(typeof(playing[title].totalPlayTimeDates[date]) === "undefined") playing[title].totalPlayTimeDates[date] = 0
        playing[title].totalPlayTimeDates[date] += playing[title].lastEnd - playing[title].lastStart
      }
      playing[title].lastPlaying = playingStatus
      // console.log(title, " updated to playing = ", playingStatus, "and added ", (playing[title].lastEnd - playing[title].lastStart)/1000, " seconds")
    }
    // else { //Playing => Playing or Paused => Paused????? (Or deleting or moving from paused tab)
    //   console.log("Did not switch status")
    // }
  }
  return playing
}

const updatePlaying = (tab: chrome.tabs.Tab, title: string, playingStatus: boolean | undefined, currentTime: number) => {
  // console.log("UPDATING SONG: ", title, playingStatus)
  chrome.storage.sync.get("playing").then((res) => {
    // console.log(Object.keys(res))
    let playing = res["playing"]
    if(!playing) playing = {}
    if(!playingStatus) playingStatus = false
    playing = setPlaying(playing, tab, title, playingStatus, currentTime)
    chrome.storage.sync.set({"playing": playing})
    toLocalStorage(playing)
    updateTotalTime()
  })
}

const updateTotalTime = () => {
  let totalTime: number = 0;
  let totalTimeDate: number = 0;
  let date = String(new Date().toISOString().slice(0, 10))
  chrome.storage.sync.get("playing").then((data) => {
    const playing: {title: {lastPlaying: boolean, lastStart: number, lastEnd: number, totalPlayTime: number, totalPlayTimeDates: {[day: string]: number}}} = data["playing"]
    for(let song in playing) {
      totalTime += playing[song].totalPlayTime
      if(typeof(playing[song].totalPlayTimeDates[date]) != "undefined") {
        totalTimeDate += playing[song].totalPlayTimeDates[date]
      }
    }
    chrome.storage.local.set({"totalTime": totalTime})

    chrome.storage.local.get("totalTimeDate").then((res) => {
      let temp = res["totalTimeDate"]
      if(!temp) temp = {}
      temp[date] = totalTimeDate
      chrome.storage.local.set({"totalTimeDate": temp})
    })
  })
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Change status playing??
  // console.log("CHANGE INFO:", changeInfo)

  //URL of tab changed (before new video loads, after current video ends) => Stop current video
  let currentTime = Date.now()
  if(changeInfo.url) {
    chrome.storage.sync.get("CurrentTabs").then((tabs) => {
      if(tabs["CurrentTabs"]) {
        if(Object.keys(tabs["CurrentTabs"]).indexOf(String(tabId)) != -1) {
          // console.log("VIDEO CHANGED: ", tabs["CurrentTabs"][tabId].title)
          updatePlaying(tab, tabs["CurrentTabs"][tabId].title, false, currentTime)
        }
      }
    })
  }
  //Check when tab title updates (url changes => page loads => title changes)
  //Title of tab changed (after new video loads) => Start new video, update tabs
  if(changeInfo.title) {
    if(tab.url?.includes("youtube.com/watch?v=")) {
      updatePlaying(tab, getVideoTitle(tab), tab.audible, currentTime)
      updateTabs()
    }
  }

  //Video play/paused => Change status of video
  if(tab.url?.includes("youtube.com/watch?v=")) {
    if(Object.keys(changeInfo).indexOf("audible") != -1) {
      updatePlaying(tab, getVideoTitle(tab), changeInfo.audible, currentTime)
    }
  }
})

//Tab with video deleted
chrome.tabs.onRemoved.addListener((closedTab, removeInfo) => {
  let currentTime = Date.now()
  chrome.storage.sync.get("CurrentTabs").then((tabs) => {
    // console.log("URL", tabs["CurrentTabs"][closedTab].tab.url)

    //If whole window is closed
    if(removeInfo.isWindowClosing) {
      console.log("WINDOW CLOSED")
      chrome.storage.sync.get("playing").then((data) => {
        let playing: {[title: string]: {lastPlaying: boolean, lastStart: number, lastEnd: number, totalPlayTime: number, totalPlayTimeDates: {[day: string]: number}}} = data["playing"]
        for(const tab in tabs["CurrentTabs"]) {
          if(tabs["CurrentTabs"][tab].tab.windowId === removeInfo.windowId) {
            // console.log("UPDATING: ", tabs["CurrentTabs"][tab].title)
            playing = setPlaying(playing, tabs["CurrentTabs"][tab].tab, tabs["CurrentTabs"][tab].title, false, currentTime)
          }
        }
        chrome.storage.sync.set({"playing": playing})
        toLocalStorage(playing)
        updateTotalTime()
      })
      updateTabs()
    }

    // //If only one tab is closed
    else {
      if(tabs["CurrentTabs"][closedTab].tab.url.includes("youtube.com/watch?v=")) {
        console.log("updating time", tabs["CurrentTabs"][closedTab].title)
        updatePlaying(tabs["CurrentTabs"][closedTab].tab, tabs["CurrentTabs"][closedTab].title, false, currentTime)
        updateTabs()
      }
    }

    //Update at the end, after pausing all closed tabs (when window is closed)
    // updateTabs()
  })
})

//Tab with video clicked
chrome.tabs.onActivated.addListener((currentTab) => {
  chrome.tabs.get(currentTab.tabId).then((tab) => {
    if(tab.url?.includes("youtube.com/watch?v=")) {
      updateTabs().then((tabs) => {
        if(!tabs[tab.id!]) tabs[tab.id!] = tab
        chrome.storage.sync.set({"CurrentTabs": tabs})
      })
    }
  })
})

// export {}