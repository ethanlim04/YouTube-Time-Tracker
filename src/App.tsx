/* eslint-disable */
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import "./vendor.scss"
import {
  Tile,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  DataTableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarMenu,
  TableToolbarAction,
  TableToolbarSearch,
  Button,
  Checkbox,
  Toggle
} from 'carbon-components-react'

function App() {
  // const [tabs, setTabs] = useState<chrome.tabs.Tab[]>()
  const [songs, setSongs] = useState<{[title: string]: {lastStart: number, lastEnd: number, totalPlayTime: number, lastPlaying: boolean, totalPlayTimeDates: {[day: string]: number}}}>()
  const [data, setData] = useState<DataTableRow<string>[]>([])
  const [totalTime, setTotalTime] = useState<number>()
  const [totalTimeDate, setTotalTimeDate] = useState<{[day: string]: number}>()
  const [date, setDate] = useState<string>()
  const [hidePaused, setCheckbox] = useState<boolean>(false)
  const [dayDataOnly, setDayDataOnly] = useState<boolean>(false)

  useEffect(() => {
    chrome.storage.local.get("songs").then((res) => {

      // if(typeof(hidePaused) === "undefined" && typeof(dayDataOnly) === "undefined") {
      //   chrome.storage.sync.get("UserSettings").then((settings) => {
      //     setCheckbox(settings["hide-paused"])
      //     setDayDataOnly(settings["day-data-only"])
      //   })
      // }

      setSongs(res["songs"])
      if(res["songs"]) {
        console.log('songs ', res["songs"])
        const dataArr: DataTableRow<string>[] = []
        let count = 0;
        for(const song in res["songs"]) {

          // console.log("SONG INFO", res["songs"][song])
          let status = ""
          if(res["songs"][song].lastPlaying) status = "Playing"
          else  status = "Paused"
          
          let totalPlayTime = ""
          let totalPlayTimeNum = 0
          if(res["songs"][song].lastPlaying && Date.now() > res["songs"][song].lastStart) {
            totalPlayTime = String(Math.floor((((res["songs"][song].totalPlayTime + (Date.now() - res["songs"][song].lastStart)) / 1000) / 60) / 60)) + "H " + String(Math.floor(((res["songs"][song].totalPlayTime + (Date.now() - res["songs"][song].lastStart)) / 1000) / 60) % 60) + "M " + String(Math.floor((res["songs"][song].totalPlayTime + (Date.now() - res["songs"][song].lastStart)) / 1000) % 60) + "S"
            totalPlayTimeNum = res["songs"][song].totalPlayTime + (Date.now() - res["songs"][song].lastStart)
          }
          else {
            totalPlayTime = String(Math.floor(((res["songs"][song].totalPlayTime / 1000) / 60) / 60)) + "H " + String(Math.floor((res["songs"][song].totalPlayTime / 1000) / 60) % 60) + "M " + String(Math.floor(res["songs"][song].totalPlayTime / 1000) % 60) + "S"
            totalPlayTimeNum = res["songs"][song].totalPlayTime
          }
          let date = new Date().toISOString().slice(0, 10)
          let playTimeDate = "-------"
          let playTimeDateNum = 0
          if(typeof(res["songs"][song].totalPlayTimeDates[date]) != "undefined") {
            if(res["songs"][song].lastPlaying && Date.now() > res["songs"][song].lastStart) {
              playTimeDate = String(Math.floor(((((res["songs"][song].totalPlayTimeDates[date] + (Date.now() - res["songs"][song].lastStart)) / 1000) / 60)) / 60)) + "H " + String(Math.floor(((res["songs"][song].totalPlayTimeDates[date] + (Date.now() - res["songs"][song].lastStart)) / 1000) / 60) % 60) + "M " + String(Math.floor((res["songs"][song].totalPlayTimeDates[date] + (Date.now() - res["songs"][song].lastStart)) / 1000) % 60) + "S"
              playTimeDateNum = res["songs"][song].totalPlayTimeDates[date] + (Date.now() - res["songs"][song].lastStart)
            }
            else {
              playTimeDate =String(Math.floor(((res["songs"][song].totalPlayTimeDates[date] / 1000) / 60) / 60)) + "H " + String(Math.floor((res["songs"][song].totalPlayTimeDates[date] / 1000) / 60) % 60) + "M " + String(Math.floor(res["songs"][song].totalPlayTimeDates[date] / 1000) % 60) + "S"
              playTimeDateNum = res["songs"][song].totalPlayTimeDates[date]
            }
          }

          const toPush = {
            id: String(count),
            title: song,
            playTimeDate: playTimeDate,
            playTimeDateNum: playTimeDateNum,
            totalPlayTime: totalPlayTime,
            totalPlayTimeNum: totalPlayTimeNum,
            playingStatus: status
          }

          //Only display when user toggles option
          if(!hidePaused && !dayDataOnly) {
            dataArr.push(toPush)
          }
          else if(hidePaused && !dayDataOnly){
            if(toPush.playingStatus === "Playing") dataArr.push(toPush)
          }
          else if(!hidePaused && dayDataOnly) {
            if(toPush.playTimeDate != "-------") dataArr.push(toPush)
          }
          else {
            if(toPush.playTimeDate != "-------" && toPush.playingStatus === "Playing") dataArr.push(toPush)
          }
          count += 1
        }
        setData(dataArr)
      }
    })


    chrome.storage.local.get("totalTime").then((time) => {
      setTotalTime(time["totalTime"])
    })
    chrome.storage.local.get("totalTimeDate").then((timeDate) => {
      console.log(timeDate)
      setTotalTimeDate(timeDate["totalTimeDate"])
    })
    setDate(String(new Date().toISOString().slice(0, 10)))

    // chrome.storage.sync.set({"UserSettings": {"hide-paused": hidePaused, "day-data-only": dayDataOnly}})

    return;
  // }, [])
  }, [hidePaused, dayDataOnly])

  console.log("Data", data)
  console.log("TOTAL TIME DATE", totalTimeDate)

  const headerData = [
    {
      header: "Title",
      key: "title"
    },
    {
      header: "Time Watched Today",
      key: "playTimeDate"
    },
    {
      header: "Time Watched Total",
      key: "totalPlayTime"
    },
    {
      header: "Status",
      key: "playingStatus"
    }
  ]

  //WORK ON SORTING LIST PROPERLY
  if(songs) {
    return (
      <div className="App">
        <div className="container">
          <Tile className="content-container">
            <h3>TOTAL WATCH TIME TODAY: {String(Math.floor(totalTimeDate![date!]/1000/60/60)) + "H " + String(Math.floor(totalTimeDate![date!]/1000/60) % 60) + "M " + String(Math.floor(totalTimeDate![date!]/1000) % 60) + "S"}</h3>
            <p>TOTAL WATCH TIME: {String(Math.floor(totalTime!/1000/60/60)) + "H " + String(Math.floor(totalTime!/1000/60) % 60) + "M " + String(Math.floor(totalTime!/1000)%60) + "S"}</p>

            {/* <Toggle
            aria-label="toggle button"
            defaultToggled
            id="hide-paused"
            labelText="Show Playing Only"
            /> */}
            <Checkbox labelText="Hide Paused" id="hide-paused" checked={hidePaused} onChange={() => {
              setCheckbox(!hidePaused)
              // console.log("Status changed")
            }}/>
            <Checkbox labelText="Only Show Videos Played Today" id="day-data-only" checked={dayDataOnly} onChange={() => {
              setDayDataOnly(!dayDataOnly)
              // console.log("Status changed")
            }}/>
            <DataTable
              rows={data}
              headers={headerData}
              isSortable
              render={({rows, headers, getHeaderProps}) => (
                <TableContainer>

                 {/* <TableToolbar>
                 <TableToolbarContent>
                  <TableToolbarMenu>
                  <TableToolbarAction>
                  Action 1
                  </TableToolbarAction>
                  <TableToolbarAction>
                  Action 2
                  </TableToolbarAction>
                  <TableToolbarAction>
                  Action 3
                  </TableToolbarAction>
                  </TableToolbarMenu>
                  <Button>Primary Button</Button>
                  </TableToolbarContent>
                  </TableToolbar> */}

                  <Table>
                      <TableHead>
                          <TableRow>
                              {headers.map((header) => (
                                  // eslint-disable-next-line react/jsx-key
                                  <TableHeader {...getHeaderProps({header})}>
                                      {header.header}
                                  </TableHeader>
                              ))}
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {rows.map((row) => (
                              <TableRow key={row.id}>
                                  {row.cells.map((cell) => (
                                      <TableCell key={cell.id}>
                                          {cell.value}
                                      </TableCell>
                                  ))}
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                </TableContainer>
              )}
            />
          </Tile>
        </div>
      </div>
    );
  }



  return (
    <div className="App">
    </div>
  );
}

export default App;