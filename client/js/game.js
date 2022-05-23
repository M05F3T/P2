
//initialize connection between server and client
const socket = io();

const canvas = document.getElementById("ctx");
const ctx = document.getElementById("ctx").getContext("2d");


const idText = document.getElementById("worldId");
const clearBtn = document.getElementById("delete");


const formMenu = document.getElementById("form-menu");

const hostBtn = document.getElementById("host");
const templateSelector = document.getElementById("template-selector");

const joinBtn = document.getElementById("join");
const worldSelect = document.getElementById("worldSelect");
const colorInput = document.getElementById("color");
const nameInput = document.getElementById("name");

const listSelector = document.getElementById("listSelector");
const timer = document.getElementById("timer");

//local variables
let myId;
let localWorld;
let hover = false;
let targetEntityId;
let canUseKeyboard = true;
let timerValue = 0;
let currentIdea;
let mouseX;
let mouseY;

getServerData();
sendClientData();
navigationListeners();
popUpListeners();
deleteListeners();
timerFunctions();
detectIdeaTabFocus();
sendCanvasData();
saveIdea();

//this function runs when client want to autenticate with trello
function sendTokenInformationForVerify() {
    socket.emit("denial", window.location.href);
}

//sends general game data with emits to server
function sendClientData() {

    clearBtn.addEventListener("click", (e) => {
        socket.emit("clear", localWorld.worldId);
    });

    if (joinBtn != null) {
        joinBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let name = nameInput.value;
            let color = colorInput.value;
            console.log(worldSelect.value);
            let Id = worldSelect.value;

            socket.emit('join', {
                name: name,
                color: color,
                sessionId: Id,
                host: false,
                template: "none"
            });
        });
    }

    socket.on("denial", (bool) => {
        if (bool === true) {
            window.location.href = "/";
        }
    });

    socket.on('join', (doesWorldExist) => {
        if (!doesWorldExist) {
            alert("World does not exist, please provide valid world id");
        }
        else {
            //hide form
            formMenu.style = "display: none;";
        }
    });

    if (hostBtn != null) {
        hostBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let name = nameInput.value;
            let color = colorInput.value;
            let template = templateSelector.value;

            socket.emit("hostWorld", location.href);


            //hide form
            formMenu.style = "display: none;";


            socket.emit('join', {
                name: name,
                color: color,
                sessionId: "",
                href: location.href,
                host: true,
                template: template
            });
        });
        sendTokenInformationForVerify();
    }

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
        //if (canUseKeyboard === true) {
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

