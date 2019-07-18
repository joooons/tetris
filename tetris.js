// JS for tetris

// Notes:
// I intend to work with vanilla JS for now. Need to learn basics first.
//


// ---------- Declaration Section -------------------------------- //


// DOM elements
var toyRoom = document.getElementById('toyRoom');

// booleans
var boxExists = false;          // allow only one box to exist
var boxFalling = false;         // toggle to let box fall

// dimension variables
var xDim = toyRoom.offsetWidth;
var yDim = toyRoom.offsetHeight;
var xInc = xDim / 10;           // box size in x direction
var yInc = yDim / 20;           // box size in y direction. basically same as xInc

// other settings
var timeInc = 500;              // used in timeFlow()








// ---------- Functions ------------------------------------------ //


function setBoard() {
// fills toyRoom with empty boxes. These will turn into the PILE one by one.

    for ( var boardCounter = 0 ; boardCounter < 200 ; boardCounter++ ) {

        var p = document.createElement('div');

        p.style.color = 'black';
        p.style.fontSize = '9pt';
        p.style.lineHeight = 1.8;
        p.style.textAlign = 'center';
        p.innerText = boardCounter;
        
        p.style.cursor = 'pointer';

        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = '#FD5';
        p.style.opacity = 1;
        p.style.border = '3px solid rgba(0, 0, 0, 0.05)';
        p.style.borderRadius = '4px';       // unnecessary, but cooler?

        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';          // needed to fill horizontally too
        
        toyRoom.appendChild(p);


        // the ONCLICK function
        toyRoom.lastChild.onclick = function() {

            let x = this.offsetLeft;
            let y = this.offsetTop;

            // this.style.opacity = -1 * (this.style.opacity - 1);      // toggles 0 to 1
            this.style.opacity = -(this.style.opacity - 1.5);   // toggles 0.5 and 1
            
            // this gives index number of the block i clicked.
            var temp = Array.prototype.slice.call(toyRoom.children);
            var indexTemp = temp.indexOf(this);
            console.log (`x, y, index = ${x}, ${y}, ${indexTemp}`);

            var b = -(Math.ceil(xInc/2) - 4);
            var t = setInterval(radiusSqueeze,50);
            function radiusSqueeze() {
                temp[indexTemp].style.borderRadius = Math.ceil(xInc/2) - Math.abs(b++) + 'px';
                if ( b > (Math.ceil(xInc/2)-4) ) clearInterval(t);
            }

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
        case 'KeyF':
            boxFalling = !boxFalling;
            console.log('is the box falling? ' + boxFalling);
            break;
        default:
            break;
    }
}   // end of keyAction()



function makeNewBox() {
    // makes new box ONLY if there is none already
    // this function will become obsolete later

    if (!boxExists) {
        var p = document.createElement('div');
        
        p.style.fontSize = '6pt';
        p.style.color = 'black';
        p.style.fontWeight = 'bold';
        p.style.textAlign = 'center';
        p.style.lineHeight = 2.4;
        p.innerText = 'o__o';
        
        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = '#F85';
        p.style.border = '3px solid rgba(0, 0, 0, 0.05)';
        p.style.borderRadius = '4px';
        p.style.visibility = 'visible';
        
        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        
        p.style.position = 'absolute';
        p.style.left = (xInc * 4) + 'px';
        p.style.top = '0px';
        
        toyRoom.appendChild(p); 
        boxExists = true;
    }
}



function breakNewBox() {
    if (boxExists) {
        toyRoom.removeChild(toyRoom.lastChild);
        boxExists = false;
        boxFalling = false;
    }
}



function checkRow() {

    var count = 0;

    // just the second row from the bottom.
    // i will make this iterate over the whole screen, later.
    // first, counting number of visible blocks on this row
    for (i = 181; i <= 190; i++) {
        count += eval(toyRoom.childNodes[i].style.opacity);
    }

    // if the row is all filled up...
    if (count==10) {
        
        let r = 0;
        let t = setInterval(rowSpin,50);
        
        function rowSpin() {
            for ( let i = 180 ; i <= 189 ; i++ ) {
                toyRoom.children[i].style.transform = "rotate(" + r + "deg)";
            }
            r += 2;

            if ( r > 90 ) {
                clearInterval(t);
                for ( let i = 180 ; i <= 189 ; i++ ) {
                    toyRoom.children[i].style.opacity = 0.5;
                }
                dropMountain();
            }   // if r reaches 90 deg...

        }   // end of rowSpin()

    }   // end of if count is 10

}   // end of checkRow()


function dropMountain() {
    var dummy;
    for ( let i = 180 ; i >= 10 ; i -= 10 ) {
        for ( let j = i ; j <= i+9 ; j++ ) {
            dummy = toyRoom.children[j-10].style.opacity;
            toyRoom.children[j].style.opacity = dummy;
        }
    }
    for ( let k = 0 ; k <= 9 ; k++ ) {
        toyRoom.children[k].style.opacity = 0.5;
    }
}   // end of dropMountain()



function timeTick() {
    
    if (boxFalling && boxExists) {
        boxFall();
        

        //console.log('tick');
        
    }
}

function boxFall() {
    let a = toyRoom.lastChild.style.top;
    let b = a.substring(0,a.length-2);
    let c = eval(b) + 1;
    toyRoom.lastChild.style.top = c + 'px'
}



// ---------- Main Body ----------------------------------------- //


setBoard();

var timeFlow = setInterval(timeTick,timeInc);

document.addEventListener('keydown', keyAction);




