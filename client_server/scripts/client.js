let first_time = 1;
let socket;
let Name;
let current_users;
let pendingFile = null;
let selectedUsers = [];
const sendToBtn = document.getElementById("sendToBtn");

document.getElementById("wel").style.display = "flex";
document.getElementById("nameInput").focus();

document.getElementById("nameInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        joinChat();
    }
});

document.getElementById("messageInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

document.getElementById("send-to-container").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const input = document.getElementById("messageInput").value.trim();
    const checkboxes = document.querySelectorAll("#userDropdown input[type=checkbox]:checked:not(#selectAllUsers)");
    selectedUsers = Array.from(checkboxes).map(cb => cb.value);

    if (pendingFile) {
        const reader = new FileReader();
        reader.onload = function () {
            if(selectedUsers.length > 0){
                socket.send(JSON.stringify({
                    type: "file",
                    to: selectedUsers,
                    message: input,
                    filename: pendingFile.name,
                    filetype: pendingFile.type,
                    file: reader.result
                }));
            }
            else{
                alert("Please Select user to send message.")
                return;
            }
            pendingFile = null;
            // selectedUsers = [];
            // const allCheckboxes = document.querySelectorAll("#userDropdown input[type=checkbox]");
            // allCheckboxes.forEach(checkbox => {
            //     checkbox.checked = false;
            // });
            // sendToBtn.textContent = "Send To ⮝";
            // sendToBtn.style.backgroundColor = "#3b82f6";
            document.getElementById("filePreview").style.display = "none";
            document.getElementById("fileName").textContent = "";
            document.getElementById("messageInput").value = "";
        };
        reader.readAsDataURL(pendingFile);
    }
    else if (input) {
        if(selectedUsers.length > 0){
            socket.send(JSON.stringify({
                type: "normal_message",
                to: selectedUsers,
                message: input,
            }));  
            // selectedUsers = [];
            // const allCheckboxes = document.querySelectorAll("#userDropdown input[type=checkbox]");
            // allCheckboxes.forEach(checkbox => {
            //     checkbox.checked = false;
            // });
            // sendToBtn.textContent = "Send To ⮝";
            // sendToBtn.style.backgroundColor = "#3b82f6";
            document.getElementById("messageInput").value = "";
        }else{
            alert("Please Select user to send message.")
            return;
        }
    }
    else{
        alert("Please enter a message before sending.");
        return;
    }
    document.getElementById("messageInput").focus();
}

