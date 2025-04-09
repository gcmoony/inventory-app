import { app, BrowserWindow } from "electron"
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
  createWindow()
  /**
   *
   * =========== DATABASE STUFF HERE TOO ===========
   */
  db = new sequalight("poobar.db") //, { verbose: console.log })
  createTable()
  // insertSingleItem({ name: "Me", username: "myUserName" })
  getAllItems().then((res) => {
    // Insert dummy items if the table is empty
    res.length < 1 && insertDummyItems()
    // deleteItemById(2)
    // insertSingleItem({ name: "Me", username: "myUserName" })
  })

  // ==========6=====================================
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
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
 * ====================================================
 * THIS IS ALL THE THE IPC COMMUNICATION STUFF
 *
 *
 *
 *
 *
 *
 */

/**
 *
 *
 *
 *
 *
 *
 *
 *
 * END OF IPC COMMUNICATION
 *================================================
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
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
  db.exec(query)
}

// ========= Insert into table =================
async function insertDummyItems() {
  const data = [
    { name: "Name1", username: "Po" },
    { name: "Name2", username: "Poo" },
    { name: "Name3", username: "Poop" },
  ]

  const insertData = db.prepare(`
    INSERT INTO users (name, username) VALUES (?, ?)
    `)

  data.forEach((user) => {
    try {
      insertData.run(user.name, user.username)
    } catch (err) {
      console.log(`${user.username} already exists in db`)
    }
  })
}

// ======== Insert 1 item into table ===========
async function insertSingleItem(newItem) {
  const insertData = db.prepare(`
    INSERT INTO users (name, username) VALUES (?, ?)
    `)
  try {
    insertData.run(newItem.name, newItem.username)
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
  const selectData = db.prepare(query).all()
  return selectData
}

// ========== Selecting item by ID =================
async function getItemById(itemId) {
  const query = `SELECT * FROM users WHERE id = ?`
  const selectData = db.prepare(query).get(itemId)
  return selectData
}

// ========== Delete item by ID ===============
async function deleteItemById(itemId) {
  const query = `
  DELETE FROM users
  WHERE id = ?
  `
  try {
    const deleteData = db.prepare(query).run(itemId)
    console.log(deleteData)
  } catch (err) {
    console.log(`Could not delete item with ID: ${itemId}`)
  }
}
