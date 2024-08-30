const http = require('http');
const url = require('url');
const { webContents } = require('electron')

// @ts-ignore
const WEBSITE = import.meta.env.VITE_WEBSITE;

export const callback_server = () => {
  const webContent = webContents.getFocusedWebContents();
  // Maintain a hash of all connected sockets
  let sockets = {}, nextSocketId = 0;

  // Create a new server on port 4000
  const server = http.createServer(function (req, res) {
    // Parse the URL to get the query parameters
    const parsedUrl = url.parse(req.url, true);
    const query = parsedUrl.query;

    // Extract 'code' and 'error' query parameters
    const code = query.code || undefined;
    const error = query.error || undefined;

    res.writeHead(301, {
      'Location': "https://google.com/" // WEBSITE + "/Session/Application"
    });
    res.end(); // End the response

    if (code && webContent)
      webContent.send('update-session', code);
    if (error)
      console.error(query);

    // Close the server
    server.close(function () {
      console.log('Server closed!');
    });
    // Destroy all open sockets
    for (let socketId in sockets) {
      sockets[socketId].destroy();
    }
  }).listen(0);

  server.on('connection', function (socket) {
    // Add a newly connected socket
    let socketId = nextSocketId++;
    sockets[socketId] = socket;
    console.log('socket', socketId, 'opened');

    // Remove the socket when it closes
    socket.on('close', function () {
      console.log('socket', socketId, 'closed');
      delete sockets[socketId];
    });
  });

  setTimeout(() => {
    // Close the server
    server.close(function () { console.log('Server closed!'); });
    // Destroy all open sockets
    for (let socketId in sockets) {
      console.log('socket', socketId, 'destroyed');
      sockets[socketId].destroy();
    }
  }, 300000); // 5 minutes in milliseconds

  // Retrieve the assigned port number
  const port = server.address().port;
  const callback = `http://localhost:${port}`;
  // Return callback url
  return callback;
}