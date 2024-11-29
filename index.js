const express = require('express')
const path = require('path')
const engine = require('express-handlebars')
const multer = require('multer')
const { exec } = require('child_process')

const app = express()
const port = 8080

//Smina variables
//critical variables
LFilename = "", RFilename = "", ReturnFile = "";
SminaLine = "";
SminaBackend = "";
logFile = "";

//setting up handlebars engine
app.engine("handlebars", engine.engine())
app.set("view engine", "handlebars")
app.set("views", path.join(__dirname, "views"))

//middleware to pass url-encoded data
app.use(express.urlencoded({ extended: true }));
//setting the public folder for access of css
app.use('/public', express.static('./public'));

//setting up the multer for multiple file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'userData/'); //folder where data is sent
    }, 
    filename: (req, file, cb) => {
        cb(null, file.originalname); //add a timestamp to avoid file collision
    }
});

//set up multer to handle two fields
const upload = multer({ storage: storage, limits: {fileSize: 20 * 1024 * 1024 } });

//direct user to the main page on load up
app.get('/', (req,res) =>{
    res.render("home")
})

app.post('/basic', upload.fields([
    {name: 'receptor', maxCount: 1},    //handle one receptor
    {name: 'ligand', maxCount: 1}       //handle one ligand
]), (req, res) => {

    //grab all smina variables
    const { xCenter, yCenter, zCenter,
            xBox, yBox, zBox,
            cpu, exhaust } = req.body;
    const receptor = req.files['receptor'] ? req.files['receptor'][0] : null;
    const ligand = req.files['ligand'] ? req.files['ligand'][0] : null;

    console.log("\nExhaust: " + exhaust);
    //console.log("\nTest: " + test);

    if(!receptor && !ligand)
    {
        return res.status(400).send('No files uploaded. Please upload a receptor and ligand.')
    }

    //get the filenames
    LFilename = ligand.originalname;
    RFilename = receptor.originalname;

    //confirm submission in console
    console.log('Form submitted with Smina Variables\n');
    if(receptor) {
        console.log('Receptor uploaded: ${RFilename}\n')
    }
    if(ligand) {
        console.log('ligand uploaded: ${LFilename}\n')
    }

    //builds the smina commandline
    SminaLine = buildSminaUser( xCenter, yCenter, zCenter,
                            xBox, yBox, zBox,
                            cpu, exhaust,
                            LFilename, RFilename);

    SminaBackend = buildSminaBack( xCenter, yCenter, zCenter,
                            xBox, yBox, zBox,
                            cpu, exhaust,
                            LFilename, RFilename);

    /*exec(SminaBackend, (error, stdout, stderr) => {
        if(error) {
            console.error('Error: ' + error);
        }
    })*/

    ReturnFile = "result.pdbqt"
    logFile = "output.txt"

    //serves information to user
    const context = {
        SminaLine
    }

    console.log("Smina line built: " + SminaLine)
    
    //renders the same page with the smina command and output
    res.render("home", context);//pass the data to the front end
})

//build smina line for the backend
function buildSminaBack(xCenter, yCenter, zCenter, xBox, yBox, zBox, cpu, exhaust, LFilename, RFilename)
{
    const line =    "smina --receptor userdata/" + RFilename +
                    " --ligand userdata/" + LFilename +
                    " --center_x " + xCenter +
                    " --center_y " + yCenter +
                    " --center_z " + zCenter +
                    " --cpu " + cpu +
                    " --exhaustiveness " + exhaust +
                    " --size_x " + xBox + 
                    " --size_y " + yBox +
                    " --size_z " + zBox +
                    " --out userOutput/result.pdbqt --log userOutput/output.txt";

    return line;
}

//build smina line for the user
function buildSminaUser(xCenter, yCenter, zCenter, xBox, yBox, zBox, cpu, exhaust, LFilename, RFilename)
{
    const line =    "smina --receptor " + RFilename +
                    " --ligand " + LFilename +
                    " --center_x " + xCenter +
                    " --center_y " + yCenter +
                    " --center_z " + zCenter +
                    " --cpu " + cpu +
                    " --exhaustiveness " + exhaust +
                    " --size_x " + xBox + 
                    " --size_y " + yBox +
                    " --size_z " + zBox;

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