// All global imports are declared as variables here
const express = require("express");
const http = require("http");
const OAuth = require("oauth").OAuth;
const url = require("url");

// OAuth setup and functions - This function redirects the user to an authentication page,
// to get the users token and key
function getToken() {
  //Setup settings required for OAuth 1.0A
  const requestURL = "https://trello.com/1/OAuthGetRequestToken";
  const accessURL = "https://trello.com/1/OAuthGetAccessToken";
  const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
  const appName = "Trello OAuth Example";
  const scope = "read,write,account";
  const expiration = "1day";

  //The developer API key and secret to access initial Trello connection - Keep safe :)
  const devKey = "3b7a692d77fa60e44426bb331ab783d6";
  const devSecret =
    "e03d444d5751f140816f637b90beb66a55930e36e3e3e80c14fa11ff6f0944d1";

  // Trello redirects the user here after authentication
  const loginCallback = `http://localhost:3000/callback`;

  // The OAuth pair that contains token and tokensecret like this {"token": "tokenSecret"}
  const oauth_secrets = {};

  // The new authentication object that contains the setup settings
  const oauth = new OAuth(
    requestURL,
    accessURL,
    devKey,
    devSecret,
    "1.0A",
    loginCallback,
    "HMAC-SHA1"
  );
}
