# Electron Inventory App

A desktop inventory management application using Electron.

## How to use

First, clone this repository:

```
git clone https://github.com/gcmoony/inventory-app.git
```

Then navigate to the project directory:

```
cd inventory-app
npm install
```

Then run the app:

```
npm run start
```

To build the application (using Electron Forge):

```
npm run make
```

## What does it do?

It's a desktop inventory management app used to manage parts and assemblies. It
was creating using Electron, with Better-SQLite3 for a database and Vite +
React.JS for the "frontend". The MVP for this program includes:

- Ability to create new parts
- Ability to create assemblies from parts
- Ability to modify quantities of parts when new assemblies are made
- Visual alerts for low item quantity

Currently, it is capable of performing the following:

- Creating sample data entries if the database is empty
- Provide asynchronous calls to the database to satisfy Google MUI requirements
- Ability to create, update, read, and delete entries (sample format currently,
  not final)

<!--### Demo

Here's a video demonstration of the application current state in use (0:42)
<br/> <img src="./public/output.gif" alt="App demo">-->
