var usernamePage = document.querySelector("#username-page");
var chatPage = document.querySelector("#chat-page");
var stompClient = null;
var senderName = null;
var selectedRecipient = "Groupchat";
var messageList = [];



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
            message = JSON.parse(message.body);

            if(selectedRecipient != "Groupchat"){
                showMessage(message,  false);
            }
            else{
                addMessage(message.senderName, message.recipientName, message.content)
            }
        });
        stompClient.subscribe("/topic/groupchat", function (message) {
            message = JSON.parse(message.body);

            if(message.recipientName == "Groupchat"){
                showMessage(message,  false);
            }
            else{
                addMessage(message.senderName, message.recipientName, message.content)
            }
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

// Adds a message to a List of Messages so they can be retrieved when switching between chats
function addMessage(senderName, recipientName, content){
    let names = [senderName, recipientName].sort();
    let messageKey = names.join("");
    
    if(recipientName == "Groupchat"){
        messageKey = "Groupchat";
        console.log("Groupchat message detected, changing MessageKey")
    }

    console.log("MessageKey: " + messageKey)

    if (!messageList[messageKey]){
        messageList[messageKey] = [];
    }

    let message = {
        senderName: senderName,
        recipientName: recipientName,
        content: content
    };

    messageList[messageKey].push(message)
    console.info("Added message to messageList: " + message)
}

// Retrieves the list of messages for this chat and displays them
function showMessageList(senderName, recipientName){
    let names = [senderName, recipientName].sort();
    let messageKey = names.join("");

    

    if(recipientName == "Groupchat"){
        messageKey = "Groupchat";
        console.log("Groupchat message detected, changing MessageKey")
    }

    console.log("MessageKey: " + messageKey)
    if(messageList[messageKey]){
        console.log("Messages between " + senderName + " and " + recipientName + " with Key " + messageKey);
        messageList[messageKey].forEach((message, index) => console.log(message)
        );
        messageList[messageKey].forEach((message, index) => showMessage(message, true)
        );
    }

}

// Shows a message and adds it to the list of Messages, unless we are displaying message history
function showMessage(message, isMessageHistory) {
    var chatContainer = document.getElementById("msg-page");
    var messageElement = document.createElement("div");
    console.log("Received message: ", message);

    if(!isMessageHistory){
        addMessage(message.senderName, message.recipientName, message.content)
    }
    

    if (message.senderName === senderName) {
        messageElement.innerHTML =
                    `<div class="chat-message-right mb-4">
                      <div>
                        <img src="user.png" class="rounded-circle mr-1" width="40" height="40">
                        <div class="text-muted small text-nowrap mt-2">${new Date().toLocaleTimeString()}</div>
                      </div>
                      <div class="chat-color-right flex-shrink-1 rounded py-2 px-3 mr-3">
                        <div class="font-weight-bold mb-1">You</div>
                        ${message.content}
                      </div>
                    </div>`
    } else {
        messageElement.innerHTML = `
                    <div class="chat-message-left pb-4">
                      <div>
                        <img src="user.png" class="rounded-circle mr-1" width="40" height="40">
                        <div class="text-muted small text-nowrap mt-2">${new Date().toLocaleTimeString()}</div>
                      </div>
                      <div class="chat-color-left flex-shrink-1 rounded py-2 px-3 ml-3">
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
    //var recipientName = "Groupchat"; // Messages that are sent to "Groupchat" are sent to all, whereas a specific username only sends that message to that user
    //var recipientName = "User123"; <--- Example
    var recipientName = selectedRecipient;
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


// Clears the displayed messages when switching chats
function clearMessages(){
    var chatContainer = document.getElementById("msg-page");
    chatContainer.innerHTML = "";
}


// Cookie handling to save the last username
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
// Listens for new users and adds event listeners to them, so we can switch between chats.
function updateUserList(userList){
        var otherUsernames = document.getElementById("otherUsers");
        otherUsernames.innerHTML = "";

        userList.forEach(username => {
            if(username != senderInput.value){
                var userList = document.createElement("div");
                userList.innerHTML = `
                        <a class="list-group-item list-group-item-action border-0 rounded-pill mt-2 user-entry" data-username="${username}">
                            <div class="d-flex align-items-center">
                                <img src="user.png" class="rounded-circle mr-1" width="40" height="40">
                                    <div class="flex-grow-1 ml-3">
                                    ${username}
                                </div>
                            </div>
                        </a>`;
                // Adds Event Listeners to the user element, so we can switch between chats
                const userElement = userList.querySelector(".user-entry");
                userElement.addEventListener("click", function () {
                    const clickedUsername = this.getAttribute("data-username");

                    if(selectedRecipient == clickedUsername){
                        console.log("Selected current user, doing nothing")
                        return
                    }

                    selectedRecipient = clickedUsername;
                    console.log("Selected recipient changed to:", selectedRecipient);
                    let chatTitle = document.querySelector(".chat-title");
                    chatTitle.textContent = selectedRecipient;

                    clearMessages()

                    console.log("Displaying Message history between " + senderName + " and " + selectedRecipient);
                    showMessageList(senderName, selectedRecipient)
                });

                

                otherUsernames.appendChild(userList);
            }
    });
}

function addListenerToGroupChat(){
    const groupChatElement = document.getElementById("groupchat-class");
        console.log("Event listener added to:", groupChatElement);
        groupChatElement.addEventListener("click", function(){
            
            if(selectedRecipient == "Groupchat"){
                console.log("Selected current user, doing nothing")
                return
            }

            selectedRecipient = "Groupchat"
            console.log("Selected recipient changed to:", selectedRecipient);
            let chatTitle = document.querySelector(".chat-title");
            chatTitle.textContent = selectedRecipient;
            
            
            clearMessages()
            console.log("Displaying Message history between " + senderName + " and " + selectedRecipient);
            showMessageList(senderName, selectedRecipient)
        })
}

addListenerToGroupChat()
