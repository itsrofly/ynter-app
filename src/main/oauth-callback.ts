import { app, safeStorage, webContents } from "electron"
import { writeFile } from "fs/promises"
import path from "path"
import { supabase } from "."

const http = require('http')
const url = require('url')

// const WEBSITE = import.meta.env.VITE_WEBSITE
export const callback_server = (): string => {
  const webContent = webContents.getFocusedWebContents()
  // Maintain a hash of all connected sockets
  // eslint-disable-next-line prefer-const
  let sockets = {},
    nextSocketId = 0

  // Create a new server on port 4000
  const server = http
    .createServer(async function (req, res) {
      // Parse the URL to get the query parameters
      const parsedUrl = url.parse(req.url, true)
      const query = parsedUrl.query

      // Extract 'code' and 'error' query parameters
      const code = query.code || undefined
      const error = query.error || undefined

      res.writeHead(301, {
        Location: 'https://google.com/' // WEBSITE + "/Session/Application"
      })
      res.end() // End the response

      if (code && webContent) {
        // Data from code
        const { data } = await supabase.auth.exchangeCodeForSession(code)

        // Initial password, Besically no pin is setup
        const filePath = path.join(app.getPath('userData'), 'User.ynter');

        webContent.send('update-session',
          data.user?.user_metadata.full_name,
           data.user?.email)

        // User informations
        const User = {
          email: data.user?.email,
          pin: null,
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token
        }

        // Encry and store
        const secretData = JSON.stringify(User);
        const encryptedData = safeStorage.encryptString(secretData);
        writeFile(filePath, encryptedData);
      }
      if (error) console.error(query)

      // Close the server
      server.close(function () {
        console.log('Server closed!')
      })
      // Destroy all open sockets
      for (const socketId in sockets) {
        sockets[socketId].destroy()
      }
    })
    .listen(0)

  server.on('connection', function (socket) {
    // Add a newly connected socket
    const socketId = nextSocketId++
    sockets[socketId] = socket
    console.log('socket', socketId, 'opened')

    // Remove the socket when it closes
    socket.on('close', function () {
      console.log('socket', socketId, 'closed')
      delete sockets[socketId]
    })
  })

  setTimeout(() => {
    // Close the server
    server.close(function () {
      console.log('Server closed!')
    })
    // Destroy all open sockets
    for (const socketId in sockets) {
      console.log('socket', socketId, 'destroyed')
      sockets[socketId].destroy()
    }
  }, 300000) // 5 minutes in milliseconds

  // Retrieve the assigned port number
  const port = server.address().port
  const callback = `http://localhost:${port}`
  // Return callback url
  return callback
}
