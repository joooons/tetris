// JS for tetris

// I intend to work with vanilla JS for now. Need to learn basics first.

// ---------- Declaration Section -------------------------------- //



// DOM elements
var toyRoom = document.getElementById('toyRoom');




// ---------- Functions ------------------------------------------ //

function keyAction(ev) {
    // what exactly is ev? how come I don't have to put this as argument?

    console.log('you pressed this: '+ ev.code);

    // i chose to use .code instead of .key because i'm a noob. more explicit.
    switch (ev.code) {
        case 'KeyF':
            console.log(toyRoom);
            
            var p = document.createElement('div');
            p.innerHTML = 'T^T';
            p.style = "background-color: #DCC; width: 30px; height: 30px; float: left; margin: 1px; border-radius: 4px; ";
            p.class = 'box';        // this is wrong syntax
            p.className = 'box';    // correct syntax
            toyRoom.appendChild(p);     // a necessary step



            break;
        default:
            break;
    }




}





// ---------- Main Body ----------------------------------------- //


document.addEventListener('keydown', keyAction);

