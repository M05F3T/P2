# Project Title

Pickle - A visual brainstorm application 🤯

## Description

This application is an online brainstorm application that tries to emulate a physical brainstorm known from group work. The brainstorming is performed in the browser through building blocks which are visual elements in form of boxes with text embedded, as an abstraction over ideas. These virtual ideas will be shown as cards in Trello, the ideas can be placed in categorizing areas in the canvas which represent different Trello lists. The names of these lists are the topics / sub-topics for the brainstorm. Every time a cards are placed in a categorized area, the host's Trello is updated so that the lists and cards in Trello correspond to ideas and lists in our application. The purpose of the Trello integration is to make it easy for the user to save the results of their brainstorm while having their data collected on a platform that they already making use of. The host of the brainstorming session login with Trello, and they other participants then work under this host.

## Getting Started

Before installing be sure you have the newest version of git, node.js and npm (node package manager) installed on your hosting machine.

You can download the latest version of node.js [here](https://nodejs.org/en/download/ "Node.js homepage"). 

follow [this](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Downloading and installing Node.js and npm") guide if your unsure on how to install node.js and npm.

To use the application you have to register/login to trello to get the required keys for the Trello API. After logging in to your trello account click [here](https://trello.com/app-key "Trello API page") and add your URL or IP to the intended hosting machine as a "New Allowed Origin" and write down the API keys in the following format:

DEVKEY = "INSERT KEY HERE"

DEVSECRET = "INSERT OAUTH SECRET KEY HERE"

The keys SHOULD be sorrounded by qoutation marks. Save the keys to a .env file. Do not give the file a name, it's supposed to be just ".env". DO NOT share these keys with anyone since these keys grants access to your trello account.

### Installing

To install go to your intended installation folder and use the following git command:
```
git clone git@github.com:M05F3T/P2.git
```
Now go to your newly created folder with:
```
cd P2/
```
And install the required node modules using:
```
npm install
```

Before running the application insert your ".env" file in the root directory of the application (.../P2/INSERT-FILE-HERE)

If you do not have a ".env" file read the "Getting Started" section again.

### Executing program

Before starting the program go to your settings file located at ./P2/js/settings.js and open it in your desired editor.

Change and save the PORT and trelloLoginCallback to match your hosting prefrences. If you want to run this local leave these settings alone. The trelloLoginCallback should be URL or IP of your hosting machine. 
```
const PORT = 3000;
const trelloLoginCallback = "http://www.YOUR-SERVER-URL.com/client/host.html";
```

You are now ready to start the program ⭐

use the following command in the root directory ./P2/ to start the program:
```
node app.js
```

## Help
You can check your logged errors in the database folder to indentify errors located at ./P2/database/errors

If you get an console error while trying to run of Fx. port 80 try to use higher privilige with sudo
```
sudo node app.js
```

## Authors

Contributors names and contact info

[@Daniel E. Sejersen](https://github.com/M05F3T)
[@Andreas Würtz](https://github.com/UrinTrolden)
[@Nicolai Bergulff](https://github.com/M05F3T)
[@Peter Ellefsen](https://github.com/M05F3T)
[@Jonas S. Poulsen](https://github.com/M05F3T)
[@Gustas Jucaitis](https://github.com/M05F3T)

## License

This project is licensed under the MIT License - see the LICENSE.md file for details

## Acknowledgments

Thanks to our counselor [@Emil Nesgaard](https://www.linkedin.com/in/emil-nesgaard/) for great guidance in the development of this project.

Inspiration, code snippets, etc.
* [awesome-readme](https://github.com/matiassingers/awesome-readme)
* [awesome-readme](https://github.com/matiassingers/awesome-readme)
* [awesome-readme](https://github.com/matiassingers/awesome-readme)
* [awesome-readme](https://github.com/matiassingers/awesome-readme)
* [awesome-readme](https://github.com/matiassingers/awesome-readme)
* 

