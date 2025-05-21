import { useState } from "react"
import PartTable from "./PartTable"
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material"

export default function App() {
  const [view, setView] = useState(0)
  return (
    <>
      <h2>Database Testing</h2>
      <div>
        <Box>
          <FormControl sx={{ minWidth: "100%", marginY: "1rem" }}>
            <InputLabel id='page-view-label'>Current Page</InputLabel>
            <Select
              labelId='page-view-label'
              value={view}
              label='Current Page View'
              onChange={(e) => {
                setView(e.target.value)
              }}
            >
              <MenuItem value={0}>Parts</MenuItem>
              <MenuItem value={1}>Assemblies</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </div>
      {view == 0 ? <PartTable /> : view == 1 ? <h1>Hello</h1> : <h1>??</h1>}
    </>
  )
}
