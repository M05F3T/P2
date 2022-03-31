// All global imports are declared as variables here
const express = require("express");
const http = require("http");
const OAuth = require("oauth").OAuth;
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
const loginCallback = `http://localhost:3000/callback`;

// The OAuth pair that contains token and tokensecret like this {"token": "tokenSecret"}
const oauth_secrets = {};

// The new authentication object that contains the setup settings
const oauth = new OAuth(requestURL, accessURL, devKey, devSecret, "1.0A", loginCallback, "HMAC-SHA1");

// This requires request/response from an app.get, for example:
// app.get("/login", function (request, response) {
//   console.log(`GET '/login'`);
//   login(request, response);
//});

const login = function (request, response) {
    oauth.getOAuthRequestToken(function (error, token, tokenSecret, results) {
        oauth_secrets[token] = tokenSecret;
        response.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
};

let token, tokenSecret, accToken, accTokenSecret;

//Something needed to detect the callback, and call the final function that gives the final tokens
//Example:
// app.get("/callback", function (request, response) {
//   callback(request, response);
//});

// Callback gets the access token and the access tokensecret
const callback = function (req, res) {
    //Gets information, from the returned URL
    const query = url.parse(req.url, true).query;
    const token = query.oauth_token;
    const tokenSecret = oauth_secrets[token];
    const verifier = query.oauth_verifier;
    oauth.getOAuthAccessToken(token, tokenSecret, verifier, function (error, accessToken, accessTokenSecret, results) {
        accToken = accessToken;
        accTokenSecret = accessTokenSecret;

        // Example to show the information about token and tokensecret
        res.send(`<h1>Oh, hello there!</h1><a>This is what you want to know ${accToken} and ${accTokenSecret}</a>`);
    });
};

// Function used for creating a new board in Trello
const createBoard = function () {
    oauth.getProtectedResource(`https://api.trello.com/1/boards/?name=Brainstorm${Date()}`, "POST", accessToken, accessTokenSecret, function (error, data, response) {
        //Now we can respond with data to show that we have access to your Trello account via OAuth
        res.send(data);
    });
};
