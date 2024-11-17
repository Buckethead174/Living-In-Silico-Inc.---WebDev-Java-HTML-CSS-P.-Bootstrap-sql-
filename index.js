const express = require('express')
const path = require('path')
const engine = require('express-handlebars')
const multer = require("multer")

const app = express()
const port = 8080

//Smina variables
//critical variables
const xCenter = 0.0, yCenter = 0.0, zCenter = 0.0
const xBox = 0.0. yBox = 0.0, zBox = 0.0
const cpu = 0, exhaust = 0
const LFilename = "", RFilename = ""
const SminaLine = ""

//setting up handlebars engine
app.engine("handlebars", engine.engine())
app.set("view engine", "handlebars")
app.set("views", path.join(__dirname, "views"))

//middleware to pass url-encoded data
app.use(express.urlencoded({ extended: true }));
//setting the public folder for access of css
app.use('/public', express.static('./public'));

//setting up the multer for file uploading
const upload = multer({
    dest: 'userData/',   //folder where data is sent
    limits: {fileSize: 20 * 1024 * 1024},
})

//direct user to the main page on load up
app.get('/', (req,res) =>{
    const context = {
        name: "Jon Doe"
    }
    res.render("home", context)
})

app.post('basic', upload.any('ligand', 'receptor'), (req, res) => {

    //grab all smina variables
    const { xCenter, yCenter, zCenter,
            xBox, yBox, zBox,
            cpu, exhaust } = req.body;
    const { ligand, receptor } = req.file;  //File handled by Multer

    //get the filenames
    LFilename = ligand.originalname;
    RFilename = receptor.originalname;

    //check if file is uploaded
    if (!ligand || !receptor) {
        return res.status(400).send('No file uploaded');
    }

    //confirm submission in console
    console.log('Form submitted with Smina Variables');

    cminaLine = buildSmina( xCenter, yCenter, zCenter,
                            xBox, yBox, zBox,
                            cpu, exhaust)
                            LFilename, RFilename;

    res.render(home, SminaLine);
})

function buildSmina(xCenter, yCenter, zCenter, xBox, yBox, zBox, cpu, exhaust)
{
    const line = ""

    return line;
}

//Useful for setting up the initlization for sever
//listening and port messaging
//Potentially migration support goes in here.
async function setup() 
{
    app.listen(port, () => {console.log("listening on " + port)})
}

setup();