// JS for tetris

// Notes:
// I intend to work with vanilla JS for now. Need to learn basics first.
//


// ---------- Declaration Section -------------------------------- //


// DOM elements
var toyRoom = document.getElementById('toyRoom');

// booleans
var boxExists = false;          // allow only one box to exist
var boxFalling = true;         // toggle to let box fall

// dimension variables
var xDim = toyRoom.offsetWidth;
var yDim = toyRoom.offsetHeight;
var xInc = xDim / 10;           // box size in x direction
var yInc = yDim / 20;           // box size in y direction. basically same as xInc

// other settings
var timeInc = 100;              // used in 'var timeFlow'
var timeTick = 0;               // timeTick++ in timeAction()
//var stepX = 0;                  // = -xDim to move left, xDim to move right
var stepY = 0;                  // negative to move up, positive to move down


function blockType(a,b,c) { 
    this.x = a;
    this.y = b;
    this.index = c;
}


var clone = new blockType(0,0,0);
var ghost = new blockType(0,0,0);





// ---------- Functions ------------------------------------------ //


function setBoard() {
// fills toyRoom with empty boxes. These will turn into the PILE one by one.

    for ( var boardCounter = 0 ; boardCounter < 200 ; boardCounter++ ) {

        var p = document.createElement('div');

        p.style.color = 'orange';
        p.style.fontFamily = 'helvetica, san-serif';
        p.style.fontSize = '7pt';
        p.style.lineHeight = 3;
        p.style.textAlign = 'center';
        p.innerText = boardCounter;
        
        p.style.cursor = 'pointer';

        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = '#FD5';
        
        // opacity=1 blocks rare at top, more frequent at bottom
        p.style.opacity = (0==(Math.floor(0.03*boardCounter*Math.random())))? 0.5: 1;

        p.style.border = '0.5px solid rgba(255, 255, 255, 1)';      // thin white border
        p.style.borderRadius = '2px';       // unnecessary, but cooler?

        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';          // needed to fill horizontally too
        p.style.position = 'relative';

        toyRoom.appendChild(p);



        // the ONCLICK function
        toyRoom.lastChild.onclick = function() {
            // I need this for now to directly control what the board looks like
            // I will remove this function in a later version

            // x and y needed just to show numbers on console. Remove this in a later version
            let x = this.offsetLeft;
            let y = this.offsetTop;

            // this.style.opacity = -1 * (this.style.opacity - 1);      // toggles 0 to 1
            this.style.opacity = -(this.style.opacity - 1.5);   // toggles 0.5 and 1
            
            // this gives index number of the block i clicked.
            var temp = Array.prototype.slice.call(toyRoom.children);
            var indexTemp = temp.indexOf(this);
            console.log (`(${x}, ${y}) index = ${indexTemp}`);

            checkRow();

        }   // onclick function

    }   // end of for loop, iterated over 200 blocks




}   // end of setBoard()





// this function runs in --> var timeFlow = setInterval(timeAction,timeInc);
function timeAction() {
    
    // general use clicker
    timeTick++;

    // "blink" 3 times out of 40
    let a = timeTick % 40;
    let b = ( (a>0) && (a<3));
    let c = toyRoom.lastChild;
    if (boxExists)(b)? c.innerText = ">__<": c.innerText = "o__o";
    
    // make box fall, continuos
    if (boxFalling && boxExists) boxFall();

    // UP and DOWN motion, continuous
    moveVertical(stepY);



}   // end of timeAction()



function keyDownAction(ev) {
    // all keyboard action inside this function

    //console.log('you pressed ' + ev.code);

    switch (ev.code) {
        case 'KeyC':
            copyBlock();
            break;
        case 'KeyN':
            makeNewBox();
            break;
        case 'KeyD':
            breakNewBox();
            break;
        case 'KeyF':
            boxFalling = !boxFalling;
            break;
        case 'KeyG':        // doesn't do anything right now
            // checkGround();   
            break;

        // directional movement
        case 'ArrowLeft':
            moveHorizontal(-xInc);
            break;
        case 'ArrowRight':
            moveHorizontal(xInc);
            break;
        case 'ArrowUp':
            stepY = -yInc/4;        // stepY used in timeAction()
            break;
        case 'ArrowDown':
            stepY = yInc/4;         // stepY used in timeAction()
            break;
        default:
            break;
    }
}   // end of keyDownAction()



function keyUpAction(ev) {

    //console.log('you released ' + ev.code);
    
    switch (ev.code) {
        case 'ArrowUp':
            stepY = 0;         // stepY used in timeAction()
            break;
        case 'ArrowDown':
            stepY = 0;         // stepY used in timeAction()
            break;
        default:
            break;
    }
}


