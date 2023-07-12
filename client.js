const net = require("net");
const readline = require("readline");

const client = net.connect(8080, () => {
  console.log("Connected to server");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt("Action: ");
  rl.prompt();

  rl.on("line", (input) => {
    if (input === ".s") {
      rl.question("Enter a message: ", (message) => {
        client.write(message);
      });
    } else {
      console.log("Invalid action");
    }
    rl.prompt();
  });

  rl.on("close", () => {
    client.end();
    console.log("Connection closed");
  });
});

client.on("data", (data) => {
  console.clear();
  process.stdout.write(data.toString().trim() + "\n");
});

client.on("end", () => {
  console.log("Disconnected from server");
});