//keeps track of server send emits
function getServerData() {

    //updates all current ideas in world
    socket.on("updateCurrentIdeaTab", (idea) => {
        const homeContent = document.getElementById("home-content");
        const listsContent = document.getElementById("lists-content");
        const ideasContent = document.getElementById("ideas-content");
        const timerContent = document.getElementById("timer-content");

        homeContent.style.display = "none";
        listsContent.style.display = "none";
        ideasContent.style.display = "flex";
        timerContent.style.display = "none";

        let ideaTitle = document.getElementById("current-idea-title")
        let ideaDescription = document.getElementById("current-idea-description")
        let saveBtn = document.getElementById("save-current-idea")

        currentIdea = idea;

        ideaTitle.style.display = "block";
        ideaDescription.style.display = "block";
        saveBtn.style.display = "block";

        ideaTitle.value = idea.title;
        if (idea.description !== null) {
            ideaDescription.value = idea.description;
        }

        console.log("current tab updated with the idea " + idea)
    });

    //when clear button emit recieved remove all idea/entities in world
    socket.on("clearCurrentIdeaTab", () => {
        const homeContent = document.getElementById("home-content");
        const listsContent = document.getElementById("lists-content");
        const ideasContent = document.getElementById("ideas-content");
        const timerContent = document.getElementById("timer-content");

        homeContent.style.display = "block";
        listsContent.style.display = "none";
        ideasContent.style.display = "none";
        timerContent.style.display = "none";

        let ideaTitle = document.getElementById("current-idea-title")
        let ideaDescription = document.getElementById("current-idea-description")
        let saveBtn = document.getElementById("save-current-idea")

        currentIdea = null;

        ideaTitle.value = "";
        ideaDescription.value = "";

        ideaTitle.style.display = "none";
        ideaDescription.style.display = "none";
        saveBtn.style.display = "none";
        console.log("current tab cleard")
    });

    socket.on("sendId", (data) => {
        myId = data;
    });


    socket.on("worldId", (worldId) => {
        idText.innerHTML = worldId;
        console.log("window size on load was send..")
        socket.emit("windowResized", {
            canvasHeight: ctx.canvas.height,
            canvasWidth: ctx.canvas.width,
            playerId: myId,
            worldId: localWorld.worldId
        });
        renderCanvas();
    });

    socket.on("timesUp", (string) => {
        timer.innerText = string;
        playAlarm();
    });

    socket.on("updateIdeaWidth", (dataObj) => {
        ctx.font = "20px Arial";
        w = ctx.measureText(dataObj.ideaTitle).width + 10;

        socket.emit("updateIdeaWidth", dataObj, w);
    });

    socket.on("newPlayerJoined", () => {
        insertPlayersHtmlElement();
        updateListSelector(localWorld);
    });

    socket.on("worldUpdate", (data) => {
        localWorld = data;
        renderCanvas();
    });

    socket.on("updateLists", (data) => {
        updateListSelector(data);
        insertIdeasToListsTab();
    })

    socket.on("updateIdeasInListSelector", (world) => {
        localWorld = world;
        insertIdeasToListsTab();
    });

    socket.on("openList", (listId) => {
        listPopupMenu(listId);
    });

    socket.on("updateTimer", (timerSeconds) => {
        timer.innerText = `${parseInt(timerSeconds / 60)}:${timerSeconds % 60}`;
    })

    socket.on("error", (message) => {
        alert(message);
    });

    socket.on("redirect", (destination) => {
        window.location.href = destination;
        reload();
    })
}

//plays alarm sound 
function playAlarm() {
    let audio = new Audio('./js/timer.wav');
    audio.play();
}

//shows create idea popup and handles its functionality
function createIdea() {
    const spawnBtn = document.getElementById("spawn-card");

    spawnBtn.disabled = true;
    canUseKeyboard = false

    const createIdeaCancelButton = document.getElementById("create-idea-cancel-button");
    const createIdeaButton = document.getElementById("create-idea-button")

    const createIdeaContent = document.getElementById("create-idea");

    createIdeaContent.style.display = "flex";

    createIdeaButton.addEventListener("click", spawnIdeaHandler, { once: true });

    createIdeaCancelButton.addEventListener("click", () => {
        createIdeaContent.style.display = "none";
        canUseKeyboard = true;
        spawnBtn.disabled = false;
        createIdeaButton.removeEventListener("click",spawnIdeaHandler)
    },{ once: true });

}

function spawnIdeaHandler() {
    const spawnBtn = document.getElementById("spawn-card");
    const createIdeaContent = document.getElementById("create-idea");
    const ideaName = document.getElementById("idea-name");
    const ideaDescription = document.getElementById("idea-description");
    let w = ctx.measureText(ideaName.value).width + 10;

        if (ideaName.value === "") {
            alert("You have to specify a title");
            createIdea();
        } else {
            dataObj = {
                ideaName: ideaName.value,
                ideaDescription: ideaDescription.value,
                worldId: localWorld.worldId,
                width: 0,
                playerId: myId,
            }

            socket.emit("spawnElement", dataObj);

            createIdeaContent.style.display = "none";
            canUseKeyboard = true;

            spawnBtn.disabled = false;

        }
}

//shows create list popup and handles its functionality
function createList() {
    const spawnList = document.getElementById("spawn-list");

    spawnList.disabled = true;


    canUseKeyboard = false

    const createListCancelButton = document.getElementById("create-list-cancel-button");
    
    const createListButton = document.getElementById("create-list-button")

    const ListContent = document.getElementById("create-list");

    ListContent.style.display = "flex";

    createListButton.addEventListener("click", createListHandler, { once: true });

    createListCancelButton.addEventListener("click", () => {
        ListContent.style.display = "none";
        canUseKeyboard = true;
        spawnList.disabled = false;
        createListButton.removeEventListener("click", createListHandler)
    });

}

