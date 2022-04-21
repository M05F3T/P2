//initialize connection between server and client
const socket = io();

const canvas = document.getElementById("ctx");
const ctx = document.getElementById("ctx").getContext("2d");

const idText = document.getElementById("worldId");
const clearBtn = document.getElementById("delete");


const formMenu = document.getElementById("form-menu");

const hostBtn = document.getElementById("host");
const joinBtn = document.getElementById("join");
const worldSelect = document.getElementById("worldSelect");
const colorInput = document.getElementById("color");
const nameInput = document.getElementById("name");
    
const listSelector = document.getElementById("listSelector");


let myId;
let localWorld;
let hover = false;
let targetEntityId;
let canUseKeyboard = true;


getServerData();
sendClientData();
navigationListeners();
popUpListeners();
deleteListeners();

let mouseX;
let mouseY;

function insertWorldsInSelect(data) {
    for (const world in data) {
        let option = document.createElement('option');
        option.value = data[world];
        option.innerHTML = "World: " + data[world];

        worldSelect.appendChild(option);
    }

}

function drawElements(data) {
    for (const key in data.entities) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = data.entities[key].color;
        ctx.rect(data.entities[key].x, data.entities[key].y,  data.entities[key].w,data.entities[key].h);
        ctx.fill();
        ctx.stroke();

        drawCardText(data.entities[key].title, data.entities[key].x + (data.entities[key].w / 2),data.entities[key].y + (data.entities[key].h / 2));
    }
}


function drawCardText(title,x,y) {
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.textBaseline = "middle";
        ctx.fillText(title, x, y);
}

function drawLists(data) {
    let i = localWorld.listCount - 1;
    
    for (const key in data.lists) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = data.lists[key].color;
        ctx.rect(
            data.lists[key].x,
            data.lists[key].y,
            data.lists[key].w,
            data.lists[key].h
        );
        ctx.fill();
        ctx.stroke();

        //draw list name
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText(
            data.lists[key].title,
            data.lists[key].x + 100,
            data.lists[key].y + 25
        );

        //draw ideas
        let containedIdeasCount = 0;
        for (const object in data.lists[key].containedIdeas) {
            ctx.font = "15px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.fillText(
                data.lists[key].containedIdeas[object].title,
                data.lists[key].x + 100,
                data.lists[key].y + 45 + containedIdeasCount * 20
            );
            ++containedIdeasCount;
        }

        i--;
    }
}

function drawPickUpToolTip(data) {
    for (const key in data.players) {
        //only draws for the current clients player
        if (data.players[key].id === myId && data.players[key].isColliding === true && isEmpty(data.players[key].connectedEntity) === true) {
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.fillText("Press E to interact", data.players[key].x, data.players[key].y - 45)
        }
    }
}

function drawLineLength(x1, y1, x2, y2, maxLen, color) {
    let vx = x2 - x1; // get dist between start and end of line
    let vy = y2 - y1; // for x and y

    // use pythagoras to get line total length
    let mag = Math.sqrt(vx * vx + vy * vy);
    if (mag > maxLen) {
        // is the line longer than needed?

        // calculate how much to scale the line to get the correct distance
        mag = maxLen / mag;
        vx *= mag;
        vy *= mag;
    } else if (mag < maxLen) {
        maxLen = maxLen / mag;
        vx *= maxLen;
        vy *= maxLen;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + vx, y1 + vy);
    ctx.stroke();
}

function drawPlayers(data) {
    for (const key in data.players) {
        ctx.save();
        //draw player circle
        ctx.beginPath();
        ctx.arc(data.players[key].x, data.players[key].y, data.players[key].h / 2, 0, 2 * Math.PI);
        ctx.fillStyle = data.players[key].color;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();

        

        drawLineLength(
            data.players[key].x,
            data.players[key].y,
            data.players[key].mousePos.x,
            data.players[key].mousePos.y,
            data.players[key].h / 2,
            data.players[key].viewIndicatorColor
        );

        ctx.restore();

        //draw name
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText(data.players[key].name, data.players[key].x, data.players[key].y + 65)

        //draw picked up entity
        if (isEmpty(data.players[key].connectedEntity) === false) {
            ctx.beginPath();
            ctx.strokeStyle = data.players[key].color;
            ctx.fillStyle = data.players[key].connectedEntity.color;
            ctx.rect(data.players[key].connectedEntity.x, data.players[key].connectedEntity.y,  data.players[key].connectedEntity.w,data.players[key].connectedEntity.h);
            ctx.fill();
            ctx.stroke();

            drawCardText(data.players[key].connectedEntity.title,data.players[key].connectedEntity.x + (data.players[key].connectedEntity.w / 2), data.players[key].connectedEntity.y + (data.players[key].connectedEntity.h / 2));
        }

    }
}

