import { app, BrowserWindow, ipcMain } from "electron"
import path from "node:path"
import started from "electron-squirrel-startup"
import fs from "fs"
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
  let sampleData = {}
  const startupDB = async () => {
    // await testDB()
    sampleData = await JSON.parse(fs.readFileSync("./sampleData.json", "utf-8"))
    await createPartsTable()
    await insertDummyParts(sampleData.part_data)
    await insertSinglePart({
      _id: "DummyID",
      name: "Dummy Part Name",
      sku: "DummySKU",
      price: 13.21,
      tax: "true",
      status: "active",
      track_inventory: 1,
      on_hand: 5,
      category_01: "CAR PARTS",
      cost: 5,
      map: 8,
      msrp: 10,
      markup: 0.0,
      margin: 0.0,
      rating: 0.0,
      priority: 4,
      category_02: "Muffler",
      source: "Not NAPPA",
      location: "N/A",
    })
    console.log(await getAllParts())
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

  // Users => update to part table
  ipcMain.handle("db:getAllItems", getAllItems)
  ipcMain.handle("db:updateItem", (event, args) => handleUpdateItem(args))
  ipcMain.handle("db:deleteItem", (event, args) => handleDeleteItem(args))
  ipcMain.handle("db:addNewItem", handleAddItem)

  // To do: same for assembly table

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
async function createPartsTable() {
  /**
   * id - generated id in database
   * _id - string, Some identifier the company gives the part
   * name - string, the name of the part
   * sku - string, the registered sku of the part
   * price - real value, selling value of part
   * tax - integer 0 or 1, whether the part is taxed
   * status - integer 0 or 1, whether the part is available for purchase
   * track_inventory - integer 0 or 1, if the part needs to be tracked
   * on_hand - integer, quantity count of part
   * category_01 - string, first category of part
   * cost - real value, dealer price of part
   * map - real value, minimum advertised price
   * msrp - real value, manufacturer suggested retail (selling) price
   * markup - real value, [price] - [cost]
   * margin - real value, ([price] - [cost]) / [price]
   * rating - real value, [markup] * [margin]
   * priority - integer
   * category_02 - string, second category of the part
   * source - string, where part can be purchased from
   * location - string, where the part is stored
   */
  const query = `
  CREATE TABLE IF NOT EXISTS parts (
  id INTEGER PRIMARY KEY,
  _id STRING,
  name STRING NOT NULL,
  sku STRING UNIQUE,
  price REAL,
  tax INTEGER,
  status STRING,
  track_inventory INTEGER,
  on_hand INTEGER,
  category_01 STRING,
  cost REAL,
  map REAL,
  msrp REAL,
  markup REAL,
  margin REAL,
  rating REAL,
  priority INTEGER,
  category_02 STRING,
  source STRING,
  location STRING)
`
  return await db.exec(query)
}

// ========= Insert into table =================
async function insertDummyParts(partsList) {
  let insertErrors = []

  const insertData = db.prepare(`
    INSERT INTO parts (_id, name, sku, price, tax, status, track_inventory, on_hand, category_01, cost, map, msrp, markup, margin, rating, priority, category_02, source, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

  partsList.forEach(async (part) => {
    try {
      await insertData.run(
        part._id,
        part.name,
        part.sku,
        part.price,
        part.tax,
        part.status,
        part.track_inventory,
        part.on_hand,
        part.category_01,
        part.cost,
        part.map,
        part.msrp,
        part.price - part.cost, // markup = price - cost
        (part.price - part.cost) / part.price, // margin = (price - cost) / price
        ((part.price - part.cost) / part.price) * (part.price - part.cost), // rating = margin * markup == ((price - cost) / price) * (price - cost)
        part.priority,
        part.category_02,
        part.source,
        part.location
      )
    } catch (err) {
      insertErrors.push(`${part._id} already exists in db`)
    }
  })
  return insertErrors.length > 0
    ? { message: "Insertion partially successful", err: insertErrors }
    : { message: "All items successfully inserted" }
}

// ======== Insert 1 item into table ===========
async function insertSinglePart(part) {
  const insertData = db.prepare(`
    INSERT INTO parts (_id, name, sku, price, tax, status, track_inventory, on_hand, category_01, cost, map, msrp, markup, margin, rating, priority, category_02, source, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

  try {
    await insertData.run(
      part._id,
      part.name,
      part.sku,
      part.price,
      part.tax,
      part.status,
      part.track_inventory,
      part.on_hand,
      part.category_01,
      part.cost,
      part.map,
      part.msrp,
      part.price - part.cost, // markup = price - cost
      (part.price - part.cost) / part.price, // margin = (price - cost) / price
      ((part.price - part.cost) / part.price) * (part.price - part.cost), // rating = margin * markup == ((price - cost) / price) * (price - cost)
      part.priority,
      part.category_02,
      part.source,
      part.location
    )

    const msg = { message: `Part ${part._id} successfully added` }
    return msg
  } catch (err) {
    const msg = { message: `Error! ${part._id} already exists` }
    return msg
  }
}

// ============ Selecting all items from table =================
async function getAllParts() {
  const query = `SELECT * FROM parts`
  const selectData = await db.prepare(query).all()
  return selectData
}

async function getAllItems() {
  const query = `SELECT * FROM users`
  const selectData = await db.prepare(query).all()
  return selectData
}

// ========== Selecting item by ID =================
async function getPartById(itemId) {
  const query = `SELECT * FROM parts WHERE id = ?`
  const selectData = await db.prepare(query).get(itemId)
  return selectData
    ? selectData
    : { message: `Could not find part with id: ${itemId}` }
}

async function getItemById(itemId) {
  const query = `SELECT * FROM users WHERE id = ?`
  const selectData = await db.prepare(query).get(itemId)
  return selectData
    ? selectData
    : { message: `Could not find item with id: ${itemId}` }
}

// ========== Delete item by ID ===============
async function deletePartById(itemId) {
  const query = `
  DELETE FROM parts
  WHERE id = ?
  `
  try {
    const deleteData = await db.prepare(query).run(itemId)
    return deleteData.changes > 0
      ? { message: `Part id ${itemId} deleted` }
      : { message: `Cannot delete part id ${itemId}, DNE` }
  } catch (err) {
    return { message: `Unable to delete part with id: ${itemId}` }
  }
}

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
async function updatePartById(partId, data) {
  const query = `
  UPDATE parts
  SET _id = ?, name = ?, sku = ?, price = ?, tax = ?, status = ?, track_inventory = ?, on_hand = ?, category_01 = ?, cost = ?, map = ?, msrp = ?, markup = ?, margin = ?, rating = ?, priority = ?, category_02 = ?, source = ?, location = ?
  WHERE id = ?
  `
  console.log(data)
  return
  try {
    // const id, rest = []
    const newData = [data.name, data.username, partId]
    const updateData = await db.prepare(query).run(newData)
    return updateData.changes > 0
      ? { message: `Part id ${partId} updated` }
      : { message: `Cannot update part id ${partId}, DNE` }
  } catch (err) {
    console.log(err)
    return { message: `Unable to update part with id: ${partId}` }
  }
}
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
