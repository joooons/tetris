// JS for tetris

// I intend to work with vanilla JS for now. Need to learn basics first.

// ---------- Declaration Section -------------------------------- //


// DOM elements
var toyRoom = document.getElementById('toyRoom');
var boxExists = false;                  // allow only one box to exist

// dimension variables
var xOffset = toyRoom.offsetLeft;   // needed for absolute elements later
var yOffset = toyRoom.offsetTop;    // needed for absolute elements later

var xDim = toyRoom.offsetWidth;
var yDim = toyRoom.offsetHeight;
var xInc = xDim / 10;           // box size in x direction
var yInc = yDim / 20;           // box size in y direction. basically same as xInc

var boardCounter = 0;       // interator for loop that fills screen with blocks







// ---------- Functions ------------------------------------------ //

function setBoard() {
// fills toyRoom with empty boxes. These will turn into the PILE one by one.

    for ( ; boardCounter < 190 ; boardCounter++ ) {
    // can be run only once, due to for loop condish.
    // i will change condish to 200 later.

        var p = document.createElement('div');

        p.style.fontSize = '6pt';
        p.style.color = 'black';
        p.style.textAlign = 'center';
        p.innerHTML = '';               // kind of unnecessary, but who knows...

        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = '#FD5';
        p.style.border = '3px solid rgba(0, 0, 0, 0.05)';
        p.style.borderRadius = '4px';       // unnecessary, but cooler?
        p.style.visibility = 'visible';     // i plan to toggle to hidden later

        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';          // needed to fill horizontally too
        
        //p.style.position = 'relative';
        //p.style.left = '0px';           // positions are set automatically
        //p.style.top = '0px';
        
        // p.style.margin = '1px';     // just to give breathing room between blocks
        
        toyRoom.appendChild(p);
    }

}



function keyAction(ev) {
    // what exactly is ev? how come I don't have to put this as argument?

    console.log('you pressed this: ' + ev.code);

    // i chose to use .code instead of .key because i'm a noob. more explicit.
    switch (ev.code) {
        case 'KeyN':
            // console.log(toyRoom);
            makeNewBox();
            break;
        case 'KeyD':
            // console.log(toyRoom);
            breakNewBox();
            break;
        case 'KeyG':        // set the board
            setBoard();
        
            break;
        default:
            break;
    }
}

function makeNewBox() {
    if (!boxExists) {
        console.log('Look! a new box!');
        var p = document.createElement('div');
        
        p.style.fontSize = '5pt';
        p.style.color = 'black';
        p.style.textAlign = 'center';
        p.innerHTML = '<br>O__O';
        
        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = '#F85';
        p.style.border = '3px solid rgba(0, 0, 0, 0.05)';
        p.style.borderRadius = '4px';
        p.style.visibility = 'visible';
        
        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';      // does float even make sense if position:absolute?

        p.style.position = 'absolute';      // not relative?
        p.style.left = (xInc * 4) + xOffset + 'px';     // need xOffset cuz position:absolute
        p.style.top = yOffset + 'px';      // need yOffset cuz position:absolute
        
        toyRoom.appendChild(p); 
        boxExists = true;
    }
}

function breakNewBox() {
    if (boxExists) {
        console.log("aw, it's dead");
        var p = document.getElementById('toyRoom');
        p.removeChild(p.lastChild);
        boxExists = false;
    }
}




// ---------- Main Body ----------------------------------------- //


// setBoard();

document.addEventListener('keydown', keyAction);




