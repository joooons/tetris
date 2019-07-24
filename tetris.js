// JS for tetris

// Notes:
// I intend to work with vanilla JS for now. Need to learn basics first.
//
// blockPile[] contains both the blocks in the background and the tetris piece.
// blockPile[0] to [199] are the background blocks.
// blockPile[200] to [203] are the four blocks forming the tetris piece.
// blockPile[] is a shallow copy, I think...


// ---------- Declaration Section -------------------------------- //


// DOM elements
var toyRoom = document.getElementById('toyRoom');
var blockPile = toyRoom.children;       // this is shallow copying, i think

// booleans
var boxExists = false;          // allow only one box to exist
var boxFalling = false;         // toggle to let box fall

// dimension variables
var xDim = toyRoom.offsetWidth;
var yDim = toyRoom.offsetHeight;
var xInc = xDim / 10;           // box size in x direction
var yInc = yDim / 20;           // box size in y direction. basically same as xInc

// other settings
var timeInc = 100;              // used in 'var timeFlow'
var timeTick = 0;               // timeTick++ in timeAction()
var stepY = 0;                  // negative to move up, positive to move down
var setOpacity = { 
    low : 0.6 , 
    high : 1 ,
    flip : function(num) {return (num == this.low) ? this.high : this.low;}
};

// objects and arrays definitions
var tetrisForms = [];
    tetrisForms[0] = [ {x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:4, y:3} ];    // long bar
    tetrisForms[1] = [ {x:5, y:0}, {x:5, y:1}, {x:5, y:2}, {x:4, y:2} ];    // inverse 'L'
    tetrisForms[2] = [ {x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:5, y:2} ];    // 'L' shape
    tetrisForms[3] = [ {x:4, y:0}, {x:4, y:1}, {x:5, y:1}, {x:5, y:2} ];    // 'S' shape
    tetrisForms[4] = [ {x:5, y:0}, {x:5, y:1}, {x:4, y:1}, {x:4, y:2} ];    // 'Z' shape
    tetrisForms[5] = [ {x:5, y:0}, {x:5, y:1}, {x:4, y:1}, {x:5, y:2} ];    // 'T' tilted right
    tetrisForms[6] = [ {x:4, y:0}, {x:4, y:1}, {x:5, y:1}, {x:4, y:2} ];    // 'T' tilted left
    tetrisForms[7] = [ {x:4, y:0}, {x:4, y:1}, {x:5, y:0}, {x:5, y:1} ];    // square shape

var tetrisChance = [1, 1, 1, 1, 1, 1, 1, 1];
// ratio of how likely each tetris pattern will appear.
// does not need to add up to 100.
// please make sure there are exactly 8 items.
// I might want to change the appearance rates later.

var randomMatrix = {
// object that contains the array of probability of each shape and...
// ... the method for reconfiguring the probability when the tetrisChance array is modified.
    matrix : [0],
    randomize : function() {
        for ( let n=0 ; n<tetrisChance.reduce(function(sum,num){return sum + num;} ) ; n++ ) this.matrix[n] = 0;
        let k = 0;
        for ( let i=0 ; i<=tetrisChance.length ; i++ ) for ( let j=0 ; j<tetrisChance[i] ; j++ ) this.matrix[k++] = i;
    }
}   // end of randomMatrix def

function ghostType(x, y) {
    this.x = x,
    this.y = y,
    this.fill = function(left, top, xStep, yStep) {
        this.x = eval(left.substring(0,left.length-2)) + xStep;
        this.y = eval(top.substring(0,top.length-2)) + yStep;
    }
    this.floor = function() { return 10 * (Math.floor(this.y/yInc)) + (this.x/xInc); },
    this.ceil = function() { return 10 * (Math.ceil(this.y/yInc)) + (this.x/xInc); }
}

/*
a[i] = blockPile[i+200].style.top;
a[i] = eval(a[i].substring(0,a[i].length-2)) + step;
*/

var ghost = [new ghostType(0,0), new ghostType(), new ghostType(), new ghostType() ];


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
        
        p.style.opacity = (0==(Math.floor(0.03*boardCounter*Math.random())))? setOpacity.low: setOpacity.high;

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

            this.style.opacity = setOpacity.flip(this.style.opacity);
            checkRow();
        }   // end of onclick function def

    }   // end of for loop, iterated over only the first 200 blocks

}   // end of setBoard()





