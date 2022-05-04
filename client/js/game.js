
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

// function play() {
//     var audio = new Audio('./js/beat.mp3');
//     audio.play();
//   }

let myId;
let localWorld;
let hover = false;
let targetEntityId;
let canUseKeyboard = true;
let timerValue = 0;

getServerData();
sendClientData();
navigationListeners();
popUpListeners();
deleteListeners();
timerFunctions();

let mouseX;
let mouseY;

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

    //}

}

function getServerData() {

    socket.on("sendId", (data) => {
        myId = data;
    });

    socket.on("worldId", (worldId) => {
        idText.innerHTML = worldId;
    });




    socket.on("newPlayerJoined", () => {
        insertPlayersHtmlElement();
        updateListSelector(localWorld);
    });

    socket.on("worldUpdate", (data) => {

        
        //update local world storage
        localWorld = data;
        timer.innerText = data.timerObj.seconds;
        //render new update
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
        timer.innerText = timerSeconds;
    })

    socket.on("error", (message) => {
        alert(message);
    });
}

function insertWorldsInSelect(data) {
    for (const world in data) {
        let option = document.createElement('option');
        option.value = data[world];
        option.innerHTML = "World: " + data[world];

        worldSelect.appendChild(option);
    }

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

        if (ideaName.value === "") {
            alert("You have to specify a title");
            createIdea();
        } else {
            dataObj = {
                ideaName: ideaName.value,
                ideaDescription: ideaDescription.value,
                worldId: localWorld.worldId,
                width: w,
                playerId: myId,
            }

            socket.emit("spawnElement", dataObj);

            createIdeaContent.style.display = "none";
            canUseKeyboard = true;

            spawnBtn.disabled = false;

        }
    }, { once: true });
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
    }, { once: true });
}

//List popup menu
function listPopupMenu(listId) {
    canUseKeyboard = false;

    let list = localWorld.lists[listId];
    const takeIdeaCancelButton = document.getElementById("list-popup-menu-cancel-button");
    const ideaSelector = document.getElementById("idea-selector");
    const ideaName = document.getElementById("idea-name");
    const ideaDescription = document.getElementById("idea-description");
    const takeIdeaButton = document.getElementById("take-idea-button");
    const listPopupMenuContent = document.getElementById("list-popup-menu");

    updateIdeaSelector(ideaSelector, listId);

    listPopupMenuContent.style.display = "flex";

    takeIdeaCancelButton.addEventListener("click", () => {
        listPopupMenuContent.style.display = "none";
        canUseKeyboard = true;
    }, { once: true });

    takeIdeaButton.addEventListener(
        "click",
        () => {
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
        },
        { once: true }
    );
}


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