function renderCanvas() {



    resetCanvas();

    drawLists(localWorld);
    drawElements(localWorld);
    drawPlayers(localWorld);
    drawPickUpToolTip(localWorld);
}

function resetCanvas() {
    //set canvas size to window size.
    ctx.canvas.width = window.innerWidth - 350;
    ctx.canvas.height = window.innerHeight;

    //clear canvas berfore new frame
    ctx.clearRect(0, 0, window.innerWidth - 350, window.innerHeight);
}

function sendClientData() {



    clearBtn.addEventListener("click", (e) => {
        socket.emit("clear", localWorld.worldId);
    });

    joinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let name = nameInput.value;
        let color = colorInput.value;
        let Id = worldSelect.value;

        //hide form
        formMenu.style = "display: none;";

        socket.emit('join', {
            name: name,
            color: color,
            sessionId: Id,
            host: false
        });
    });

    hostBtn.addEventListener('click', (e) => {
        e.preventDefault();
        let name = nameInput.value;
        let color = colorInput.value;

        //hide form
        formMenu.style = "display: none;";


        socket.emit('join', {
            name: name,
            color: color,
            sessionId: "",
            host: true
        });
    });


    document.onkeydown = (event) => {
        if (canUseKeyboard === true) {
            if (event.key === 'd' || event.key === 'D') {
                socket.emit('keyPress', {
                    inputId: 'right',
                    state: true,
                    worldId: localWorld.worldId
                })
            } else if (event.key === 's' || event.key === 'S') {
                socket.emit('keyPress', {
                    inputId: 'down',
                    state: true,
                    worldId: localWorld.worldId
                })
            } else if (event.key === 'a' || event.key === 'A') {
                socket.emit('keyPress', {
                    inputId: 'left',
                    state: true,
                    worldId: localWorld.worldId
                })
            } else if (event.key === 'w' || event.key === 'W') {
                socket.emit('keyPress', {
                    inputId: 'up',
                    state: true,
                    worldId: localWorld.worldId
                })
            } else if (event.key === 'e' || event.key === 'E') {

                socket.emit('keyPress', {
                    inputId: 'pickUpKeyPressed',
                    state: true,
                    worldId: localWorld.worldId
                })
            }
        }

    }

    document.onkeyup = (event) => {
        if (canUseKeyboard === true) {
            if (event.key === 'd' || event.key === 'D') {
                socket.emit('keyPress', {
                    inputId: 'right',
                    state: false,
                    worldId: localWorld.worldId
                })
            } else if (event.key === 's' || event.key === 'S') {
                socket.emit('keyPress', {
                    inputId: 'down',
                    state: false,
                    worldId: localWorld.worldId
                })
            } else if (event.key === 'a' || event.key === 'A') {
                socket.emit('keyPress', {
                    inputId: 'left',
                    state: false,
                    worldId: localWorld.worldId
                })
            } else if (event.key === 'w' || event.key === 'W') {
                socket.emit('keyPress', {
                    inputId: 'up',
                    state: false,
                    worldId: localWorld.worldId
                })
            } else if (event.key === 'e' || event.key === 'E') {
                socket.emit('keyPress', {
                    inputId: 'pickUpKeyPressed',
                    state: false,
                    worldId: localWorld.worldId
                })
            }
        }

    }

}

