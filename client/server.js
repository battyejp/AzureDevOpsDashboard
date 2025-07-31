const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3001;

// Detect if we're running locally or in Azure deployment
// In Azure deployment, build files are copied to the same directory as server.js
// In local development, build files are in a 'build' subdirectory
const localBuildDir = path.join(__dirname, 'build');
const azureBuildDir = __dirname;

// Check if local build directory exists (local development)
const buildDir = fs.existsSync(localBuildDir) && fs.existsSync(path.join(localBuildDir, 'index.html')) 
  ? localBuildDir 
  : azureBuildDir;

console.log(`Using build directory: ${buildDir}`);

const server = http.createServer((req, res) => {
  let filePath = path.join(buildDir, req.url === '/' ? 'index.html' : req.url);
  
  // If file doesn't exist, serve index.html for client-side routing
  if (!fs.existsSync(filePath)) {
    filePath = path.join(buildDir, 'index.html');
  }
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.woff':
    case '.woff2':
      contentType = 'font/woff2';
      break;
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`Error serving ${filePath}: ${err.code}`);
      res.writeHead(500);
      res.end(`Server Error: ${err.code}`);
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});