// JS for tetris

// I intend to work with vanilla JS for now. Need to learn basics first.

// ---------- Declaration Section -------------------------------- //


// DOM elements
var toyRoom = document.getElementById('toyRoom');
var boxExists = false;                  // allow only one box to exist

// dimension variables
var xDim = toyRoom.offsetWidth;
var yDim = toyRoom.offsetHeight;
var xInc = xDim / 10;
var yInc = yDim / 20;








// ---------- Functions ------------------------------------------ //

function keyAction(ev) {
    // what exactly is ev? how come I don't have to put this as argument?

    console.log('you pressed this: '+ ev.code);

    // i chose to use .code instead of .key because i'm a noob. more explicit.
    switch (ev.code) {
        case 'KeyN':
            // console.log(toyRoom);
            makeNewBox();
            break;
        case 'KeyD':
            // console.log(toyRoom);
            breakNewBox();
        default:
            break;
    }
}

function makeNewBox() {
    if (!boxExists) {
        console.log('Look! a new box!');
        var p = document.createElement('div');      // it worries me whether p exists outside this case...
        p.style.fontSize = '6pt';
        p.innerHTML = '<br>O__O';
        p.style.color = 'black';
        p.style.backgroundColor = '#BDD';
        p.style.textAlign = 'center';
        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';  // it's cssFloat? It's not just float?
        p.style.position = 'relative';
        p.style.left = (xInc * 4) + 'px';
        p.style.top = '0px';
        p.style.margin = '1px';     // just to give breathing room between blocks
        p.style.borderRadius = '4px';       // unnecessary, but cooler?
        toyRoom.appendChild(p);     // a necessary step
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


document.addEventListener('keydown', keyAction);

