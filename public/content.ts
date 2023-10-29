/* eslint-disable */

//jest-dom is depricated; npm uninstall jest-dom && npm install @testing-library/jest-dom

//need to handle playing tab closed without being paused

let paused: boolean = false;
let lastPaused: number = 0;
let pausedFor: number = 0;
let totalPlaying: number = 0;


let id: string = ""
let title: string | any = ""
let channelInfo: HTMLElement | any = null
let channelName: string = ""
let channelURL: string = ""
let description: HTMLElement | any = null

const getLocalStorage = async () => {
    let allVideos = await chrome.storage.local.get("yt_videos")
    console.log("all videos: ", allVideos)
    return allVideos
}

const initLocalStorage = async () => {
    if(Object.keys(await getLocalStorage()).length < 1) {
        chrome.storage.local.set({"yt_videos": {} })
    }
    // chrome.storage.local.set({"yt_videos": {} })
}

const modifyLocalStorage = async (status: boolean, time: number) => {
    let ytVideos = await getLocalStorage()
    time /= 1000
    let totalWatchTime: string = ""
    let hours, minutes, seconds
    
    if(ytVideos["yt_videos"][id]) {
        ytVideos["yt_videos"][id]["status"] = status ? "paused" : "playing"
        let watchTime: string = ytVideos["yt_videos"][id]["totalTime"]
        hours = parseFloat(watchTime.split("H")[0])
        minutes = parseFloat(watchTime.split("H")[1].split("M")[0])
        seconds = parseFloat(watchTime.split("H")[1].split("M")[1].split("S")[0])
        hours += Math.floor(time/60/60)
        minutes += Math.floor((time/60)%60)
        seconds += time%60
        totalWatchTime = `${hours}H${minutes}M${seconds}S`
        ytVideos["yt_videos"][id]["totalTime"] = totalWatchTime

    }
    else {
        hours = Math.floor(time/60/60)
        minutes = Math.floor((time/60)%60)
        seconds = time%60
        totalWatchTime = `${hours}H${minutes}M${seconds}S`

        ytVideos["yt_videos"][id] = {"title": title, "channelName": channelName, "channelURL": channelURL,
                                    "status": status ? "paused" : "playing", "totalTime": totalWatchTime}
    }

    console.log("Watched for", totalWatchTime)
    await chrome.storage.local.set(ytVideos)
}



const observeElement = (element: HTMLElement, callback: Function) => {
    const observer = new MutationObserver((mutations, observer) => {
        mutations.forEach((mutation_) => {
            callback(mutation_)
        })
    })
    observer.observe(element, {
        subtree: false,
        attributes: true
    })
}

const handleChange = (mutation_: any) => {
    let status: string = mutation_.target.attributes.class?.textContent
    let currentTime: number = 0
    if(status) {
        // Get current time in video
        // currentTime = (document.getElementsByClassName("ytp-time-current")[0])?.innerHTML

        //playing => paused
        if(status.includes("paused-mode") && !status.includes("playing-mode") && !paused) {
            paused = true
            currentTime = Date.now()

            totalPlaying += currentTime - pausedFor - lastPaused

            console.log(`Played for ${totalPlaying/1000} seconds`)
            console.log("paused")

            modifyLocalStorage(paused, currentTime - pausedFor - lastPaused)

            lastPaused = currentTime
        }

        //paused => playing
        else if(status.includes("playing-mode") && !status.includes("paused-mode") && paused) {
            paused = false;
            currentTime = Date.now()

            pausedFor = currentTime - lastPaused

            console.log(`Paused for ${pausedFor/1000} seconds`)
            console.log("playing")
        }

        //buffering (= previous state) change later to be equal to paused?
        else if(status.includes("buffering-mode")) {
            // console.log("buffering")
            // currentTime = Date.now()
            // console.log(currentTime)
        }
    }
}

const inject_script = () => {
    lastPaused = Date.now()

    id = (window.location.toString()).split("watch?v=").slice(-1)[0].split("&")[0]
    title = document.querySelector('#title .style-scope .ytd-watch-metadata')?.innerHTML

    channelInfo = document.getElementsByClassName("style-scope ytd-channel-name complex-string")[0].firstChild
    channelName = channelInfo.innerHTML
    channelURL = channelInfo.href
    
    description = document.getElementById("description-inner")
    console.log(id, title, channelName)


    if(!id || !title || !channelName) {
        console.log("Cannot process")
        return
    }

    initLocalStorage()

    let player = document.getElementById("movie_player")
    if(player) {
        observeElement(player, handleChange)
    }

    console.log("Done")

}

const main = () => {
    let jsCheck = setInterval(checkJS, 10);
    function checkJS() {
        if(document.getElementById("movie_player") && document.getElementsByClassName("style-scope ytd-channel-name complex-string")[0]) {
            clearInterval(jsCheck)
            inject_script()
        }
    }
}

window.addEventListener("load", main, false);