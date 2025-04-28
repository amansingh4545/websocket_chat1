document.getElementById("chatContainer").style.display = "flex";
document.getElementById("greet").style.display = "flex";
const socket = new WebSocket("ws://localhost:12345/monitor");

socket.onmessage = event => {
    let data;
    try { data = JSON.parse(event.data); } catch { data = event.data; }

    if (data.type === "users") {
        current_users = data.users;
        const ul = document.getElementById("userList");
        ul.innerHTML = "";
        data.users.forEach(user => {
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
        });
    }
    else if (data.type === "file") {
        const messagesDiv = document.getElementById("messages");
        const msg = document.createElement("p");
        msg.classList.add("msg");

        const isImage = data.filetype.startsWith("image/");
        if (isImage) {
            const container = document.createElement("div");
            container.classList.add("message-container");

            const sender = document.createElement("span");
            sender.classList.add("message-sender");
            const from = data.from;
            const toFormatted = `[${data.to.join(', ')}]`;
            sender.textContent = `${from} \u2192 ${toFormatted} `;

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
            
            const from = data.from;
            const toFormatted = `[${data.to.join(', ')}]`;
            sender.textContent = `${from} \u2192 ${toFormatted} `;
        
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
            const folderIcon = "\uD83D\uDCC1";
            text.textContent = `${folderIcon} ${data.filename}`;
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
    
        const sender = document.createElement("span");
        sender.classList.add("message-sender");
        const from = data.from;
        const toFormatted = `[${data.to.join(', ')}]`;
        sender.textContent = `${from} \u2192 ${toFormatted} `;
    
        const messageText = document.createElement("span");
        messageText.classList.add("message-text");
        messageText.textContent = `: ${data.message}`;
    
        msg.appendChild(sender);
        msg.appendChild(messageText);
    
        messagesDiv.appendChild(msg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    else if (data.type === "join" || data.type === "left"){
        const messagesDiv = document.getElementById("messages");
        const msg = document.createElement("p");
        msg.classList.add("msg");
        if(data.type === "join"){
            msg.classList.add("join");
        }
        if(data.type === "left"){
            msg.classList.add("left");
        }
    
        const messageText = document.createElement("span");
        messageText.classList.add("message-text");
        messageText.textContent = `${data.msg}`;
    
        msg.appendChild(messageText);
    
        messagesDiv.appendChild(msg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
};
