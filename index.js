import express from 'express'
import sqlite3 from 'sqlite3'
import bodyParser from 'body-parser'
import {open} from 'sqlite'

const dbPromise = await open({
    filename: './data.db',
    driver: sqlite3.Database
})//end of sqlite driver

const app = express()
const port = 8080

app.use(express.static("static"))

app.get('/', (req,res) =>{

})

async function setup() {
    const db = await dbPromise;
    //set up migrations
    app.listen(port, () => {console.log("listening on " + port)})
}