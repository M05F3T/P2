// All global imports are declared as variables here
const OAuth = require("oauth").OAuth;
const { rejects } = require("assert");
const { resolve } = require("path");
const url = require("url");

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
const devKey = "3b7a692d77fa60e44426bb331ab783d6";
const devSecret = "e03d444d5751f140816f637b90beb66a55930e36e3e3e80c14fa11ff6f0944d1";

// Trello redirects the user here after authentication
const loginCallback = `http://localhost:3000/client/host.html`;

// The OAuth pair that contains token and tokensecret like this {"token": "tokenSecret"}
const oauth_secrets = {};

// The new authentication object that contains the setup settings
const oauth = new OAuth(requestURL, accessURL, devKey, devSecret, "1.0A", loginCallback, "HMAC-SHA1");



const login = function (request, response) {
    oauth.getOAuthRequestToken(function (error, token, tokenSecret, results) {
        oauth_secrets[token] = tokenSecret;
        response.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
};

// Callback gets the access token and the access tokensecret
async function trelloLoginCallback(href) {
    //Gets information, from the returned URL
    const query = url.parse(href, true).query;
    const token = query.oauth_token;
    const tokenSecret = oauth_secrets[token];
    const verifier = query.oauth_verifier;

    let oauthPromise = new Promise(function (resolve, reject) {
        oauth.getOAuthAccessToken(token, tokenSecret, verifier, function (error, accessToken, accessTokenSecret, results) {
            if (!error) {
                resolve({
                    'accessToken': accessToken,
                    'accessTokenSecret': accessTokenSecret
                });
            } else {
                console.log("couldn't authenticate tokens. ", error);
                reject();
            }
        });
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
        oauth.getProtectedResource(`https://api.trello.com/1/boards/?name=Brainstorm ${date}`, "POST", accToken, accTokenSecret, function (error, data, response) {
            //Now we can respond with data to show that we have access to your Trello account via OAuth
            if (!error) {
                boardId = JSON.parse(data);
                resolve(boardId.id);
            } else {
                console.log("couldn't authenticate tokens. ", error);
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
                console.log("couldn't authenticate tokens. ", error);
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
                console.log("couldn't authenticate tokens. ", error);
                reject();
            }

        });
    });

    return await oauthPromise;

}

function deleteCard(accToken, accTokenSecret, cardId) {
    oauth.getProtectedResource(`https://api.trello.com/1/cards/${cardId}`, "POST", accToken, accTokenSecret, function (error, data, response) {
    });
}

function archiveList(accToken, accTokenSecret, listId) {
    oauth.getProtectedResource(`https://api.trello.com/1/lists/${listId}/closed?`, "PUT", accToken, accTokenSecret, function (error, data, response) {
    });
}

function deleteBoard(accToken, accTokenSecret, boardId) {
    oauth.getProtectedResource(`https://api.trello.com/1/boards/${boardId}?`, "DELETE", accToken, accTokenSecret, function (error, data, response) {
    });
}

module.exports = { login, trelloLoginCallback, createBoard, createCard, createList, deleteCard, archiveList, deleteBoard };