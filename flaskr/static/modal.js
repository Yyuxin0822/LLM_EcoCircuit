addGlobalEventListener('keydown','#modal-note',e=>{
    if (e.shiftKey && e.key === "Enter") {
        let content = e.target.value;
        console.log("The content is");
        console.log(content);
        let modalbody=document.getElementById("modal-body")

        let message2 = document.createElement("p");
        message2.className = 'message';
        message2.innerHTML = '-----';
        modalbody.appendChild(message2);

        let message1 = document.createElement("p");
        message1.className = 'message';
        message1.innerHTML = 'You: ';
        modalbody.appendChild(message1);

        let modalnote=document.createElement("p");
        modalnote.className = 'note';
        modalnote.style.color = "black";
        modalnote.style.fontWeight = "bold";
        modalnote.style. backgroundColor = "white";
        modalnote.style.border="1px solid white";
        modalnote.style.borderRadius="5px";
        modalnote.style.padding="10px";
        modalnote.innerHTML = content;
        modalbody.appendChild(modalnote);
        e.target.value = "";
        e.preventDefault();
    }
})

// //////////// // //////////// // ////////////

const openModalButtons=document.querySelectorAll('[data-modal-target]')
const closeModalButtons=document.querySelectorAll('[data-close-button]')

const overlay=document.getElementById('overlay')    
openModal(modal)
openModalButtons.forEach(button=>{
    console.log(button.innerHTML)
    button.addEventListener('click',()=>{
        var modal=document.querySelector('#' +button.dataset.modalTarget)
        console.log(modal)
        openModal(modal)
    })
})

closeModalButtons.forEach(button=>{
    button.addEventListener('click',()=>{
        var modal=button.closest('.modal')
        closeModal(modal)
    })
})

function openModal(modal){
    console.log(modal)
    if(modal==null) return
    modal.classList.add('active')
    overlay.classList.add('active')
}


function closeModal(modal){
    if(modal==null) return
    modal.classList.remove('active')
    overlay.classList.remove('active')
}





//////////////////////////////////////////////////////
let isResizing = false;
let startHeight;
let startY;

const resizable = document.getElementById('modal');
const handle = document.getElementById('handle');
resizable.scrollTop = resizable.scrollHeight;
handle.addEventListener('mousedown', function(e) {
    isResizing = true;
    startY = e.clientY;
    startHeight = resizable.offsetHeight;
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);

});

function doResize(e) {
    if (!isResizing) return;

    const diffY = e.clientY - startY;
    resizable.style.height = (startHeight - diffY) + 'px'; // Adjusted for downward dragging
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
}
//////////////////////////////////////////////////////




function clearModal(){
    let modal = document.getElementById("modal-body");
    while (modal.firstChild) {
        modal.removeChild(modal.firstChild);
    }
}

buttonGen.addEventListener('click',()=>{
    clearModal();
})





// function isException(string) {
//     let startPattern = `--------(Time of This Ask:`;
//     let endPattern = ")---------";
//     return string.startsWith(startPattern) && string.endsWith(endPattern);
// }

function scrollToBottom(panel) {
    panel.scrollTop = panel.scrollHeight;
}



let lastFetchedMessage = "";  

function fetchRepeatedly() {
    const message = getData(message_url);
    
    message.then(result => {
        let modal = document.getElementById("modal-body");
        modal.style.overflowY = "scroll";
        modal.style.scrollBehavior = "smooth";
        modal.style.scrollbarWidth = "thin";

        // Assuming result is an array of strings, we join them to get the full message
        let currentMessage = result.join("\n");

        // If currentMessage is the same as the last one, just reset the timeout
        if (currentMessage === lastFetchedMessage) {
            setTimeout(fetchRepeatedly, 10000);
            return;
        }

        let newParts = currentMessage.replace(lastFetchedMessage, "").trim().split("\n");

        newParts.forEach(part => {
            let para = part.trim();
            if (para) {
                let p = document.createElement("p");
                p.className = 'message';
                p.innerHTML = para;
                modal.appendChild(p);
                scrollToBottom(modal);
            }
        });

        // Save the current message for the next fetch
        lastFetchedMessage = currentMessage;

        // Set the timeout to 20 seconds
        setTimeout(fetchRepeatedly, 10000);

    }).catch(error => {
        // Handle error
        setTimeout(fetchRepeatedly, 10000);
    });
}

fetchRepeatedly();  // Start the cycle
