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
now go to your newly created folder with:
```
cd P2/
```
Now install the required node modules using:
```
npm install
```


### Executing program

* How to run the program
* Step-by-step bullets
```
code blocks for commands
```

## Help

Any advise for common problems or issues.
```
command to run if program contains helper info
```

## Authors

Contributors names and contact info

ex. Dominique Pizzie  
ex. [@DomPizzie](https://twitter.com/dompizzie)

## Version History

* 0.2
    * Various bug fixes and optimizations
    * See [commit change]() or See [release history]()
* 0.1
    * Initial Release

## License

This project is licensed under the MIT License - see the LICENSE.md file for details

## Acknowledgments

Inspiration, code snippets, etc.
* [awesome-readme](https://github.com/matiassingers/awesome-readme)
* [PurpleBooth](https://gist.github.com/PurpleBooth/109311bb0361f32d87a2)
* [dbader](https://github.com/dbader/readme-template)
* [zenorocha](https://gist.github.com/zenorocha/4526327)
* [fvcproductions](https://gist.github.com/fvcproductions/1bfc2d4aecb01a834b46)