function getServerData() {

    socket.on("sendId", (data) => {
        myId = data;
    });

    socket.on("worldId", (worldId) => {
        idText.innerHTML = "#" + worldId;
    });

    socket.on("currentWorlds", (data) => {
        insertWorldsInSelect(data);
        if (worldSelect.value == "") {
            joinBtn.disabled = true;
        }
    });

    socket.on("newPlayerJoined", () => {
        insertPlayersHtmlElement();
        updateListSelector(localWorld);
    });

    socket.on("worldUpdate", (data) => {

        //update local world storage
        localWorld = data;
        //render new update
        renderCanvas();
    });

    socket.on("updateLists", (data) => {
        updateListSelector(data);
        insertIdeasToListsTab();
    })

    socket.on("error", (message) => {
        alert(message);
    });
}


function createIdea() {
    const spawnBtn = document.getElementById("spawn-card");

    spawnBtn.disabled = true;
    canUseKeyboard = false
    
    const createIdeaCancelButton = document.getElementById("create-idea-cancel-button");
    const ideaName = document.getElementById("idea-name");
    const ideaDescription = document.getElementById("idea-description");
    const createIdeaButton = document.getElementById("create-idea-button")

    const createIdeaContent = document.getElementById("create-idea");

    createIdeaContent.style.display = "flex";

    createIdeaCancelButton.addEventListener("click", () => {
        createIdeaContent.style.display = "none";
        canUseKeyboard = true;
        spawnBtn.disabled = false;

    });

    createIdeaButton.addEventListener("click", () => {
        let w = ctx.measureText(ideaName.value).width + 10;
        
        if(ideaName.value === "") {
            alert("You have to specify a title");
            createIdea();
        } else{
            dataObj = {
                ideaName: ideaName.value,
                ideaDescription: ideaDescription.value,
                worldId: localWorld.worldId,
                width: w
            }

            socket.emit("spawnElement", dataObj);

            createIdeaContent.style.display = "none";
            canUseKeyboard = true;

            spawnBtn.disabled = false;

        }
    },{once : true});


}

function createList() {
    const spawnList = document.getElementById("spawn-list");

    spawnList.disabled = true;


    canUseKeyboard = false
    
    const createListCancelButton = document.getElementById("create-list-cancel-button");
    const listName = document.getElementById("list-name");
    const createListButton = document.getElementById("create-list-button")

    const ListContent = document.getElementById("create-list");

    ListContent.style.display = "flex";

    createListCancelButton.addEventListener("click", () => {
        ListContent.style.display = "none";
        canUseKeyboard = true;
        spawnList.disabled = false;
    });

    createListButton.addEventListener("click", () => {
        if(listName.value === "") {
            alert("You have to specify a title");
            //createList();
        }else {
            //alert("you've created a list!");
            dataObj = {
                listName: listName.value,
                worldId: localWorld.worldId,
            };

            //socket.emit create list here
            socket.emit("spawnList", dataObj);

            //close form
            ListContent.style.display = "none";
            canUseKeyboard = true;

            spawnList.disabled = false;
        }
    },{once : true});
}

function updateListSelector(data) {
    var child = listSelector.lastElementChild;
    while (child) {
        listSelector.removeChild(child);
        child = listSelector.lastElementChild;
    }
    for (const key in data.lists) {
        let option = new Option(data.lists[key].title, data.lists[key].id);
        listSelector.appendChild(option);
    }
}

function deleteListeners() {
    const deleteListButton = document.getElementById("delete-list");

    deleteListButton.addEventListener("click", (e) => {
        deleteList();
    });
}

function deleteList() {
    if (localWorld.listCount > 0) {
        socket.emit(
            "removeSelectedList",
            localWorld.worldId,
            listSelector.value
        );
    } else {
        alert("There are no lists to remove");
    }
}

function popUpListeners() {
    const spawnBtn = document.getElementById("spawn-card");
    const spawnList = document.getElementById("spawn-list");


    spawnBtn.addEventListener("mouseup", (e) => {
        createIdea();
    });

    spawnList.addEventListener("mouseup", (e) => {
        createList();
    });
}

