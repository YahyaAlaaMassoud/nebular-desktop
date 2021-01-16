// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer } = require("electron");

// const asyncMsgBtn = document.getElementById('async-msg')

// asyncMsgBtn.addEventListener('click', () => {
//     ipcRenderer.send('asynchronous-message', 'ping')
// })

ipcRenderer.on("console-log", (event, options) => {
  appendLine(options);
});

document
  .getElementById("console-body")
  .addEventListener("keydown", function(e) {
    if (e.code === "Enter") {
      appendLine();
    } else {
      appedChar(e.key);
    }
  });

document.getElementById("clear-btn").addEventListener("click", function(e) {
  var elmnt = document.getElementById("console-body");
  elmnt.innerHTML = "";
  appendLine();
});

function appendLine(options = { msg: "", color: "turquoise" }) {
  var node = document.createElement("p");
  node.style.color = options.color;
  var spanNode = document.createElement("span");
  var msgNode = document.createTextNode(options.msg);
  var timeNode = document.createTextNode(
    `~> [${new Date().toLocaleTimeString()}] `
  );
  var elmnt = document.getElementById("console-body");
  spanNode.appendChild(timeNode);
  node.appendChild(spanNode);
  node.appendChild(msgNode);
  elmnt.appendChild(node);
  window.scrollTo(0, document.body.scrollHeight);
}

function appedChar(char) {
    var elmnt = document.getElementById("console-body");
    lastNode = elmnt.lastElementChild;
    var msgNode = document.createTextNode(char);
    lastNode.style.color = "bisque";
    lastNode.appendChild(msgNode);
    window.scrollTo(0, document.body.scrollHeight);
}