// this function runs in --> var timeFlow = setInterval(timeAction,timeInc);
function timeAction() {
    
    // general use clicker
    timeTick++;

    tetrisBlink();

    // make box fall, continuous
    if (boxFalling) boxFall();

    // UP and DOWN motion, continuous
    moveVertical(stepY);

}   // end of timeAction()


function tetrisBlink() {
// making the tetris piece facial expression blink

    let a = timeTick % 30;
    let b = [ ( (a>0) && (a<4) ),
              ( (a>2) && (a<6) ),
              ( (a>4) && (a<8) ),
              ( (a>6) && (a<10) ) ];



    for ( let i = 0 ; i <= 3 ; i++ ) {
        (b[i])? blockPile[i+200].innerText = "-__-": blockPile[i+200].innerText = "o__o";
    }
    

}



function keyDownAction(ev) {
// all keyboard action inside this function

    //console.log('you pressed ' + ev.code);

    switch (ev.code) {
        case 'KeyC':
            console.log(crashImminent(0,0));
            break;
        case 'KeyN':
            makeNewBox();
            break;
        case 'KeyD':
            //breakNewBox();
            break;
        case 'KeyF':
            boxFalling = !boxFalling;
            break;
        case 'KeyG':
            //createBlockAgent();
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


function createBlockAgent() {
// creates the four blocks of the tetris piece.
// But the shape is not initiated. The shape should be initiated by a different function.

    for ( let i = 0 ; i <=3 ; i++ ) {
    // creates four new elements inside toyRoom.
    // running createBlockAgent() is a waste of time. This script ignores blockPile[] with...
    // ... index higher than 203.

        var p = document.createElement('div');
        
        p.style.fontSize = '8pt';
        p.style.color = 'black';
        p.style.fontWeight = 'bold';
        p.style.textAlign = 'center';
        p.style.lineHeight = 2.4;
        p.innerText = 'o__o';

        //p.style.boxShadow = '0px 0px 15px 5px white';     // shadows don't work well for multiple blocks.
        
        p.style.boxSizing = 'border-box';
        //p.style.backgroundColor = '#8AF';
        p.style.backgroundColor = 'rgba(100, 130, 250, 0.1)';
        p.style.border = '0.5px solid rgba(255, 255, 255, 1)';
        p.style.borderRadius = '1px 11px 11px 11px';
        p.style.visibility = 'visible';
        p.style.boxShadow = '-2px -2px 9px 0px #05A inset';
        
        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        
        p.style.position = 'absolute';
        
        p.style.left = (xInc * (i+3) ) + 'px';      // actually, this doesn't matter...
        p.style.top = -yInc + 'px';                 // ... cuz this puts it outside the boundary. invisible.

        toyRoom.appendChild(p); 
    
    }   // end of for loop

}   // end of createBlockAgent()


function makeNewBox() {
// sets the shape of the tetris piece

    randomMatrix.randomize();

    let a = Math.floor( randomMatrix.matrix.length * Math.random() );
    a = randomMatrix.matrix[a];

    for ( let i = 0 ; i <=3 ; i++ ) {
        blockPile[i+200].style.left = xInc * tetrisForms[a][i].x + 'px';
        blockPile[i+200].style.top = yInc * tetrisForms[a][i].y + 'px';
    }

}



function breakNewBox() {
    
    /*
    if (boxExists) {
        toyRoom.removeChild(toyRoom.lastChild);
        boxExists = false;
        boxFalling = false;
    }
    */


}



function checkRow() {

    for (let i = 0 ; i <= 190 ; i += 10 ) {
    // 'i' refers to the first index of each row
        
        let count = 0;

        for (let j = i; j <= i+9 ; j++) count += eval(blockPile[j].style.opacity);
        
        if (count==10) {

            let r = 0;
            let t = setInterval(rowSpin,10);
            function rowSpin() {
                r += 4;
                for ( let j = i ; j <= i+9 ; j++ ) {
                    blockPile[j].style.transformOrigin = '50% 100%';
                    blockPile[j].style.transform = "rotateX(" + r + "deg)";
                }
                if ( r > 90 ) {
                    clearInterval(t);
                    for ( let j = i ; j <= i+9 ; j++ ) {
                        blockPile[j].style.opacity = setOpacity.low;
                        blockPile[j].style.transform = "rotateX(0deg)";
                    }
                    
                    dropMountain(i);    // 'i' refers to the row that filled up
                }
            }   // end of rowSpin()

        }   // end of if

    }   // end of for

}   // end of checkRow()




function dropMountain(filledRow) {
// from the filled row up, drop the pile of blocks
    
    for ( let i = filledRow ; i >= 10 ; i -= 10 ) {
        for ( let j = i ; j <= i+9 ; j++ ) {
            let a = blockPile[j-10].style.opacity;
            blockPile[j].style.opacity = a;
        }
    }

    for ( let k = 0 ; k <= 9 ; k++ ) blockPile[k].style.opacity = setOpacity.low;

}   // end of dropMountain()




function boxFall() {
// makes the tetris piece (agent) drop slowly...

    let a = [];


    if (!crashImminent(0,1)) {
        for ( let i = 0 ; i <= 3 ; i++ ) {
            a[i] = blockPile[i+200].style.top;
            a[i] = eval(a[i].substring(0,a[i].length-2));    
        }

        let max = Math.max(...a);

        if (max <= (yDim - yInc)) {
            for ( let i = 200 ; i <= 203 ; i++ ) {
                let b = blockPile[i].style.top;
                b = b.substring(0, b.length-2);
                b = eval(b) + 1;
                blockPile[i].style.top = b + 'px';
                blockPile[i].innerText = '>__<';
            }
        }   
    }   // end of if


}


function moveHorizontal(step) {
// moves box left or right depending on stepX

    let a = [];

    if (!crashImminent(step,0)) {

        for ( let i = 0 ; i <= 3 ; i++ ) {
            a[i] = blockPile[i+200].style.left;
            a[i] = eval(a[i].substring(0,a[i].length-2)) + step;    
        }

        let min = Math.min(...a);
        let max = Math.max(...a);

        for ( let i=0 ; i<=3 ; i++ ) if ( (min>=0)&&(max<xDim) ) blockPile[i+200].style.left = a[i] + 'px';
    }   // end of if

}   // end of moveHorizontal()


function moveVertical(step) {

    let a = [];

    if (!crashImminent(0,step)) {
        for (let i = 0 ; i <= 3 ; i++ ) {
        // puts into a[] the proposed y coorinates for all four tetris pieces
            a[i] = blockPile[i+200].style.top;
            a[i] = eval(a[i].substring(0,a[i].length-2)) + step;
        }

        let min = Math.min(...a);
        let max = Math.max(...a) + yInc;

        for ( let i = 0 ; i <= 3 ; i++ ) {
            if ( (min>=0) && (max<=yDim) ) blockPile[i+200].style.top = a[i] + 'px';
            else if ( max > yDim ) blockPile[i+200].style.top = a[i] + yDim - max + 'px';
            else blockPile[i+200].style.top = a[i] - min + 'px';
        }
    }   // end of if

}



function checkGround() {
    // not in use???

    if (boxExists) {


    }

}



function crashImminent(x, y) {

    let crashed = false;
    for (let i = 0 ; i <= 3 ; i++ ) {
        ghost[i].fill(blockPile[i+200].style.left, blockPile[i+200].style.top, x, y);
        if ( blockPile[ghost[i].floor()].style.opacity == setOpacity.high ) crashed = true;
        if ( blockPile[ghost[i].ceil()].style.opacity == setOpacity.high ) crashed = true;
    }

    console.log('done!');
    return crashed;

}


// ----------------- MAIN BODY ----------------------------------------- //


setBoard();

checkRow();         // must do setBoard() first

createBlockAgent();     // must do setBoard() first

makeNewBox();


// runs continuously
var timeFlow = setInterval(timeAction,timeInc);

// event listeners
document.addEventListener('keydown', keyDownAction);
document.addEventListener('keyup', keyUpAction);





