import { Button } from "@mui/material"
import {
  DataGrid,
  GridToolbarContainer,
  useGridApiContext,
} from "@mui/x-data-grid"
import { useEffect, useState } from "react"

function CustomToolbar({ setHasChangeHandler }) {
  const apiRef = useGridApiContext()
  const toDelete = () => {
    const res = apiRef.current.getSelectedRows().forEach(async (row) => {
      console.log(await window.dbAPI.deleteItem(row))
    })
    setHasChangeHandler(true)
  }

  return (
    <GridToolbarContainer>
      <Button onClick={toDelete}>Delete Selected</Button>
    </GridToolbarContainer>
  )
}

export default function PartTable() {
  const columns = [
    { field: "name", headerName: "Name", editable: true },
    { field: "username", headerName: "Username", editable: true },
  ]

  const [dbData, setDbData] = useState([])
  const [hasChange, setHasChange] = useState(true)

  useEffect(() => {
    hasChange && fetchData()
  }, [hasChange])

  const fetchData = async () => {
    const res = await window.dbAPI.getAllItems()
    setDbData(res)
    setHasChange(false)
  }

  const handleUpdate = async (row, oldRow) => {
    setHasChange(true)
    const res = await window.dbAPI.updateItem(row)
    return res
  }

  return (
    <>
      <DataGrid
        slots={{
          toolbar: () => <CustomToolbar setHasChangeHandler={setHasChange} />,
        }}
        checkboxSelection
        rows={dbData}
        columns={columns}
        processRowUpdate={(newRow, oldRow) => {
          return handleUpdate(newRow, oldRow)
        }}
        onProcessRowUpdateError={(err) => {
          console.log("Failed to update item")
        }}
      />
    </>
  )
}
