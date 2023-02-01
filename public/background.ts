/* eslint-disable */

// const checkTabs = (arr1: {[key: number]: chrome.tabs.Tab} | undefined, arr2: {[key: number]: chrome.tabs.Tab}) => {
//   // console.log("LENGTHS:", arr1?.length, arr2.length)
//   if(!arr1 || Object.keys(arr2).length === 0) return false
//   if(Object.keys(arr1).length != Object.keys(arr2).length) return false
//   for(let i = 0; i < Object.keys(arr1).length; i++) {
//     if(Object.keys(arr2).indexOf(Object.keys(arr1)[i]) == -1) return false
//   }
//   for(let i = 0; i < Object.keys(arr1).length; i++) {
//     let keyId = Object.keys(arr1)[i]
//     if(!(arr1[keyId].id === arr2[keyId].id && arr1[keyId].windowId === arr2[keyId].windowId && arr1[keyId].url === arr2[keyId].url && arr1[keyId].playing === arr2[keyId].playing)) {
//       console.log("DIFFERENT:", arr1[keyId], arr2[keyId])
//       return false
//     }
//   }
//   return true
// }


// const toYtTabs = ((arr: chrome.tabs.Tab[]):  {[key: number]: chrome.tabs.Tab} => {
//   let res: {[key: number]: chrome.tabs.Tab} = {}
//   if(!arr) return res
//   for(let i = 0; i < arr.length; i++) {
//     if(!arr[i].id) return res
//     res[arr[i].id!] = arr[i]
//   }
//   return res
// })

// const updateTabs = (): {[key: number]: chrome.tabs.Tab} | any => {  
//   chrome.storage.session.get("CurrentTabs").then((tabs) => {
//     getTabs().then((res) => {
//       let result = toYtTabs(res)
//       console.log(checkTabs(tabs["CurrentTabs"], result))
//       if(!checkTabs(tabs["CurrentTabs"], result)) {
//         chrome.storage.session.set({"CurrentTabs": result}).then(() => {
//           // console.log("updateTabs")
//           return result
//         })
//       }
//       else {
//         return result
//       }
//     })
//   })
// }

// const getVideoTitle = (tabId: number): Promise<any> => {
//   return chrome.scripting.executeScript({target: {tabId: tabId}, files: ['getTitle.js']}).then((res) => {
//     // console.log(res)
//     return String(res[0].result).trim()
//   })
// }
// getVideoTitle(tabId).then((title) => {
//   updatePlaying(tab, title, changeInfo.audible, currentTime)
// })
const getTabs = async (): Promise<chrome.tabs.Tab[]> => {
  const tabs = await chrome.tabs.query({
    url: ["https://www.youtube.com/watch*"]
  })
  return tabs;
}

const checkTabs = (arr1: {[key: number]: {tab: chrome.tabs.Tab, title: string}} | undefined, arr2: {[key: number]: {tab: chrome.tabs.Tab, title: string}}) => {
  // console.log("LENGTHS:", arr1?.length, arr2.length)
  if(!arr1 || Object.keys(arr2).length === 0) {
    console.log("ARR1 NULL")
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
      console.log("DIFFERENT:", arr1[keyId], arr2[keyId])
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
      return tempTitle.substring(3, tempTitle.length - 10)
  }
  return tempTitle.substring(0, tempTitle.length - 10)
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



// const updateTabs = (): {[key: number]: {tab: chrome.tabs.Tab, title: string}} | any => {  
//   chrome.storage.session.get("CurrentTabs").then((tabs) => {
//     getTabs().then((res) => {
//       let result = toYtTabs(res)
      
//       console.log(checkTabs(tabs["CurrentTabs"], result))
//       if(!checkTabs(tabs["CurrentTabs"], result)) {
//         chrome.storage.session.set({"CurrentTabs": result}).then(() => {
//           return result
//         })
//       }
//       else {
//         return result
//       }
//     })
//   })
// }
// {[key: number]: {tab: chrome.tabs.Tab, title: string}}
const updateTabs = async (): Promise<any> => {  
  let tabs = await chrome.storage.session.get("CurrentTabs")
  let result = toYtTabs(await getTabs())
  console.log("CHECK TABS", checkTabs(tabs["CurrentTabs"], result))
  if(!checkTabs(tabs["CurrentTabs"], result)) {
    chrome.storage.session.set({"CurrentTabs": result}).then(() => {
      return result
    })
  }
  else {
    return result
  }
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
    let currentTime = Date.now()
    if(changeInfo.url) {
      // console.log("YES")
      chrome.storage.session.get("CurrentTabs").then((tabs) => {
        if(tabs["CurrentTabs"]) {
          if(Object.keys(tabs["CurrentTabs"]).indexOf(String(tabId)) != -1) {
            console.log(tabs["CurrentTabs"][tabId].title)
            updatePlaying(tab, tabs["CurrentTabs"][tabId].title, false, currentTime)
            updateTabs().then((currentTabs) => {
              chrome.storage.session.set({"CurrentTabs": currentTabs})
            })
          }
        }
      })

    }
    
    
    if(tab.url?.includes("youtube.com/watch?v=")) {
    // console.log(Object.keys(changeInfo))
    if(Object.keys(changeInfo).indexOf("audible") != -1) {
      console.log("Audible", changeInfo.audible)
      updatePlaying(tab, getVideoTitle(tab), changeInfo.audible, currentTime)

      // chrome.scripting.executeScript({target: {tabId: tabId}, files: ['getTitle.js']}).then((title) => {
      //   console.log(title)
      // })
      // let title = "【誕生日に】Ubiquitous dB／湊あくあ【歌ってみた】"
      // updatePlaying(tab, title, changeInfo.audible)
    }
  }
})


// export {}