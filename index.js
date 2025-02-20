const express = require('express')
const path = require('path')
const engine = require('express-handlebars')
const multer = require('multer')
const { exec } = require('child_process')
const fs = require('fs');
const archiver = require('archiver');

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

    //console.log("\nExhaust: " + exhaust);
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
        console.log(`Receptor uploaded: ${RFilename}\n`)
    }
    if(ligand) {
        console.log(`ligand uploaded: ${LFilename}\n`)
    }

    //builds the smina commandline
    SminaLine = buildSminaUser( xCenter, yCenter, zCenter,
                            xBox, yBox, zBox,
                            cpu, exhaust,
                            LFilename, RFilename);

    //prep a line for the backend as well
    SminaBackend = buildSminaBack( xCenter, yCenter, zCenter,
                            xBox, yBox, zBox,
                            cpu, exhaust,
                            LFilename, RFilename);

    //serves information to user
    const context = {
        SminaLine
    }

    //report smina line creation
    console.log("Smina line built: " + SminaLine)
    
    //renders the same page with the smina command and output
    res.render("home", context);//pass the data to the front end
})

//run smina command line on button press, uses awaiting command to render after finish
app.get('/run', (req, res) => {

    console.log("\nBackend line built: " + SminaBackend)

    const child = exec(SminaBackend);

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
        output += data.toString();
    })

    child.stderr.on('data', (data) => {
        error += data.toString();
    })

    child.on('close', (code) => {
        if(code === 0) {
            res.render('home', {finished: 'Smina Scoring completed', download: 'Download Ready'})
            console.log('\nTask Successful');
        } else {
            console.log('Task failed: ' + error)
            res.render('home', {finished: "Smina Scoring failed: " + error})
        }
    })

    ReturnFile = "userOutput/result.pdbqt"
    logFile = "userOutput/output.txt"
})

//Allows the user to download the zipped data of the smina scoring
app.get('/download', (req, res) => {
    const output = fs.createWriteStream(path.join(__dirname, 'userOutput', 'userZip.zip'))
    const archive = archiver('zip', {
        zlib: { level: 9} //maximum compression
    })

    archive.pipe(output);

    archive.file(path.join(__dirname, 'userOutput', 'result.pdbqt'), {name: 'result.pdbqt'})
    archive.file(path.join(__dirname, 'userOutput', 'output.txt'), {name: 'output.txt'})

    archive.finalize();

    output.on('close', () => {
        res.download(path.join(__dirname, 'userOutput', 'userZip.zip'), 'userZip.zip', (err) => {
            if(err) {
                console.log('Error Downloading zipped file: ' + err)
            }
        });
    });
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