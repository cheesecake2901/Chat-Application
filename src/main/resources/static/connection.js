var usernamePage = document.querySelector("#username-page");
var chatPage = document.querySelector("#chat-page");
var stompClient = null;
var senderName = null;

function setConnected(connected) {
    document.getElementById("sendMessage").disabled = !connected;
}

function connect() {
    senderName = document.getElementById("senderInput").value.trim();
    if(senderName != null){
        usernamePage.classList.add("hidden");
        chatPage.classList.remove("hidden");
        document.querySelector("body").classList.remove("custom-bg");
    }
    var socket = new SockJS("/chat");
    stompClient = Stomp.over(socket);
    stompClient.connect({username: senderName}, function (frame) {
        setConnected(true);
        stompClient.subscribe("/user/queue/messages", function (message) {
            showMessage(JSON.parse(message.body));
        });
        stompClient.subscribe("/topic/groupchat", function (message) {
            showMessage(JSON.parse(message.body));
        });
        stompClient.subscribe("/topic/activeUsers", function (message) {
            updateUserList(JSON.parse(message.body));
        });
        fetchActiveUsers();


    }, function (error) {
        console.error("WebSocket Error: ", error);
    });
}

function fetchActiveUsers() {
    fetch('/activeUsers')
        .then(response => response.json())
        .then(data => {
        updateUserList(data);
    })
        .catch(error => {
        console.error("Error fetching active users: ", error);
    });
}

function showMessage(message) {
    var chatContainer = document.getElementById("msg-page");
    var messageElement = document.createElement("div");
    console.log("Received message: ", message);

    if (message.senderName === senderName) {
        messageElement.className = "outgoing-chats";
        messageElement.innerHTML =
        `<div class="chat-message-right mb-4">
          <div>
            <img src="user.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
              <div class="text-muted small text-nowrap mt-2">${new Date().toLocaleTimeString()}</div>
              </div>
              <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
            <div class="font-weight-bold mb-1">You</div>
            ${message.content}
          </div>
        </div>`
    } else {
        messageElement.className = "received-chats";
        messageElement.innerHTML = `
                    <div class="chat-message-left pb-4">
                      <div>
                        <img src="user.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
                        <div class="text-muted small text-nowrap mt-2">${new Date().toLocaleTimeString()}</div>
                      </div>
                      <div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
                        <div class="font-weight-bold mb-1">${message.senderName}</div>
                        ${message.content}
                      </div>
                    </div>`
    }

    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
    if (!stompClient || !stompClient.connected) {
        alert("Not connected to WebSocket server!");
        return;
    }
    var senderName = document.getElementById("senderInput").value;
    var recipientName = "Groupchat"; // Messages that are sent to "Groupchat" are sent to all, whereas a specific username only sends that message to that user
    //var recipientName = "User123"; <--- Example
    var content = document.getElementById("messageInput").value;
    if (!senderName || !content) {
        alert("Please enter a name and a message!");
        return;
    }

    var chatMessage = { senderName: senderName, recipientName: recipientName, content: content };

    if(recipientName == "Groupchat"){
        console.info("Sending Groupchat")
        stompClient.send("/app/sendGroupchat", {}, JSON.stringify(chatMessage));
    }
    else{
        console.info("Sending Private Chat")
        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
    }
    document.getElementById("messageInput").value = "";
}

document.getElementById("sendMessage").onclick = sendMessage;

// Cookie stuff
//------------------------------------------------

const senderInput = document.getElementById("senderInput");



function setUsernameCookie(name){
    document.cookie = "username=name";
    console.log("Username Cookie set to " + name);
}


function getCookie(cookieName){
    let cookieNameAdjusted = cookieName + "=";
    let cookieArray = document.cookie.split(';');

    for(let i = 0; i < cookieArray.length; i++){
        let currentCookie = cookieArray[i];
        if(currentCookie.indexOf(cookieNameAdjusted) === 0){
            console.log("Cookie " + cookieName + " found. Content: " + currentCookie.substring(cookieNameAdjusted.length));
            return currentCookie.substring(cookieNameAdjusted.length);
        }
    }
    console.log("No Cookie " + cookieName + " found.");
}

function setCookie(cookieName, cookieValue) {
    document.cookie = cookieName + "=" + cookieValue;
    console.log("Cookie " + cookieName + " set to " + cookieValue);
}

// Check if a username cookie exists and replace the input with it
function checkAndReplaceUsernameInput() {
    let cookie = getCookie("username");
    if (cookie) {
        senderInput.value = cookie;
        senderInput.placeholder = cookie;
        console.log("Username cookie found and input set to " + cookie);
    }
    else{
        console.log("Could not find username cookie on initial load.");
    }
}
// Save the username input to a cookie when it is set in our Chat Window
function saveUsernameInput() {
    let username = senderInput.value;
    if (username != null) {
        console.info("New username input detected, cookie set to " + username);
        setCookie("username", username);

    }
    else{
        console.error("Could not find username input to save.");
    }
}

checkAndReplaceUsernameInput();

senderInput.addEventListener("change", function(){
    saveUsernameInput();
});

//------------------------------------------------

// Testing for list of active users, TODO: Delete later
function updateUserList(userList){
        var otherUsernames = document.getElementById("otherUsers");
        otherUsernames.innerHTML = "";

        userList.forEach(username => {
            if(username != senderInput.value){
                var userList = document.createElement("div");
                userList.innerHTML = `
                        <a class="list-group-item list-group-item-action border-0 rounded-pill mt-2 user-entry" data-username="${username}">
                            <div class="d-flex align-items-start">
                                <img src="user.png" class="rounded-circle mr-1" width="40" height="40">
                                    <div class="flex-grow-1 ml-3">
                                    ${username}
                                </div>
                            </div>
                        </a>`;
                // Event Listener nach dem Einfügen binden
                const userElement = userList.querySelector(".user-entry");
                userElement.addEventListener("click", function () {
                    const clickedUsername = this.getAttribute("data-username");
                    console.log("Geklickt:", clickedUsername);
                    // Hier kannst du machen, was du willst – z.B. Nachricht senden etc.
                });
                otherUsernames.appendChild(userList);
            }
    });
}


