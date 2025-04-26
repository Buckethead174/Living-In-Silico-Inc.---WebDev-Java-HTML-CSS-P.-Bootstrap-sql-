# Base image with Debian
FROM debian:buster-slim

# Set environment variables
ENV PATH=/opt/conda/bin:$PATH

# Install dependencies + Miniconda
RUN apt-get update && apt-get install -y \
    curl \
    bzip2 \
    build-essential \
    && curl -L https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -o miniconda.sh \
    && bash miniconda.sh -b -p /opt/conda \
    && rm miniconda.sh

# Add conda channels + install smina
RUN /opt/conda/bin/conda config --add channels defaults && \
    /opt/conda/bin/conda config --add channels bioconda && \
    /opt/conda/bin/conda config --add channels conda-forge && \
    /opt/conda/bin/conda install -y smina

# Install Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy app files
COPY . .

# Install Node dependencies
RUN npm install

# Expose app port (change this if you use a different one)
EXPOSE 3000

# Start Node app
CMD ["npm", "start"]