function createListHandler() {
    const listName = document.getElementById("list-name");
    const ListContent = document.getElementById("create-list");
    const spawnList = document.getElementById("spawn-list");

    if (listName.value === "") {
        alert("You have to specify a title");
        //createList();
    } else {
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
}

//Sends clients canvas size to server when resized
function sendCanvasData() {
    window.addEventListener("resize", (e) => {
        console.log("window was resized");
        socket.emit("windowResized", {
            canvasHeight: ctx.canvas.height,
            canvasWidth: ctx.canvas.width,
            playerId: myId,
            worldId: localWorld.worldId
        });
    });
}

//List popup menu
function listPopupMenu(listId) {
    canUseKeyboard = false;

    let list = localWorld.lists[listId];
    const takeIdeaCancelButton = document.getElementById("list-popup-menu-cancel-button");
    const ideaSelector = document.getElementById("idea-selector");
    const ideaName = document.getElementById("idea-name");
    const ideaDescription = document.getElementById("list-idea-description");
    const takeIdeaButton = document.getElementById("take-idea-button");
    const listPopupMenuContent = document.getElementById("list-popup-menu");

    updateIdeaSelector(ideaSelector, listId);

    takeIdeaCancelButton.addEventListener("click", () => {
        listPopupMenuContent.style.display = "none";
        canUseKeyboard = true;
    }, { once: true });


    listPopupMenuContent.style.display = "flex";
    if (ideaDescription.value !== null) {
        ideaDescription.value = localWorld.lists[listId].containedIdeas[ideaSelector.value].description;

    }

    if (ideaSelector.value === "" || ideaSelector.value === null) {
        takeIdeaButton.disabled = true
    }

    takeIdeaButton.addEventListener(
        "click",
        () => {
            if (localWorld.lists[listId].containedIdeas[ideaSelector.value] !== undefined && localWorld.lists[listId].containedIdeas[ideaSelector.value] !== null) {
                canUseKeyboard = true;
                socket.emit(
                    "takeIdeaFromList",
                    localWorld.lists[listId].containedIdeas[ideaSelector.value],
                    localWorld.worldId,
                    myId,
                    listId
                );
                console.log("Took idea");
                listPopupMenuContent.style.display = "none";
            }else {
                listPopupMenuContent.style.display = "none";
                canUseKeyboard = true;
                //alert("this idea has already been taken");
            }

        },
        { once: true }
    );

    ideaSelector.addEventListener("change", () => {

        if (ideaSelector.value !== "" || ideaSelector.value !== null) {
            takeIdeaButton.disabled = false
        }

        if (ideaDescription !== null) {
            ideaDescription.value = localWorld.lists[listId].containedIdeas[ideaSelector.value].description;

        }
    });
}

//disables keyboard when editing idea.
function detectIdeaTabFocus() {
    let ideaTitle = document.getElementById("current-idea-title")
    let ideaDescription = document.getElementById("current-idea-description")

    ideaTitle.addEventListener("focus", (event) => {
        canUseKeyboard = false;
    });

    ideaDescription.addEventListener("focus", (event) => {
        canUseKeyboard = false
    });

    ideaTitle.addEventListener("blur", (event) => {
        canUseKeyboard = true
    });

    ideaDescription.addEventListener("blur", (event) => {
        canUseKeyboard = true
    });
}

//inserts current from world in select form
function updateListSelector(data) {
    let child = listSelector.lastElementChild;
    while (child) {
        listSelector.removeChild(child);
        child = listSelector.lastElementChild;
    }
    for (const key in data.lists) {
        let option = new Option(data.lists[key].title, data.lists[key].id);
        listSelector.appendChild(option);
    }
}

//inserts current selectable ideas from list in select form
function updateIdeaSelector(ideaSelector, listId) {
    let child = ideaSelector.lastElementChild;
    while (child) {
        ideaSelector.removeChild(child);
        child = ideaSelector.lastElementChild;
    }
    for (const key in localWorld.lists[listId].containedIdeas) {
        let option = new Option(
            localWorld.lists[listId].containedIdeas[key].title,
            localWorld.lists[listId].containedIdeas[key].id
        );
        ideaSelector.appendChild(option);
    }
}

//calls deleteList() when button clicked
function deleteListeners() {
    const deleteListButton = document.getElementById("delete-list");

    deleteListButton.addEventListener("click", (e) => {
        deleteList();
    });
}

//deletes the list currenlty selected from list selector on button click
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

//this function saves current idea on button click
function saveIdea() {
    const saveBtn = document.getElementById("save-current-idea")

    saveBtn.addEventListener("click", () => {
        console.log("i clicked with idea: " + currentIdea.id);
        let ideaTitle = document.getElementById("current-idea-title")
        let ideaDescription = document.getElementById("current-idea-description")

        socket.emit("updateIdea", currentIdea.id, ideaTitle.value, ideaDescription.value, localWorld.worldId, myId)

    });
}

//this functions listens for timer buttons
function timerFunctions() {
    const startTimer = document.getElementById("starttimer");
    const pauseTimer = document.getElementById("pausetimer");
    const resetTimer = document.getElementById("resettimer");
    const timeSelector = document.getElementById("timeselector");
    const setTimer = document.getElementById("settimer");

    let selectedTimer = timeSelector.value;

    timeSelector.addEventListener("change", () => {
        selectedTimer = timeSelector.value;
        console.log(selectedTimer);
    });

    startTimer.addEventListener("click", () => {
        if (timer.innerText != "0:0")
            socket.emit("startTimer", localWorld.worldId);
    })

    setTimer.addEventListener("click", () => {
        socket.emit("setTimer", localWorld.worldId, selectedTimer);
    });

    pauseTimer.addEventListener("click", () => {
        socket.emit("pauseTimer", localWorld.worldId);
    });

    resetTimer.addEventListener("click", () => {
        socket.emit("resetTimer", localWorld.worldId, selectedTimer);
    });

}

//this function shows "create"-popups on button click
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

//this function controles the game menu
function navigationListeners() {
    const homeContent = document.getElementById("home-content");
    const listsContent = document.getElementById("lists-content");
    const ideasContent = document.getElementById("ideas-content");
    const timerContent = document.getElementById("timer-content");

    const homeButton = document.getElementById("home-button")
    homeButton.style.textDecoration = "underline";

    const listsButton = document.getElementById("lists-button")
    const ideasButton = document.getElementById("ideas-button")
    const timerButton = document.getElementById("timer-button")
    const backButton = document.getElementById("back-button")

    homeButton.addEventListener("click", (e) => {
        homeContent.style.display = "block";
        homeButton.style.textDecoration = "underline";

        listsContent.style.display = "none";
        listsButton.style.textDecoration = "none";

        ideasContent.style.display = "none";

        timerContent.style.display = "none";
        timerButton.style.textDecoration = "none"
    });

    listsButton.addEventListener("click", (e) => {
        homeContent.style.display = "none";
        homeButton.style.textDecoration = "none";

        listsContent.style.display = "block";
        listsButton.style.textDecoration = "underline";

        ideasContent.style.display = "none";

        timerContent.style.display = "none";
        timerButton.style.textDecoration = "none";
        insertIdeasToListsTab();
    });

    ideasButton.addEventListener("click", (e) => {
        homeContent.style.display = "none";
        listsContent.style.display = "none";
        ideasContent.style.display = "flex";
        timerContent.style.display = "none";
    });

    timerButton.addEventListener("click", (e) => {
        homeContent.style.display = "none";
        homeButton.style.textDecoration = "none";

        listsContent.style.display = "none";
        listsButton.style.textDecoration = "none";

        ideasContent.style.display = "none";

        timerContent.style.display = "block";
        timerButton.style.textDecoration = "underline"
    });

    backButton.addEventListener("click", (e) => {
        window.location.href = "/";
    });

    listSelector.addEventListener("change", () => {
        insertIdeasToListsTab();
    })


}
//----helper functions---
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

//inserts current connected players in player list
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

//tracks and saves mouse posistion
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

