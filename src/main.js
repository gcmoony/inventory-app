import { app, BrowserWindow, ipcMain } from "electron"
import path from "node:path"
import started from "electron-squirrel-startup"
const sequalight = require("better-sqlite3")
let db
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  /**
   *
   * =========== DATABASE STUFF HERE TOO ===========
   */
  db = new sequalight("boofar.db")
  const startupDB = async () => {
    await testDB()
  }
  startupDB()

  /**
   * ====================================================
   * THIS IS ALL THE THE IPC COMMUNICATION STUFF
   *
   */
  async function handleAddItem() {
    const newItem = { name: `Sample Name`, username: "Sample Username" }
    return await insertSingleItem(newItem)
  }

  async function handleUpdateItem(row) {
    await updateItemById(row.id, row)
    return row
  }

  async function handleDeleteItem(row) {
    const res = await deleteItemById(row.id)
    return res
  }

  ipcMain.handle("db:getAllItems", getAllItems)
  ipcMain.handle("db:updateItem", (event, args) => handleUpdateItem(args))
  ipcMain.handle("db:deleteItem", (event, args) => handleDeleteItem(args))
  ipcMain.handle("db:addNewItem", handleAddItem)

  /**
   *
   *
   * END OF IPC COMMUNICATION
   *================================================
   *
   */

  // ===============================================
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  createWindow()
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    db.close()
    app.quit()
  }
})

/**
 * ================ ALL DATABASE STUFF ==========
 */

// ========= Create a table =================
async function createTable() {
  const query = `
  CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name STRING NOT NULL,
  username STRING NOT NULL UNIQUE)
`
  return await db.exec(query)
}

// ========= Insert into table =================
async function insertDummyItems() {
  const data = [
    { name: "Name1", username: "user01" },
    { name: "Name2", username: "user02" },
    { name: "Name3", username: "user03" },
  ]
  let insertErrors = []

  const insertData = db.prepare(`
    INSERT INTO users (name, username) VALUES (?, ?)
    `)

  data.forEach(async (user) => {
    try {
      await insertData.run(user.name, user.username)
    } catch (err) {
      insertErrors.push(`${user.username} already exists in db`)
    }
  })
  return insertErrors.length > 0
    ? { message: "Insertion partially successful", err: insertErrors }
    : { message: "All items successfully inserted" }
}

// ======== Insert 1 item into table ===========
async function insertSingleItem(newItem) {
  const insertData = db.prepare(`
    INSERT INTO users (name, username) VALUES (?, ?)
    `)
  try {
    await insertData.run(newItem.name, newItem.username)
    const msg = { message: `${newItem.username} successfully added` }
    return msg
  } catch (err) {
    const msg = { message: `Error! ${newItem.username} already exists` }
    return msg
  }
}

// ============ Selecting all items from table =================
async function getAllItems() {
  const query = `SELECT * FROM users`
  const selectData = await db.prepare(query).all()
  return selectData
}

// ========== Selecting item by ID =================
async function getItemById(itemId) {
  const query = `SELECT * FROM users WHERE id = ?`
  const selectData = await db.prepare(query).get(itemId)
  return selectData
    ? selectData
    : { message: `Could not find item with id: ${itemId}` }
}

// ========== Delete item by ID ===============
async function deleteItemById(itemId) {
  const query = `
  DELETE FROM users
  WHERE id = ?
  `
  try {
    const deleteData = await db.prepare(query).run(itemId)
    return deleteData.changes > 0
      ? { message: `Item id ${itemId} deleted` }
      : { message: `Cannot delete Item id ${itemId}, DNE` }
  } catch (err) {
    return { message: `Unable to delete item with id: ${itemId}` }
  }
}

// ========== Update item by ID ===============
async function updateItemById(itemId, data) {
  const query = `
  UPDATE users
  SET name = ?, username = ?
  WHERE id = ?
  `
  try {
    const newData = [data.name, data.username, itemId]
    const updateData = await db.prepare(query).run(newData)
    return updateData.changes > 0
      ? { message: `Item id ${itemId} updated` }
      : { message: `Cannot update Item id ${itemId}, DNE` }
  } catch (err) {
    console.log(err)
    return { message: `Unable to update item with id: ${itemId}` }
  }
}

// A bunch of cases to test async functionality with sqlite
async function testDB() {
  console.log("Testing create: ", await createTable())

  let res = await getAllItems()
  console.log("Testing getAll: ", res)
  if (res.length < 1) {
    console.log("Testing insert dummies: ", await insertDummyItems())
  }
  console.log(
    "Testing insert single: ",
    await insertSingleItem({ name: "Name04", username: "user04" })
  )
  console.log("Testing getall after insert: ", await getAllItems())
  console.log("Testing getbyID (exist): ", await getItemById(1))
  console.log("Testing getbyID (non-exist): ", await getItemById(100))
  console.log("Testing deletebyID (exist): ", await deleteItemById(1))
  console.log("Testing deletebyID (non-exist): ", await deleteItemById(100))
  console.log("Testing getall after deletion: ", await getAllItems())
  console.log(
    "Testing updatebyID (exist): ",
    await updateItemById(2, { name: "New name 02", username: "new_user02" })
  )
  console.log(
    "Testing updatebyID (non-exist): ",
    await updateItemById(100, {
      name: "null New name",
      username: "null new username",
    })
  )
  console.log("Testing getall after update: ", await getAllItems())
  console.log("All testing done!")
}
