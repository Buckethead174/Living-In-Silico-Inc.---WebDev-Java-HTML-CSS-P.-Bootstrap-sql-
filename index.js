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
LFilename = "", RFilename = "";
SminaLine = [];
SminaBackend = [];
txtOut = "";
const DeleteFileTime = 30 * 60 * 1000; //20 minute
ligands = [];
ZipNames = [];
sminaPath = "./miniconda3/bin/activate"

//setting up handlebars engine
app.engine("handlebars", engine.engine())
app.set("view engine", "handlebars")
app.set("views", path.join(__dirname, "views"))

//middleware to pass url-encoded data
app.use(express.urlencoded({ extended: true }));
//setting the public folder for access of css
app.use('/public', express.static('./public'));

//any routes not defined give 404 error
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
})

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

//this functions stops folder override
function createUniqueFolder(basename, parentDir) {
    let counter = 1;
    let fileInt = 1;
    let folderPath = path.join(parentDir, "userOuts", basename + "_" + counter);

    while(fs.existsSync(folderPath)){
        folderPath = path.join(parentDir, "userOuts", `${basename}_${counter}`);
        fileInt = counter;
        counter++;
    }

    console.log("\nCounter = " + counter + "\n");

    fs.mkdirSync(folderPath, {recursive: true});


    setTimeout(() => {
        fs.unlink(folderPath, err => {
            if (err) console('Error deleting user data:', err);
            else console.log('Folder deleted: ', `${basename}_${counter}`);
        });
    }, DeleteFileTime);

    return `${basename}_` + fileInt;
}

//direct user to the main page on load up
app.get('/', (req,res) =>{
    res.render("home")
})

app.post('/basic', upload.fields([
    {name: 'receptor', maxCount: 1},    //handle one receptor
    {name: 'ligand', maxCount: 20}       //handle 20 ligand
]), (req, res) => {

    //deletes files after a certain amount of time
    req.files['receptor'].forEach(file =>{
        setTimeout(() => {
            fs.unlink(file.path, err => {
                if (err) console('Error deleting user data:', err);
                else console.log('User file deleted: ', file.filename);
            });
        }, DeleteFileTime);
    });

    //reworked this file deletion period, to grab the filenames and the files for ligands
    ligandCounter = 0;
    req.files['ligand'].forEach(file =>{
        setTimeout(() => {
            fs.unlink(file.path, err => {
                if (err) console('Error deleting user data:', err);
                else console.log('User file deleted: ', file.filename);
            });
        }, DeleteFileTime);

        const ligand = req.files['ligand'] ? req.files['ligand'][ligandCounter] : null;
        ligands[ligandCounter] = ligand.originalname;
        ligandCounter++;
    });

    //grab all smina variables
    const { xCenter, yCenter, zCenter,
            xBox, yBox, zBox,
            cpu, exhaust } = req.body;
    const receptor = req.files['receptor'] ? req.files['receptor'][0] : null;

    //console.log("\nExhaust: " + exhaust);
    //console.log("\nTest: " + test);

    if(!receptor && !ligands[0])
    {
        return res.status(400).send('No files uploaded. Please upload a receptor and ligand.')
    }

    //get the receptor filename
    RFilename = receptor.originalname;

    //confirm submission in console
    console.log('Form submitted with Smina Variables\n');
    if(receptor) {
        console.log(`Receptor uploaded: ${RFilename}\n`)
    }
    for(i = 0; i < ligands.length; i++)
    {
        console.log(`ligand uploaded: ${ligands[i]}\n`)
    }
    
    //builds the smina commandline for user and backend
    frontText = "";
    backendText = "";
    for(i = 0; i < ligands.length; i++)
    {
        SminaLine[i] = buildSminaUser( xCenter, yCenter, zCenter,
            xBox, yBox, zBox,
            cpu, exhaust,
            ligands[i], RFilename);

        SminaBackend[i] = buildSminaBack( xCenter, yCenter, zCenter,
            xBox, yBox, zBox,
            cpu, exhaust,
            ligands[i], RFilename, i);

        frontText += (i+1) + " " + SminaLine[i] + "\n\n";
        backendText += (i+1) + " " + SminaBackend[i] + "\n\n";
    }

    //serves information to user
    const context = {
        SminaLine: frontText,
        finish: 'Hit submit, then wait 5 minutes'
    }

    //report smina line creation
    console.log("Smina lines built: " + frontText);
    console.log("\nBackend lines built: " + backendText);
    
    //renders the same page with the smina command and output
    res.render("home", context);//pass the data to the front end
})

function runCommand(cmd, res) {
    return new Promise((resolve, reject) => {
        const process = exec(sminaPath, cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error running command ${cmd}: `, error);
                reject(error);
                res.render('home', { finish: "Smina Scoring failed: " + error })
            }
            else {
                console.log(`\nCommand ${cmd} completed.`);
                txtOut += stdout + "\n\n"
                console.log(stdout);
                resolve(stdout)
            }
        })//process
    })//promise
}//end of function

//run smina command line on button press, uses awaiting command to render after finish
app.get('/run', async (req, res) => {

    for (i = 0; i<SminaBackend.length; i++) {
        console.log(`\nRunning: ${SminaBackend[i]}`);
        try {
            await runCommand(SminaBackend[i], res);
        } catch (err) {
            console.error(`Failed on commad: ${SminaBackend[i]}`)
            break;
        }
    }

    res.render('home', {finish: 'Smina Scoring completed', Download: 'Download Ready', txtOut})
    console.log('\nTask Successful' + '\n\n' + txtOut);
})

//Allows the user to download the zipped data of the smina scoring
app.get('/download', (req, res) => {
    const output = fs.createWriteStream(path.join(__dirname, 'userOuts', 'userZip.zip'))
    const archive = archiver('zip', {
        zlib: { level: 9} //maximum compression
    })

    archive.pipe(output);

    for(i = 0; i<ZipNames.length; i++){
        archive.file(path.join(__dirname, 'userOuts', ZipNames[i], 'output.txt'), {name: 'output.txt' + ([i]+1)})
        archive.file(path.join(__dirname, 'userOuts', ZipNames[i], 'result.pdbqt'), {name: 'result.pdbqt' + ([i]+1)})  
    }

    archive.finalize();

    res.setHeader('Content-Type', 'Output/zip');

    output.on('close', () => {
        res.download(path.join(__dirname, 'userOuts', 'userZip.zip'), 'userZip.zip', (err) => {
            if(err) {
                console.log('Error Downloading zipped file: ' + err)
            }
        });
    });
})

//build smina line for the backend
function buildSminaBack(xCenter, yCenter, zCenter, xBox, yBox, zBox, cpu, exhaust, LFilename, RFilename, i)
{

    folderName = createUniqueFolder("userOutput", path.join(__dirname));

    ZipNames[i] = folderName;

    const line =    "smina --receptor ../../../userdata/" + RFilename +
                    " --ligand ../../../userdata/" + LFilename +
                    " --center_x " + xCenter +
                    " --center_y " + yCenter +
                    " --center_z " + zCenter +
                    " --cpu " + cpu +
                    " --exhaustiveness " + exhaust +
                    " --size_x " + xBox + 
                    " --size_y " + yBox +
                    " --size_z " + zBox +
                    ` --out ../../../userOuts/${folderName}/result.pdbqt --log ../../../userOuts/${folderName}/output.txt`;

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