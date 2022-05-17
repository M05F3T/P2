
const PORT = 3000; 
const defaultWorldsActive = true; //default worlds with no active players wont be deleted.   
const deleteTrelloBoardWhenEmpty = true;

// Trello redirects the user here after authentication
const trelloLoginCallback = "http://localhost:3000/client/host.html";

const servThisFile = '/client/login.html'
const allowAccessTo = '/client'
const defaultWorldId = '111111'


module.exports = { PORT, defaultWorldsActive, servThisFile, allowAccessTo, defaultWorldId, deleteTrelloBoardWhenEmpty, trelloLoginCallback };