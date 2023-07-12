//dependencies
const net = require("net");
const fs = require("fs");

//local memory objects
let game_world_seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
let game_world_season = 'Spring';

let game_world_times = ['Morning', 'Midday', 'Night'];
let game_world_time = 'Morning';

let game_world_span = JSON.parse(fs.readFileSync("database/game_world_span.json", "utf8"));

let server_connections = 0;
let clients = [];
let messageHistory = [];

// Function to manage message history
function addToMessageHistory(message) {
  if (messageHistory.length === 8) {
    messageHistory.shift(); // Remove the oldest message if the history is full
  }
  messageHistory.push(message); // Add the new message to the history
}

//create server object with client socket parameter
const server = net.createServer((socket) => {
  // Add the client socket to the clients array
  clients.push(socket);

  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  
  // Add the connection event to the message history
  addToMessageHistory(`Client connected: ${clientAddress}`);

  const logData = {
    event: 'connected',
    user: clientAddress,
    date: new Date().toLocaleString(),
  };

  const logEntry = `event: ${logData.event}\nuser: ${logData.user}\ndate: ${logData.date}\n\n`;

  fs.appendFile('database/server_log_connections.txt', logEntry, (err) => {
    if (err) {
      console.error('Error writing to server log:', err);
    }
  });

  socket.on("data", (data) => {
    const message = data.toString().trim();

    // Write the message to the server log
    const logData = {
      event: "message",
      user: clientAddress,
      message: message,
      date: new Date().toLocaleString(),
    };

    // Add the message to the history
    addToMessageHistory(`${clientAddress}: ${message}`);

    const logEntry = `event: ${logData.event}\nuser: ${logData.user}\nmessage: ${logData.message}\ndate: ${logData.date}\n\n`;

    fs.appendFile("database/server_log_messages.txt", logEntry, (err) => {
      if (err) {
        console.error("Error writing to server log:", err);
      }
    });

    // Send the message back to all clients except the one who sent it
    clients.forEach((client) => {
        client.write(`${clientAddress}: ${message}\n`);
    });
  });

  socket.on("error", (error) => {
    if (error.code === "ECONNRESET") {
      console.log("Possible: Client connection reset.");
      // Handle the case when the client closes the connection abruptly
    } else {
      console.error("Socket Error:", error);
    }
  });

  socket.on("close", () => {
    // Add the disconnection event to the message history
    addToMessageHistory(`Client disconnected: ${clientAddress}`);

    const logData = {
      event: 'disconnected',
      user: clientAddress,
      date: new Date().toLocaleString(),
    };

    const logEntry = `event: ${logData.event}\nuser: ${logData.user}\ndate: ${logData.date}\n\n`;

    fs.appendFile('database/server_log_disconnections.txt', logEntry, (err) => {
      if (err) {
        console.error('Error writing to server log:', err);
      }
    });

    // Remove the client socket from the clients array
    clients = clients.filter((client) => client !== socket);
  });
});

server.on("error", (err) => {
  console.error("Server Error:", err);
});

//runs once on server start
server.listen(8080, () => {
  console.log("");
  console.log("MUD Buiera online.");
});

//server pulse per 1 second
setInterval(() => {
  console.clear();
  game_world_span.second++;
  if (game_world_span.second === 60) {
    game_world_span.minute++;
    game_world_span.second = 0;
  } else if (game_world_span.second > 60) {
    game_world_span.minute += Math.floor(game_world_span.second / 60);
    game_world_span.second = game_world_span.second % 60;
  }
  if (game_world_span.minute === 60) {
    game_world_span.hour++;
    game_world_span.minute = 0;
  } else if (game_world_span.minute > 60) {
    game_world_span.hour += Math.floor(game_world_span.minute / 60);
    game_world_span.minute = game_world_span.minute % 60;
  }

  server.getConnections((err, count) => {
    server_connections = err ? err : count;
  });

  console.log("");
  console.log("Server");
  console.log(new Date().toLocaleString());
  console.log("Users connected: " + server_connections);

  console.log("");
  console.log("Game world");
  console.log("Season: " + game_world_season);
  console.log("Time: " + game_world_time);
  console.log(`Span: ${game_world_span.hour} ${game_world_span.minute} ${game_world_span.second}`);

  console.log("");
  console.log(messageHistory.join("\n"));
}, 1000);

//write database backup every 10 seconds
setInterval(() => {
  fs.writeFile("database/game_world_span.json", JSON.stringify(game_world_span), (err) => {
    if (err) {
      console.error(err);
    }
  });
}, 10000);