function makeNewBox() {
    // makes new box ONLY if there is none already
    // this function will become obsolete later

    if (!boxExists) {
        var p = document.createElement('div');
        
        p.style.fontSize = '8pt';
        p.style.color = 'black';
        p.style.fontWeight = 'bold';
        p.style.textAlign = 'center';
        p.style.lineHeight = 2.4;
        p.innerText = 'o__o';

        p.style.boxShadow = '0px 0px 15px 5px white';
        
        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = '#69F';
        p.style.border = '0.5px solid rgba(255, 255, 255, 1)';
        p.style.borderRadius = '8px';
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

    for (let i = 0 ; i <= 190 ; i += 10 ) {
        
        count = 0;

        for (let j = i; j <= i+9 ; j++) {
            count += eval(toyRoom.children[j].style.opacity);
        }
        
        //console.log(i + ' row, count ' + (2*count-10));
        
        // if the row is all filled up...
        if (count==10) {

            
            let r = 0;
            let t = setInterval(rowSpin,10);
            function rowSpin() {
                r += 4;
                for ( let j = i ; j <= i+9 ; j++ ) {
                    //toyRoom.children[i].style.transform = "rotate(" + r + "deg)";
                    toyRoom.children[j].style.transformOrigin = '50% 100%';
                    toyRoom.children[j].style.transform = "rotateX(" + r + "deg)";
                }
                if ( r > 90 ) {
                    clearInterval(t);
                    for ( let j = i ; j <= i+9 ; j++ ) {
                        toyRoom.children[j].style.opacity = 0.5;
                        toyRoom.children[j].style.transform = "rotateX(0deg)";
                    }
                    
                    dropMountain(i);    // i refers to the row that filled up
                }
            }   // end of rowSpin()

        }   // end of if

    }   // end of for

}   // end of checkRow()




function dropMountain(filledRow) {
// from the filled row up, drop the pile of blocks

    var dummy;
    
    for ( let i = filledRow ; i >= 10 ; i -= 10 ) {
        for ( let j = i ; j <= i+9 ; j++ ) {
            dummy = toyRoom.children[j-10].style.opacity;
            toyRoom.children[j].style.opacity = dummy;
        }
    }

    for ( let k = 0 ; k <= 9 ; k++ ) {
        toyRoom.children[k].style.opacity = 0.5;
    }

}   // end of dropMountain()




function boxFall() {
    let a = toyRoom.lastChild.style.top;
    let b = a.substring(0,a.length-2);
    let c = eval(b) + 1;
    
    //if (checkGround()) toyRoom.lastChild.style.top = c + 'px';
    
    toyRoom.lastChild.style.top = c + 'px';
    if (!checkGround()) {
        toyRoom.lastChild.style.top = a;
        //console.log('back off!');
    }


    
    toyRoom.lastChild.innerText = '>__<';

}


function moveHorizontal(step) {
// moves box left or right depending on stepX

    if (boxExists) {
        let a = toyRoom.lastChild.style.left;
        let b = eval(a.substring(0,a.length-2)) + step;
        if ( (b>=0) && (b<xDim) ) toyRoom.lastChild.style.left = b + 'px';
    }
}   // end of moveHorizontal()


function moveVertical(step) {
    if (boxExists) {
        let a = toyRoom.lastChild.style.top;


        let b = eval(a.substring(0,a.length-2)) + step;


        if ( b>=0 ) {
            toyRoom.lastChild.style.top = b + 'px';
            if (!checkGround()) {
                toyRoom.lastChild.style.top = a;
                console.log('back off!');
            }
        } else {
            toyRoom.lastChild.style.top = '0px';
        }

    }
}



function checkGround() {

    if (boxExists) {

        let a = toyRoom.lastChild.style.left;
        let x = (a.substring(0,a.length-2) / xInc);
        //console.log(x);

        let b = toyRoom.lastChild.style.top;
        let y = Math.ceil( (b.substring(0,b.length-2) / yInc) );
        //console.log(x + ' is x, y is ' + y);

        let c = 10 * y + x;
        //console.log(c);

        return (toyRoom.children[c].style.opacity==1) ? false : true;
        
    }

}



function copyBlock() {
    //console.log(clone);
    //console.log(ghost);
    //console.log(gridBlocks);
    //console.log(gridBlocks[13].style.opacity);

}


// ----------------- MAIN BODY ----------------------------------------- //


setBoard();

var gridBlocks = toyRoom.children;

checkRow();         // must do setBoard() first
makeNewBox();       // must do setBoard() first


// runs continuously
var timeFlow = setInterval(timeAction,timeInc);

// event listeners
document.addEventListener('keydown', keyDownAction);
document.addEventListener('keyup', keyUpAction);





