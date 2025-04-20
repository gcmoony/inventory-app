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

  const toAdd = async () => {
    await window.dbAPI.addItem()
    setHasChangeHandler(true)
  }

  return (
    <GridToolbarContainer>
      <Button onClick={toDelete}>Delete Selected</Button>
      <Button onClick={toAdd}>Add Item</Button>
    </GridToolbarContainer>
  )
}

export default function PartTable() {
  const columns = [
    { field: "_id", headerName: "ID", editable: true },
    { field: "name", headerName: "Name", editable: true },
    { field: "price", headerName: "Price", editable: true },
    { field: "cost", headerName: "Cost", editable: true },
    { field: "sku", headerName: "SKU", editable: true },
    { field: "map", headerName: "MAP", editable: true },
    { field: "msrp", headerName: "MSRP", editable: true },
    { field: "markup", headerName: "Markup", editable: true },
    { field: "margin", headerName: "Margin", editable: true },
    { field: "rating", headerName: "Rating", editable: true },
    { field: "category_01", headerName: "Category 1", editable: true },
    { field: "category_02", headerName: "Category 2", editable: true },
    { field: "priority", headerName: "Priority", editable: true },
    { field: "location", headerName: "Location", editable: true },
    { field: "source", headerName: "Source", editable: true },
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
        disableRowSelectionOnClick
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
