This website uses Smina to run a scoring program of pdbqt files, sdf files, and pdb files.
It does not come with Smina installed in the package, however to install it,
the server that the package is installed with needs Anaconda.

To install smina:

1. Install Anaconda

2. Set Anaconda bin to path, usually located in users/username/anaconda3/Library/bin
 - to check if successfully installed, type into the cmd 'conda --version'

3. In CMD type 'conda install conda-forge::smina' and 'conda install conda-forge::openbabel'

After these have both finished installing, the website is ready to run and to run Smina scoring.

To start to website : 'npm start'

INSTRUCTIONS ON HOW TO USE VM:
The website was created using a virtual machine from Azure
TO access this VM requires a key file. Since that key file exists locally on my PC, you can create your own VM.
1. Start off by creating an Azure account
2. Make a Virtual Machine with Azure
3. Have the B2 series of VM, you need this in order to install Smina and Openbabel, any less powerful series will not work
4. Either use key or password, I recommend the key file for easier access
5. Use Ubuntu 22.4.1 as the image, anything numbered 22.4 is fine
5. Keep all the settings the same, do not change anything except if you have to add something, you can also change the azureuser and password if you choose so
6. Use Windows Terminals (not cmd) to access the virtual machine, to access use ssh (username)@(ip address of vm), if you have a key file, please reference the file location in the line before (username)
7. run sudo apt-get update; sudo apt-get install -y wget bzip2
8. wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh
9. bash miniconda.sh -b -p $HOME/miniconda
10. echo 'export PATH="$HOME/miniconda/bin:PATH"' >> ~/.bashrc then source ~/.bashrc
11. conda --version, this is to confirm if it works, you should see the version of it
12. Mamba makes it faster, conda install -n base -c conda-forge mamba
13. mamba install -c conda-forge smina openbabel
14. smina --help; to check
15. sudo apt-get install -y nodejs npm
16. node --version and npm --version just to confirm
17. npm install
18. sudo npm install -g nodemon
18. Time to clone our repo, but first use this command: sudo apt-get install git
19. git clone https://github.com/Buckethead174/Living-In-Silico-Inc.---WebDev-Java-HTML-CSS-P.-Bootstrap-sql-.git, if it doesnt work remove the .git
20. cd Living-In-Silico-Inc.---WebDev-Java-HTML-CSS-P.-Bootstrap-sql-
21. Back to your Azure VM, you want to go to "Networking", add inbound port rule, change destination port ranges to 8080, protocol to TCP and priority has to be in the 300 to 310 range
22. Save it
23. In the terminal type "npm start"
24. Once the code runs perfectly, you should see a message saying "Listening in port 8080", go and type "http://(IP address of VM):8080" in the web browser and you should see it
25. Done
