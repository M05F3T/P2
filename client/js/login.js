
const loginBtn = document.getElementById("login");
const guestBtn = document.getElementById("guest");


loginBtn.addEventListener('click', (e) => { 
    e.preventDefault();
    location.href="./login";
});




guestBtn.addEventListener('click', (e) => { 
    e.preventDefault();
    location.href='./client/guest.html';
});