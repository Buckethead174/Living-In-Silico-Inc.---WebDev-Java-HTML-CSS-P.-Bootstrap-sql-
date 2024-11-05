const express = require('express')
const path = require('path')
const engine = require('express-handlebars')

const app = express()
const port = 8080

app.engine("handlebars", engine.engine())
app.set("view engine", "handlebars")
app.set("views", path.join(__dirname, "views"))

app.use('/public', express.static('./public'));

app.get('/', (req,res) =>{
    const context = {
        name: "Jon Doe"
    }
    res.render("home", context)
})

//Useful for setting up the initlization for sever
//listening and port messaging
//Potentially migration support goes in here.
async function setup() 
{
    app.listen(port, () => {console.log("listening on " + port)})
}

setup();