# Set install location
INSTALL_DIR="./miniconda3"
INSTALLER="Miniconda3-latest-Linux-x86_64.sh"

# Download Miniconda installer
curl -O https://repo.anaconda.com/miniconda/$INSTALLER

# Install Miniconda silently
bash $INSTALLER -b -p $INSTALL_DIR

# Initialize Conda in the current shell session
source "$INSTALL_DIR/etc/profile.d/conda.sh"

# Optionally update Conda
conda update -n base -c defaults conda -y

# Install the desired package
conda install -y conda-forge::smina
conda install -y conda-forge::openbabel

# Clean up installer
rm $INSTALLER