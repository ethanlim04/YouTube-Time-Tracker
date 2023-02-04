/* eslint-disable */
import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
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
  DataTableRow
} from 'carbon-components-react'

function App() {
  // const [tabs, setTabs] = useState<chrome.tabs.Tab[]>()
  const [songs, setSongs] = useState<{[title: string]: {lastEnd: number, lastPlaying: boolean, lastStart: number, totalPlayTime: number}}>()
  const [data, setData] = useState<DataTableRow<string>[]>([])

  useEffect(() => {
    chrome.storage.local.get("songs").then((res) => {
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
          if(res["songs"][song].lastPlaying && Date.now() > res["songs"][song].lastStart) totalPlayTime = String(Math.floor(((res["songs"][song].totalPlayTime + (Date.now() - res["songs"][song].lastStart)) / 1000) / 60)) + "M : " + String(Math.floor((res["songs"][song].totalPlayTime + (Date.now() - res["songs"][song].lastStart)) / 1000) % 60) + "S"
          else  totalPlayTime = String(Math.floor((res["songs"][song].totalPlayTime / 1000) / 60)) + "M : " + String(Math.floor(res["songs"][song].totalPlayTime / 1000) % 60) + "S"
          // if(res["song"][song].lastPlaying) totalPlayTime = String(((res["songs"][song].totalPlayTime + (Date.now() - res["songs"][song].lastStart)) / 1000) / 60) + "M" + String(((res["songs"][song].totalPlayTime + (Date.now() - res["songs"][song].lastStart)) / 1000) % 60) + "S"
          // else totalPlayTime = String((res["songs"][song].totalPlayTime / 1000) / 60) + "M" + String((res["songs"][song].totalPlayTime / 1000) % 60) + "S"
          // String(Math.floor((res["songs"][song].totalPlayTime / 1000) / 60)) + "M : " + String(Math.floor(res["songs"][song].totalPlayTime / 1000) % 60) + "S"
          const toPush = {
            id: String(count),
            title: song,
            totalPlayTime: totalPlayTime,
            playingStatus: status
          }
          dataArr.push(toPush)
          count += 1
        }
        setData(dataArr)
      }
    })

    return;
  }, [])
  console.log("Data", data)

  const headerData = [
    {
      header: "Title",
      key: "title"
    },
    {
      header: "Time Watched",
      key: "totalPlayTime"
    },
    {
      header: "Status",
      key: "playingStatus"
    }
  ]

  if(songs) {
    return (
      <div className="App">
        <div className="container">
          <Tile className="content-container">
            <DataTable
              rows={data}
              headers={headerData}
              render={({rows, headers, getHeaderProps}) => (
                <TableContainer title="Watched Videos">
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