document.getElementById("fileInput").addEventListener("change", function () {
    const file = this.files[0];
    this.value = "";
    if (!file) return;

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File too large. Maximum allowed is ${MAX_SIZE_MB}MB.`);
        return;
    }

    pendingFile = file;
    document.getElementById("fileName").textContent = `📁 ${file.name}`;
    document.getElementById("filePreview").style.display = "inline-block";
    document.getElementById("messageInput").focus();
});

function cancelFile() {
    pendingFile = null;
    document.getElementById("filePreview").style.display = "none";
    document.getElementById("fileName").textContent = "";
}

// ***********************************************************************************************************************

function joinChat() {

    Name = document.getElementById("nameInput").value.trim();
    if (!Name) return alert("Enter your name!");

    socket = new WebSocket("ws://127.0.0.1:12345/chat");
    socket.onopen = function () {
        socket.send(Name);
    };

    socket.onmessage = event => {
        let data;
        try { data = JSON.parse(event.data); } catch { data = event.data; }

        if (data.type === "error"){
            alert(data.error);
            return;
        }else{
            if (first_time){
                first_time = 0;
                document.getElementById("greet").textContent = `Hello, ${Name}!`;
                document.getElementById("greet").style.display = "flex";
                document.getElementById("wel").style.display = "none";
                document.getElementById("chatContainer").style.display = "flex";
                document.getElementById("messageInput").focus();
            }
            if (data.type === "users") {
                current_users = data.users;
                const ul = document.getElementById("userList");
                ul.innerHTML = "";
                data.users.forEach(user => {
                    if (user !== Name) {
                        const li = document.createElement("li");
                        const img = document.createElement("img");
                        img.src = "img/user_icon.png";
                        img.alt = "user";
                        img.classList.add("user-icon");
    
                        const span = document.createElement("span");
                        span.textContent = user;
    
                        li.appendChild(img);
                        li.appendChild(span);
                        li.onclick = () => insertPrivateTo(user);
                        ul.appendChild(li);
                    }
                });
                if (data.users.length == 1 && data.users[0] === Name){
                    return
                }
                const dropdown = document.getElementById("userDropdown");
                dropdown.innerHTML = "";
    
                const selectAllLabel = document.createElement("label");
                selectAllLabel.style.display = "block";
                selectAllLabel.innerHTML = `<input type="checkbox" id="selectAllUsers"> <strong>Select All</strong>`;
                dropdown.appendChild(selectAllLabel);
    
                data.users.forEach(user => {
                    if (user !== Name) {
                        const label = document.createElement("label");
                        label.style.display = "block";
                        label.innerHTML = `<input type="checkbox" value="${user}"> ${user}`;
                        dropdown.appendChild(label);
                    }
                });
                sendToBtn.textContent = "Send To ⮝";
                sendToBtn.style.backgroundColor = "#3b82f6";
    
                const allCheckboxes = dropdown.querySelectorAll("input[type='checkbox']:not(#selectAllUsers)");
                const selectAll = document.getElementById("selectAllUsers");
    
                selectAll.addEventListener("change", function () {
                    for (let cb of allCheckboxes) {
                        cb.checked = this.checked;
                    }
                    sendToBtn.textContent = this.checked ? "Send Msg" : "Send To ⮝";
                    sendToBtn.style.backgroundColor = this.checked ? "#2779ff" : "#3b82f6";
                });
    
                for (let cb of allCheckboxes) {
                    cb.addEventListener("change", () => {
                        const checked = dropdown.querySelectorAll("input[type='checkbox']:not(#selectAllUsers):checked");
                        document.getElementById("selectAllUsers").checked = allCheckboxes.length === checked.length; 
                        sendToBtn.textContent = checked.length > 0 ? "Send Msg" : "Send To ⮝";
                        sendToBtn.style.backgroundColor = checked.length > 0 ? "#2779ff" : "#3b82f6";
                    });
                }
            }
            else if (data.type === "file") {
                const messagesDiv = document.getElementById("messages");
                const msg = document.createElement("p");
                msg.classList.add("msg");
    
                const isFromMe = data.from === Name;
                msg.classList.add(isFromMe ? "right" : "left");
                
                const isImage = data.filetype.startsWith("image/");
                if (isImage) {
                    const container = document.createElement("div");
                    container.classList.add("message-container");
    
                    const sender = document.createElement("span");
                    sender.classList.add("message-sender");
                    if(current_users.length != data.to.length + 1){
                        msg.classList.add("private");
                    }
    
                    const from = data.from;
                    if(from == Name){
                        const toFormatted = `[${data.to.join(', ')}]`;
                        sender.textContent = `${from} \u2192 ${toFormatted} `;
                        sender.textContent = sender.textContent.replace(Name, "You");
                    }else{
                        sender.textContent = `${from} \u2192 ${data.to} `;
                        sender.textContent = sender.textContent.replace(`${data.to}`, "You");
                    }
    
                    const messageText = document.createElement("span");
                    messageText.classList.add("message-text");
                    messageText.textContent = `: ${data.message}`;
    
                    const textWrapper = document.createElement("div");
                    textWrapper.classList.add("message-text-wrapper");
                    textWrapper.appendChild(sender);
                    textWrapper.appendChild(messageText);
    
                    const img = document.createElement("img");
                    img.src = `${data.file}`;
                    img.alt = data.filename;
                    img.classList.add("message-image");
    
                    container.appendChild(textWrapper);
                    container.appendChild(img);
                    msg.appendChild(container);
                }            
                else {
                    const messageLine = document.createElement("div");
                    messageLine.classList.add("message-line");
                
                    const sender = document.createElement("span");
                    sender.classList.add("message-sender");
                    if(current_users.length != data.to.length + 1){
                        msg.classList.add("private");
                    }
                    
                    const from = data.from;
                    if (from === Name) {
                        const toFormatted = `[${data.to.join(', ')}]`;
                        sender.textContent = `${from} \u2192 ${toFormatted} `;
                        sender.textContent = sender.textContent.replace(Name, "You");
                    } else {
                        sender.textContent = `${from} \u2192 ${data.to} `;
                        sender.textContent = sender.textContent.replace(`${data.to}`, "You");
                    }
                
                    const messageText = document.createElement("span");
                    messageText.classList.add("message-text");
                    messageText.textContent = `: ${data.message}`;
                
                    messageLine.appendChild(sender);
                    messageLine.appendChild(messageText);
                
                    const fileLink = document.createElement("a");
                    fileLink.href = `${data.file}`;
                    fileLink.download = data.filename;
                    fileLink.className = "file-link";
                
                    const text = document.createElement("span");
                    text.textContent = `📁 ${data.filename}`;
                    fileLink.appendChild(text);
                
                    msg.appendChild(messageLine);
                    msg.appendChild(fileLink);
                    messagesDiv.appendChild(msg);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }                      
                messagesDiv.appendChild(msg);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
            else if(data.type === "normal_message"){
                const messagesDiv = document.getElementById("messages");
                const msg = document.createElement("p");
                msg.classList.add("msg");
            
                const isFromMe = data.from === Name;
                msg.classList.add(isFromMe ? "right" : "left");
            
                const sender = document.createElement("span");
                sender.classList.add("message-sender");
                if(current_users.length != data.to.length + 1){
                    msg.classList.add("private");
                }
    
                const from = data.from;
                if(from == Name){
                    const toFormatted = `[${data.to.join(', ')}]`;
                    sender.textContent = `${from} \u2192 ${toFormatted} `;
                    sender.textContent = sender.textContent.replace(Name, "You");
                }else{
                    sender.textContent = `${from} \u2192 ${data.to} `;
                    sender.textContent = sender.textContent.replace(`${data.to}`, "You");
                }
            
                const messageText = document.createElement("span");
                messageText.classList.add("message-text");
                messageText.textContent = `: ${data.message}`;
            
                msg.appendChild(sender);
                msg.appendChild(messageText);
            
                messagesDiv.appendChild(msg);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        }
    };
}


