const settings = require('./settings.js');
const dataLogger = require('./dataLogger.js');


// All global imports are declared as variables here
const OAuth = require("oauth").OAuth;
const { rejects } = require("assert");
const { resolve } = require("path");
const url = require("url");
require('dotenv').config()

// OAuth setup and functions - This function redirects the user to an authentication page,
// to get the users token and key

//Setup settings required for OAuth 1.0A
const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "Trello OAuth Example";
const scope = "read,write,account";
const expiration = "1day";

//The developer API key and secret to access initial Trello connection - Keep safe :)
//Temporary, should be changed when done with project development for safety reasons
const devKey = process.env.DEVKEY;
const devSecret = process.env.DEVSECRET;

if (devKey === undefined || devSecret === undefined) {
    dataLogger.writeError("No enviroment keys found - please add .env file to root directory see readme file for more information.");
}

// The OAuth pair that contains token and tokensecret like this {"token": "tokenSecret"}
const oauth_secrets = {};

// The new authentication object that contains the setup settings
const oauth = new OAuth(requestURL, accessURL, devKey, devSecret, "1.0A", settings.trelloLoginCallback, "HMAC-SHA1");



const login = function (request, response) {
    oauth.getOAuthRequestToken(function (error, token, tokenSecret, results) {
        oauth_secrets[token] = tokenSecret;
        response.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
};

// Callback gets the access token and the access tokensecret
async function trelloLoginCallback(href, socket) {
    //Gets information, from the returned URL
    const query = url.parse(href, true).query;
    const token = query.oauth_token;
    const tokenSecret = oauth_secrets[token];
    const verifier = query.oauth_verifier;

    let oauthPromise = new Promise(function (resolve, reject) {
        oauth.getOAuthAccessToken(
            token,
            tokenSecret,
            verifier,
            function (error, accessToken, accessTokenSecret, results) {
                if (!error) {
                    resolve({
                        accessToken: accessToken,
                        accessTokenSecret: accessTokenSecret,
                    });
                } else {
                    dataLogger.writeLog(
                        "couldn't authenticate tokens. ",
                        error
                    );
                    reject();
                }
            }
        );
    });

    return await oauthPromise;
};

// Function used for creating a new board in Trello
async function createBoard(accToken, accTokenSecret) {
    //Get current data
    let boardId;
    let today = new Date();
    let date = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();

    let oauthPromise = new Promise(function (resolve, reject) {
        oauth.getProtectedResource(`https://api.trello.com/1/boards/?defaultLists=false&name=Brainstorm ${date}`, "POST", accToken, accTokenSecret, function (error, data, response) {
            //In this callback we get the information from Trello
            if (!error) {
                boardId = JSON.parse(data);
                resolve(boardId.id);
            } else {
                dataLogger.writeLog("couldn't authenticate tokens. ", error);
                reject();
            }
        });
    });

    return await oauthPromise

};

// Function used for creating a new board in Trello
async function createBoardFromTemplate(accToken, accTokenSecret, templateType) {
    //Get current data
    let boardId;
    let today = new Date();
    let date = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();

    let idBoardSource;
    //Can be upgraded to switch when there is more templates
    if (templateType === "ReverseBrainstorm") {
        idBoardSource = `626fbb5c852bf104bd1b9c8a`;
    }

    let oauthPromise = new Promise(function (resolve, reject) {
        oauth.getProtectedResource(`https://api.trello.com/1/boards/?idBoardSource=${idBoardSource}&name=${templateType} ${date}`, "POST", accToken, accTokenSecret, function (error, data, response) {
            //In this callback we get the information from Trello
            if (!error) {
                boardId = JSON.parse(data);
                resolve(boardId.id);
            } else {
                dataLogger.writeLog("An error occured at template creation: ", error);
                reject();
            }
        });
    });

    return await oauthPromise

};

// Function used for creating a new board in Trello
async function GetListsFromBoard(accToken, accTokenSecret, boardId) {
    dataLogger.writeLog(boardId);
    let oauthPromise = new Promise(function (resolve, reject) {
        oauth.getProtectedResource(`https://api.trello.com/1/boards/${boardId}/lists?`, "GET", accToken, accTokenSecret, function (error, data, response) {
            //In this callback we get the information from Trello
            if (!error) {
                let listArray = JSON.parse(data);
                resolve(listArray);
            } else {
                dataLogger.writeLog("An error occured while getting lists from board: ", error);
                reject();
            }
        });
    });

    return await oauthPromise

};

async function createCard(accToken, accTokenSecret, idList, name, desc) {
    let cardId;

    let oauthPromise = new Promise(function (resolve, reject) {
        oauth.getProtectedResource(`https://api.trello.com/1/cards?idList=${idList}&name=${encodeURIComponent(name)}&desc=${encodeURIComponent(desc)}`, "POST", accToken, accTokenSecret, function (error, data, response) {
            if (!error) {
                cardId = JSON.parse(data);
                resolve(cardId.id);
            } else {
                dataLogger.writeLog("couldn't authenticate tokens. ", error);
                reject();
            }
        });
    });

    return await oauthPromise;


}

async function createList(accToken, accTokenSecret, boardId, name) {
    let listId;


    let oauthPromise = new Promise(function (resolve, reject) {
        oauth.getProtectedResource(`https://api.trello.com/1/lists?name=${encodeURIComponent(name)}&idBoard=${boardId}&pos=bottom`, "POST", accToken, accTokenSecret, function (error, data, response) {
            if (!error) {
                listId = JSON.parse(data);
                resolve(listId.id);
            } else {
                dataLogger.writeLog("couldn't authenticate tokens. ", error);
                reject();
            }

        });
    });

    return await oauthPromise;

}

function deleteCard(accToken, accTokenSecret, cardId) {
    oauth.getProtectedResource(`https://api.trello.com/1/cards/${cardId}`, "DELETE", accToken, accTokenSecret, function (error, data, response) {
        if (!error) {
            dataLogger.writeLog("TRELLO API: card deleted succsesfully");
        } else {
            console.error(error);
        }
    });
}

function archiveList(accToken, accTokenSecret, listId) {
    oauth.getProtectedResource(`https://api.trello.com/1/lists/${listId}/closed?value=true`, "PUT", accToken, accTokenSecret, function (error, data, response) {
        if (!error) {
            dataLogger.writeLog("TRELLO API: list deleted succsesfully");
        } else {
            dataLogger.writeLog(error);
        }
    });
}

function deleteBoard(accToken, accTokenSecret, boardId) {
    oauth.getProtectedResource(`https://api.trello.com/1/boards/${boardId}?`, "DELETE", accToken, accTokenSecret, function (error, data, response) {
        if (!error) {
            dataLogger.writeLog("TRELLO API: world/board deleted succsesfully");
        } else {
            dataLogger.writeLog(error);
        }
    });
}

module.exports = { login, trelloLoginCallback, createBoard, createCard, createList, deleteCard, archiveList, deleteBoard, createBoardFromTemplate, GetListsFromBoard };