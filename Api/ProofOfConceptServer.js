var express = require("express");

var http = require("http");
var OAuth = require("oauth").OAuth;
var url = require("url");

/*
/     Express Server Setup
*/
var app = express();

app.use(express.static("public"));

var server = app.listen(3000, function () {
  console.log("Server up and running...");
  console.log("Listening on port %s", server.address().port);
});

/*
/     OAuth Setup and Functions
*/
const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "Trello OAuth Example";
const scope = "read,write,account";
const expiration = "1hour";

// Be sure to include your key and secret in 🗝.env ↖ over there.
// You can get your key and secret from Trello at: https://trello.com/app-key
const key = "3b7a692d77fa60e44426bb331ab783d6";
const secret =
  "e03d444d5751f140816f637b90beb66a55930e36e3e3e80c14fa11ff6f0944d1";

// Trello redirects the user here after authentication
const loginCallback = `http://localhost:3000/callback`;

// You should have {"token": "tokenSecret"} pairs in a real application
// Storage should be more permanent (redis would be a good choice)
const oauth_secrets = {};

const oauth = new OAuth(
  requestURL,
  accessURL,
  key,
  secret,
  "1.0A",
  loginCallback,
  "HMAC-SHA1"
);

const login = function (request, response) {
  oauth.getOAuthRequestToken(function (error, token, tokenSecret, results) {
    oauth_secrets[token] = tokenSecret;
    response.redirect(
      `${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`
    );
  });
};

let token, tokenSecret;

var callback = function (req, res) {
  const query = url.parse(req.url, true).query;
  const token = query.oauth_token;
  const tokenSecret = oauth_secrets[token];
  const verifier = query.oauth_verifier;
  oauth.getOAuthAccessToken(
    token,
    tokenSecret,
    verifier,
    function (error, accessToken, accessTokenSecret, results) {
      // In a real app, the accessToken and accessTokenSecret should be stored
      oauth.getProtectedResource(
        "https://api.trello.com/1/lists?name=TestTilPeter&idBoard=6242db36eddba180596279b4",
        "POST",
        accessToken,
        accessTokenSecret,
        function (error, data, response) {
          // Now we can respond with data to show that we have access to your Trello account via OAuth
          res.send(data);
        }
      );
    }
  );
};

/*
/     Routes
*/
app.get("/", function (request, response) {
  console.log(`GET '/'  ${Date()}`);
  response.send(
    "<h1>Oh, hello there!</h1><a href='./login'>Login with OAuth!</a>"
  );
  console.log(oauth_secrets);
});

app.get("/login", function (request, response) {
  console.log(`GET '/login'  ${Date()}`);
  login(request, response);
});

app.get("/callback", function (request, response) {
  console.log(`GET '/callback'  ${Date()}`);
  console.log(request.url);
  console.log(request);
  callback(request, response);
  console.log("TEST1234");
  console.log(oauth_secrets);
});