function navigationListeners() {
    const homeContent = document.getElementById("home-content");
    const listsContent = document.getElementById("lists-content");
    const ideasContent = document.getElementById("ideas-content");
    const timerContent = document.getElementById("timer-content");

    const homeButton = document.getElementById("home-button")
    const listsButton = document.getElementById("lists-button")
    const ideasButton = document.getElementById("ideas-button")
    const timerButton = document.getElementById("timer-button")
    const backButton = document.getElementById("back-button")

    homeButton.addEventListener("click", (e) => {
        homeContent.style.display = "block";
        listsContent.style.display = "none";
        ideasContent.style.display = "none";
        timerContent.style.display = "none";
    });

    listsButton.addEventListener("click", (e) => {
        homeContent.style.display = "none";
        listsContent.style.display = "block";
        ideasContent.style.display = "none";
        timerContent.style.display = "none";
        insertIdeasToListsTab(); 
    });

    ideasButton.addEventListener("click", (e) => {
        homeContent.style.display = "none";
        listsContent.style.display = "none";
        ideasContent.style.display = "block";
        timerContent.style.display = "none";
    });

    timerButton.addEventListener("click", (e) => {
        homeContent.style.display = "none";
        listsContent.style.display = "none";
        ideasContent.style.display = "none";
        timerContent.style.display = "block";
    });

    backButton.addEventListener("click", (e) => {
        alert("u went back in time!!!!");
    });

    listSelector.addEventListener("change", () => {
        console.log("I changed");
        insertIdeasToListsTab();
    })


}
//----helper functions---
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function insertPlayersHtmlElement() {
    const scrollBox = document.getElementById("playerScrollBox");

    //clear scrollBox
    scrollBox.innerHTML = "";

    for (const player in localWorld.players) {
        //create container div
        let new_row = document.createElement('div');
        new_row.className = "player-element";

        //insert paragraph with name in div
        let paragraph = document.createElement('p');
        paragraph.innerHTML = localWorld.players[player].name;



        let colorDiv = document.createElement('div');
        colorDiv.className = "circle";
        colorDiv.style.backgroundColor = localWorld.players[player].color;

        new_row.appendChild(paragraph);
        new_row.appendChild(colorDiv);

        //f.eks new_row should now look like this.

        // <div class="player-element">
        //     <p>Nicolai Bergulff</p>
        //     <div class="circle" style="background-color: #5677a1;"></div>
        // </div>

        //insert the new row
        scrollBox.appendChild(new_row)
    }
}

//Inserts ideas to scroll box in the lists tab
function insertIdeasToListsTab() {
    const scrollBox = document.getElementById("listScrollBox");
    let listId = listSelector.value;

    //clear scrollBox
    scrollBox.innerHTML = "";

    console.log("Selected list: " + listId);
    for (const key in localWorld.lists[listId].containedIdeas) {
        //create container div
        let new_row = document.createElement("div");
        new_row.className = "idea-element";

        //insert paragraph with name in div
        let paragraph = document.createElement("p");
        paragraph.innerHTML = localWorld.lists[listId].containedIdeas[key].title;

        let colorDiv = document.createElement("div");
        colorDiv.className = "circle";
        colorDiv.style.backgroundColor = localWorld.lists[listId].containedIdeas[key].title;

        new_row.appendChild(paragraph);
        new_row.appendChild(colorDiv);

        //insert the new row
        scrollBox.appendChild(new_row);
    }
}


canvas.onmousemove = function (e) {
    // Get the current mouse position
    let r = canvas.getBoundingClientRect(),
        x = e.clientX - r.left, y = e.clientY - r.top;

    socket.emit("playerMousePos", { x: x, y: y, playerId: myId, worldID: localWorld.worldId });

    hover = false;
    targetEntityId = "";
    if (!isEmpty(localWorld.entities)) {
        for (const key in localWorld.entities) {
            if (x >= localWorld.entities[key].x && x <= localWorld.entities[key].x + localWorld.entities[key].w && y >= localWorld.entities[key].y && y <= localWorld.entities[key].y + localWorld.entities[key].h) {
                hover = true
                targetEntityId = localWorld.entities[key].id;

                document.body.style.cursor = "pointer";
                break;
            } else {

                document.body.style.cursor = "default";
            }
        }
    }
}

