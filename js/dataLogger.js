const fs = require('fs');


//writes specified content string to a logfile with the current date if it exists else creates correct file.
function writeLog(content) {
    fs.writeFile(`./database/LOGFILE-${new Date().toISOString().split('T')[0]}`, `${content.toString()}\t${new Date().toLocaleTimeString()}\n`, { flag: 'a+' }, err => {
        console.log(content);
        if (err) {
            console.error(err);
        }
    });
}

//writes specified content string to a error file with the current date if it exists else creates correct file.
function writeError(content) {
    fs.writeFile(`./database/errors`, `${content.toString()}\t${new Date().toLocaleTimeString()}\n`, { flag: 'a+' }, err => {
        console.log("ERROR: " + content);
        if (err) {
            console.error(err);
        }
    });
}


module.exports = { writeLog, writeError };