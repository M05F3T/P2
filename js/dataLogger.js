const fs = require('fs');



function writeLog(content) {
    fs.writeFile(`./database/${new Date().toISOString().split('T')[0]}`, `${content.toString()}\t${new Date().toLocaleTimeString()}\n`, { flag: 'a+' }, err => {
        if(err) {
            console.error(err);
        } 
    });
}

function writeError(content) {
    fs.writeFile(`./database/errors`, `${content.toString()}\t${new Date().toLocaleTimeString()}\n`, { flag: 'a+' }, err => {
        if(err) {
            console.error(err);
        } 
    });
}


module.exports = {writeLog,writeError};