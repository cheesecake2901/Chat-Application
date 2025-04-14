var usernamePage = document.querySelector("#username-page");
var chatPage = document.querySelector("#chat-page");
var stompClient = null;
var senderName = null;
var selectedRecipient = "Groupchat";
var messageList = [];
var profilePicDict = {};


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
            console.log("Private message, selectedRec: " + selectedRecipient)
            if(selectedRecipient != "Groupchat"){
                showMessage(message,  false);
            }
            else{
                addMessage(message.senderName, message.recipientName, message.content)
                newMessageIcon(message.senderName)
            }
        });
        stompClient.subscribe("/topic/groupchat", function (message) {
            message = JSON.parse(message.body);
            console.warn("Groupchat message, selectedRec: " + selectedRecipient)
            if(selectedRecipient == "Groupchat"){
                showMessage(message,  false);
            }
            else{
                addMessage(message.senderName, message.recipientName, message.content);
                newMessageIcon("Groupchat");
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

// Generate the users profile picture with the first letter of the Username
function getOrGenerateProfilePicture(username){

    if(username == "Groupchat"){
        // We need to wrap the image in a wrapper to ensure we can replace it later
        const wrapper = document.createElement("div");
        wrapper.classList.add('profile-picture');

        const groupChatImage = document.createElement("img");
        groupChatImage.src = "user.png"; // Path to your specific image for Groupchat
        groupChatImage.alt = "Groupchat";
        groupChatImage.className = "rounded-circle mr-1"; // Apply your desired classes
        groupChatImage.width = 50;
        groupChatImage.height = 50;
        wrapper.appendChild(groupChatImage);
        return wrapper;
    }

    if(!profilePicDict[username]){

        

        console.info("Generating Profile Picture for user " + username)
        let firstLetter = username.charAt(0).toUpperCase();
        const profilePicElement = document.createElement('div');
        profilePicElement.classList.add('profile-picture');
        profilePicElement.textContent = firstLetter;
    
        profilePicDict[username] = profilePicElement;
    }

    
    return profilePicDict[username].cloneNode(true);

}

function changeChatTitleImage(username){
    let chatTitle = document.querySelector(".chat-title-image");
    profilePicElement = getOrGenerateProfilePicture(username);
    const oldProfilePic = chatTitle.querySelector('.profile-picture')

    if (oldProfilePic) {
        chatTitle.replaceChild(profilePicElement, oldProfilePic);
      } else {
        console.info('No profile picture element found within chat Title. Adding a new picture.');
        chatTitle.appendChild(profilePicElement);
    }
}

// Adds an Icon to a user if new Messages are available
function newMessageIcon(username){
    console.info("New Message Icon");
    let userElement = document.querySelector(`[data-username="${username}"]`);
    if (userElement) {
        let flexDiv = userElement.querySelector('.d-flex');
        let blueDot = document.createElement("span");
        blueDot.classList.add("blue-dot");
        userElement.appendChild(blueDot);

    }
    else{
        console.error("Could not find user element with name " + username)
    }
}

// Removes the New Message Icon when the user is selected
function removeMessageIcon(username) {
    let userElement = document.querySelector(`[data-username="${username}"]`);
    if (userElement) {
        let blueDot = userElement.querySelector('.blue-dot');
        if (blueDot) {
            userElement.removeChild(blueDot);
        }
    }
}


// Gets a list of active users from the server
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
    let chatContainer = document.getElementById("msg-page");
    let messageElement = document.createElement("div");
    console.log("Received message: ", message);

    if(!isMessageHistory){
        addMessage(message.senderName, message.recipientName, message.content)
    }
    const contentWithLineBreaks = message.content.replace(/\n/g, '<br>');

    if (message.senderName === senderName) {
        messageElement.innerHTML =
                    `<div class="chat-message-right mb-4">
                      <div class="d-flex flex-column align-items-center">
                        <div class="profile-img-placeholder"></div>
                        <div class="text-muted small text-nowrap mt-2">${new Date().toLocaleTimeString()}</div>
                      </div>
                      <div class="chat-color-right flex-shrink-1 rounded py-2 px-3 mr-3">
                        <div class="font-weight-bold mb-1">You</div>
                        ${contentWithLineBreaks}
                      </div>
                    </div>`
    } else {
        messageElement.innerHTML = `
                    <div class="chat-message-left pb-4">
                      <div class="d-flex flex-column align-items-center">
                      <div class="profile-img-placeholder"></div>  
                      
                        <div class="text-muted small text-nowrap mt-2">${new Date().toLocaleTimeString()}</div>
                      </div>
                      <div class="chat-color-left flex-shrink-1 rounded py-2 px-3 ml-3">
                        <div class="font-weight-bold mb-1">${message.senderName}</div>
                        ${contentWithLineBreaks}
                      </div>
                    </div>`
    }
    const profilePlaceholder = messageElement.querySelector(".profile-img-placeholder");
    const profilePic = getOrGenerateProfilePicture(message.senderName);
    profilePlaceholder.replaceWith(profilePic);

    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Sends a message to the server, where they are distributed to other clients
function sendMessage() {
    if (!stompClient || !stompClient.connected) {
        alert("Not connected to WebSocket server!");
        return;
    }
    let senderName = document.getElementById("senderInput").value;

    // We use the recipientName to decide who messages are sent to by the server
    //var recipientName = "Groupchat"; // Messages that are sent to "Groupchat" are sent to all, whereas a specific username only sends that message to that user
    //var recipientName = "User123"; <--- Example
    let recipientName = selectedRecipient;
    let content = document.getElementById("messageInput").value;
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
    let chatContainer = document.getElementById("msg-page");
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
// We run this once on initial load, to grab the cookie if it exists
checkAndReplaceUsernameInput();
// Then we save the last input username when logging in
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
                                <div class="profile-img-placeholder"></div>
                                    <div class="flex-grow-1 ml-3">
                                    ${username}
                                </div>
                            </div>
                        </a>`;
                    
                // Add Profile Picture
                const profilePlaceholder = userList.querySelector(".profile-img-placeholder");
                const profilePic = getOrGenerateProfilePicture(username);
                profilePlaceholder.replaceWith(profilePic);
                
                // Adds Event Listeners to the user element, so we can switch between chats
                const userElement = userList.querySelector(".user-entry");
                userElement.addEventListener("click", function () {
                    const clickedUsername = this.getAttribute("data-username");

                    if(selectedRecipient == clickedUsername){
                        console.log("Selected current user, doing nothing");
                        return
                    }

                    selectedRecipient = clickedUsername;
                    console.log("Selected recipient changed to:", selectedRecipient);
                    let chatTitle = document.querySelector(".chat-title");
                    chatTitle.textContent = selectedRecipient;
                    changeChatTitleImage(selectedRecipient);

                    clearMessages();
                    removeMessageIcon(selectedRecipient);
                    console.log("Displaying Message history between " + senderName + " and " + selectedRecipient);
                    showMessageList(senderName, selectedRecipient);
                });

                

                otherUsernames.appendChild(userList);
            }
    });
}
// Adds an event Listener to the Group Chat Element on initial load, so we can switch between chats
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
            changeChatTitleImage("Groupchat");

            removeMessageIcon("Groupchat");
            clearMessages();
            console.log("Displaying Message history between " + senderName + " and " + selectedRecipient);
            showMessageList(senderName, selectedRecipient);
        })
}
addListenerToGroupChat()
changeChatTitleImage("Groupchat");