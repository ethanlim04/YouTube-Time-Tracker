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


const getVideoTitle = (tabId: number): string | any => {
  chrome.scripting.executeScript({target: {tabId: tabId}, files: ['getTitle.js']}, (res) => {
    // console.log(res)
    return res
  })
}

const getPlaying = (): {[key: number]: chrome.tabs.Tab} | any => {
  chrome.storage.session.get("playing").then((playing) => {
    
  })
  
}

chrome.tabs.onActivated.addListener((currentTab) => {
  // console.log("Tab selected")
  chrome.tabs.get(currentTab.tabId).then((tab) => {
    if(tab.url?.includes("youtube.com/watch?v=")) {
      updateTabs().then((tabs) => {
        // let tabs = updateTabs()
        // console.log(".then")
        console.log(tabs)
        if(!tabs[tab.id!]) tabs[tab.id!] = tab
        chrome.storage.session.set({"CurrentTabs": tabs})
        // console.log(tabs)
      })
    }
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("UPDATED")
  if(tab.url?.includes("youtube.com/watch?v=")) {
    console.log(Object.keys(changeInfo))
    if(Object.keys(changeInfo).indexOf("audible") != -1) {
      getVideoTitle(tabId).then((title) => {
        if(changeInfo.audible) {
          console.log(title)
        }
      })

    }
  }
})


// export {}