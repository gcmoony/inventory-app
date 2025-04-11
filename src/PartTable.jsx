import { DataGrid } from "@mui/x-data-grid"
import { useEffect, useState } from "react"

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
