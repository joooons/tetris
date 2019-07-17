// JS for tetris

// Notes:
// I intend to work with vanilla JS for now. Need to learn basics first.
//


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

    //console.log(toyRoom.childNodes);

    for ( ; boardCounter < 200 ; boardCounter++ ) {
    // can be run only once, due to for loop condish.

        var p = document.createElement('div');

        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = '#FD5';
        p.style.opacity = 0.5;
        p.style.border = '3px solid rgba(0, 0, 0, 0.05)';
        p.style.borderRadius = '4px';       // unnecessary, but cooler?

        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';          // needed to fill horizontally too
        
        toyRoom.appendChild(p);
                
        toyRoom.lastChild.onclick = function() {

            let x = this.offsetLeft;
            let y = this.offsetTop;

            // this.style.opacity = -1 * (this.style.opacity - 1);
            this.style.opacity = -(this.style.opacity - 1.5);   // toggles 0.5 and 1
            
            // this gives index number of the block i clicked.
            var temp = Array.prototype.slice.call(toyRoom.children);

            console.log (`x, y, index = ${x}, ${y}, ${temp.indexOf(this)}`);


        }   // onclick function

    }   // end of for loop, iterated over 200 blocks

}   // end of setBoard()



function keyAction(ev) {
    // all keyboard action inside this function

    console.log('you pressed ' + ev.code);

    switch (ev.code) {
        case 'KeyC':
            checkRow();
            break;
        case 'KeyN':
            makeNewBox();
            break;
        case 'KeyD':
            breakNewBox();
            break;
        
        /*
        case 'KeyG':
            setBoard();
            break;
        */

        default:
            break;
    }
}

function makeNewBox() {
    // makes new box ONLY if there is none already
    // this function will become obsolete later

    if (!boxExists) {
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
        //var p = document.getElementById('toyRoom');
        toyRoom.removeChild(toyRoom.lastChild);
        boxExists = false;
    }
}

function checkRow() {
    var count = 0;
    for (i = 181; i <= 190; i++) {
        count += eval(toyRoom.childNodes[i].style.opacity);
    }
    console.log(count);         // ASSUMING that opacity is either 1 or 0
    console.log(count==10);
}




// ---------- Main Body ----------------------------------------- //


setBoard();
document.addEventListener('keydown', keyAction);




