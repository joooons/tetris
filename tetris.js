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
var blockPile = toyRoom.children;
var moveButtons = document.getElementById('controller');


// booleans
var boxFalling = true;


// dimension variables
var xDim = toyRoom.offsetWidth;
var yDim = toyRoom.offsetHeight;
var xInc = xDim / 10;           // box size in x direction
var yInc = yDim / 20;           // box size in y direction. basically same as xInc


// color settings
var blockBackgroundColor = 'rgba(50, 150, 250, 0.3)';
var blockBoxShadow = '0px 0px 5px 0px inset blue';
var tetrisBackgroundColor = 'rgba(100, 130, 250, 0.1)';
var tetrisBoxShadow = '-2px -2px 9px 0px #05A inset';
var setOpacity = { 
    low : 0.2,                  // low setting of opacity
    high : 1,                   // high setting of opacity
    flip : function(num) {return (num == this.low) ? this.high : this.low;} };

// other settings
var timeInc = 10;              // time interval used in 'var timeFlow'
var timeTick = 0;               // setInterval counter in timeAction()
//var stepY = 0;                  // negative to move up, positive to move down
var yMove = {
    setting : { fallV : 5, downV : 1 },         // set these manually to adjust speed
    actual : { fallV : 0, downV : 0 },
    flip : { fallV : function() { yMove.actual.fallV = (yMove.actual.fallV==0) ? yMove.setting.fallV : 0; } },
    press : {
        down : function() { yMove.actual.downV = yMove.setting.downV; },
        up : function() { yMove.actual.downV = 0 } },
    check : {
        fallV : function() { return (yMove.actual.fallV==0) ? false : true; },
        downV : function() { return (yMove.actual.downV==0) ? false : true; } },
    demand : function() {
        if (yMove.check.downV()) { 
            return ( (timeTick%yMove.actual.downV) == 0 ) ? true : false;
        } else {
            return ( (timeTick%yMove.actual.fallV) == 0 ) ? true : false;
        } } 
    };
    
    



// complex object definitions
var tetrisForms = [];
    tetrisForms[0] = [ {x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:4, y:3} ];    // long bar
    tetrisForms[1] = [ {x:5, y:0}, {x:5, y:1}, {x:5, y:2}, {x:4, y:2} ];    // inverse 'L' shape
    tetrisForms[2] = [ {x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:5, y:2} ];    // 'L' shape
    tetrisForms[3] = [ {x:4, y:0}, {x:4, y:1}, {x:5, y:1}, {x:5, y:2} ];    // inverse 'Z' shape
    tetrisForms[4] = [ {x:5, y:0}, {x:5, y:1}, {x:4, y:1}, {x:4, y:2} ];    // 'Z' shape
    tetrisForms[5] = [ {x:3, y:1}, {x:4, y:1}, {x:5, y:1}, {x:4, y:0} ];    // upside down 'T' shape
    tetrisForms[6] = [ {x:4, y:0}, {x:4, y:1}, {x:5, y:0}, {x:5, y:1} ];    // square shape

    // multiplies scalar xInc and yInc to the tetrisForms[]
    for ( let i = 0 ; i < tetrisForms.length ; i++ ) {
        for ( let j = 0 ; j < tetrisForms[i].length ; j++ ) {
            tetrisForms[i][j].x *= xInc;
            tetrisForms[i][j].y *= yInc;
        }
    }
    //console.log('tetrisForms is...');
    //console.log(tetrisForms);



var tetrisChance = [1, 1, 1, 1, 1, 1, 1];
    // ratio of how likely each tetrisForm[] is to appear.

var randomMatrix = {
    // object that contains the array of probability of each shape and...
    // ... the method for reconfiguring the probability when the tetrisChance array is modified.
    matrix : [],
    randomize : function() {
        this.matrix = this.matrix.slice(0,tetrisChance.reduce(function(sum,num){return sum + num;} ));
        let k = 0;
        for ( let i=0 ; i<=tetrisChance.length ; i++ ) for ( let j=0 ; j<tetrisChance[i] ; j++ ) this.matrix[k++] = i;
    } };   // end of randomMatrix def

var currentTetris = { 
    form : 0,           // there are 7 forms total.
    pose : 0,           // number of poses for each form varies. At most four.
    flip : function(num) {
        this.pose = this.pose + num;
        if (this.pose == rotateMatrix[this.form].length) this.pose = 0;
        if (this.pose < 0 ) this.pose = rotateMatrix[this.form].length - 1;
    } };

var rotateMatrix = [];
    // this is the rotation matrix. For the given form and pose, this is the tranformation...
    // ... that must take place to get to the next pose in line.
    // it assumes that the rotation is happening in the counterclockwise direction.
    // after having made this, I'm a little bit embarrassed that I didn't just come up with a formula...
    rotateMatrix[0] = [];
        rotateMatrix[0][0] = [ { x:-1, y:1 }, { x:0, y:0 }, { x:1, y:-1 }, { x:2, y:-2 } ];
        rotateMatrix[0][1] = [ { x:1, y:-1 }, { x:0, y:0 }, { x:-1, y:1 }, { x:-2, y:2 } ];
    rotateMatrix[1] = [];
        rotateMatrix[1][0] = [ { x:-1, y:1 }, { x:0, y:0 }, { x:1, y:-1 }, { x:2, y:0 } ];
        rotateMatrix[1][1] = [ { x:1, y:1 }, { x:0, y:0 }, { x:-1, y:-1 }, { x:0, y:-2 } ];
        rotateMatrix[1][2] = [ { x:1, y:-1 }, { x:0, y:0 }, { x:-1, y:1 }, { x:-2, y:0 } ];
        rotateMatrix[1][3] = [ { x:-1, y:-1 }, { x:0, y:0 }, { x:1, y:1 }, { x:0, y:2 } ];
    rotateMatrix[2] = [];
        rotateMatrix[2][0] = [ { x:-1, y:1 }, { x:0, y:0 }, { x:1, y:-1 }, { x:0, y:-2 } ];
        rotateMatrix[2][1] = [ { x:1, y:1 }, { x:0, y:0 }, { x:-1, y:-1 }, { x:-2, y:0 } ];
        rotateMatrix[2][2] = [ { x:1, y:-1 }, { x:0, y:0 }, { x:-1, y:1 }, { x:0, y:2 } ];
        rotateMatrix[2][3] = [ { x:-1, y:-1 }, { x:0, y:0 }, { x:1, y:1 }, { x:2, y:0 } ];
    rotateMatrix[3] = [];
        rotateMatrix[3][0] = [ { x:0, y:2 }, { x:1, y:1 }, { x:0, y:0 }, { x:1, y:-1 } ];
        rotateMatrix[3][1] = [ { x:0, y:-2 }, { x:-1, y:-1 }, { x:0, y:0 }, { x:-1, y:1 } ];
    rotateMatrix[4] = [];
        rotateMatrix[4][0] = [ { x:-2, y:0 }, { x:-1, y:-1 }, { x:0, y:0 }, { x:1, y:-1 } ];
        rotateMatrix[4][1] = [ { x:2, y:0 }, { x:1, y:1 }, { x:0, y:0 }, { x:-1, y:1 } ];
    rotateMatrix[5] = [];
        rotateMatrix[5][0] = [ { x:1, y:1 }, { x:0, y:0 }, { x:-1, y:-1 }, { x:-1, y:1 } ];
        rotateMatrix[5][1] = [ { x:1, y:-1 }, { x:0, y:0 }, { x:-1, y:1 }, { x:1, y:1 } ];
        rotateMatrix[5][2] = [ { x:-1, y:-1 }, { x:0, y:0 }, { x:1, y:1 }, { x:1, y:-1 } ];
        rotateMatrix[5][3] = [ { x:-1, y:1 }, { x:0, y:0 }, { x:1, y:-1 }, { x:-1, y:-1 } ];
    rotateMatrix[6] = [];
        rotateMatrix[6][0] = [ { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 } ];

    // multiplies scalar xInc and yInc to the rotateMatrix[]
    for ( let i = 0 ; i < rotateMatrix.length ; i++ ) {
        for ( let j = 0 ; j < rotateMatrix[i].length ; j++ ) {
            for ( let k = 0 ; k < rotateMatrix[i][j].length ; k++ ) {
                rotateMatrix[i][j][k].x *= xInc;
                rotateMatrix[i][j][k].y *= yInc;
            }
        }
    }
    //console.log('rotateMatrix is...');
    //console.log(rotateMatrix);



var translateMatrix = {
    left : [ { x:-1, y:0 }, { x:-1, y:0 }, { x:-1, y:0 }, { x:-1, y:0 } ],
    right : [ { x:1, y:0 }, { x:1, y:0 }, { x:1, y:0 }, { x:1, y:0 } ],
    down : [ { x:0, y:1 }, { x:0, y:1 }, { x:0, y:1 }, { x:0, y:1 } ],
    stay : [ { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 } ]
}
    // multiplies scalar xInc to translateMatrix left and right only
    for ( let i = 0 ; i <=3 ; i++ ) {
        translateMatrix.left[i].x *= xInc;
        translateMatrix.right[i].x *= xInc;
    }
    //console.log('translateMatrix is...');
    //console.log(translateMatrix);



var px = {
// px.off removes the 'px'.  px.on puts the 'px' back on, plus it adds one more thing.
    off : function(text) { return eval( text.substring(0, text.length - 2) ) },
    on : function(number) { return eval(number) + 'px'}             // maybe px.on() useless...
}


var wall = {
    // used for collision check
    left : 0,
    right : xDim - xInc,
    floor : yDim - yInc
}








function ghostType(x, y) {
    this.x = x,
    this.y = y,
    
    this.fill = function(left, top, xStep, yStep) {
        this.x = px.off(left) + xStep;
        this.y = px.off(top) + yStep; },
        
    this.floor = function() { return 10 * (Math.floor(this.y/yInc)) + (this.x/xInc); },     // outputs index
    this.ceil = function() { return 10 * (Math.ceil(this.y/yInc)) + (this.x/xInc); } };     // outputs index

var ghost = [new ghostType(0,0), new ghostType(), new ghostType(), new ghostType() ];













// ---------- Functions ------------------------------------------ //


function setBoard() {
// fills toyRoom with empty boxes. These will turn into the PILE one by one.

    let rarity = 0.01;                   // used for randomly placing blocks on board. delete later.

    for ( let i = 0 ; i < 200 ; i++ ) {
        // creating four elements to makeup the tetris piece

        var p = document.createElement('div');

        p.style.cursor = 'pointer';

        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = blockBackgroundColor;
        
        p.style.opacity = (0==(Math.floor(rarity*i*Math.random())))? setOpacity.low: setOpacity.high;

        p.style.border = '0.5px solid rgba(255, 255, 255, 1)';      // thin white border
        p.style.borderRadius = '12px';       // unnecessary, but cooler?
        p.style.boxShadow = blockBoxShadow;

        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';          // needed to fill horizontally too
        p.style.position = 'relative';

        p.style.transformOrigin = '50% 100%';

        toyRoom.appendChild(p);


        toyRoom.lastChild.onclick = function() {
            // I need this for now to directly control what the board looks like
            // I will remove this function in a later version

            this.style.opacity = setOpacity.flip(this.style.opacity);
            checkRow();

        }   // end of onclick function def

    }   // end of for loop, iterated over only the first 200 blocks




    // set up the movement speed of the falling tetris piece



    // mouse click to move tetris possible!!!
    moveButtons.children[0].onclick = function() {
        moveHorizontal(-xInc);
    }

    moveButtons.children[1].onclick = function() {
        //stepY = (stepY <= 0) ? stepY = yInc/8 : 0;
        //moveVertical(stepY);
    }

    moveButtons.children[2].onclick = function() {
        moveHorizontal(xInc);
    }

    moveButtons.children[3].onclick = function() {
        moveRotate('left');
    }

    moveButtons.children[4].onclick = function() {
        resetTetrisShape();
    }

    moveButtons.children[5].onclick = function() {
        integrateBlocks();
    }

}   // end of setBoard()








function timeAction() {
    // this function runs in --> var timeFlow = setInterval(timeAction,timeInc);    

    timeTick++;                     // general use clicker
    //console.log('timeTick:' + timeTick + ' demand:' + yMove.demand() + ' ' + yMove.actualV );

    tetrisBlink();                  // animates the facial expression. pretty useless.

    boxFall();                      // make tetris fall continually

    //moveVertical(stepY);            // controls vertical motion

}   // end of timeAction()






function tetrisBlink() {
// making the tetris piece facial expression blink

    let a = timeTick % 300;
    let b = [ ( (a>0) && (a<40) ),
              ( (a>20) && (a<60) ),
              ( (a>40) && (a<80) ),
              ( (a>60) && (a<100) ) ];

    for ( let i = 0 ; i <= 3 ; i++ ) {
        (b[i])? blockPile[i+200].innerText = "-__-": blockPile[i+200].innerText = "o__o";
    }
    
}







function keyDownAction(ev) {
// all keyboard action inside this function

    //console.log('you pressed ' + ev.code);

    switch (ev.code) {
        case 'KeyA':
            moveRotate('left');
            break;
        case 'KeyS':
            moveRotate('right');
            break;
        case 'KeyN':
            resetTetrisShape();
            break;
        case 'KeyI':
            integrateBlocks();
            break;
        case 'KeyF':
            yMove.flip.fallV();
            console.log('yMove.actual.fallV = ' + yMove.actual.fallV);


            break;
        case 'KeyG':
            //createBlockAgent();
            break;

        // directional movement
        case 'ArrowLeft':
            moveHorizontal(translateMatrix.left);
            break;
        case 'ArrowRight':
            moveHorizontal(translateMatrix.right);
            break;
        case 'ArrowUp':
            

            break;
        case 'ArrowDown':
            //stepY = yInc/4;         // stepY used in timeAction()
            yMove.press.down();
            console.log('yMove.actual.downV = ' + yMove.actual.downV);

            break;
        default:
            break;
    }
}   // end of keyDownAction()







function keyUpAction(ev) {

    //console.log('you released ' + ev.code);
    
    switch (ev.code) {
        case 'ArrowUp':
            //stepY = 0;         // stepY used in timeAction()
            break;
        case 'ArrowDown':
            //stepY = 0;         // stepY used in timeAction()
            yMove.press.up();
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
        //p.style.backgroundColor = 'rgba(100, 130, 250, 0.1)';
        p.style.backgroundColor = tetrisBackgroundColor;
        p.style.border = '0.5px solid rgba(255, 255, 255, 1)';
        p.style.borderRadius = '1px 11px 11px 11px';
        p.style.visibility = 'visible';
        //p.style.boxShadow = '-2px -2px 9px 0px #05A inset';
        p.style.boxShadow = tetrisBoxShadow;
        
        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        
        p.style.position = 'absolute';
        
        p.style.left = (xInc * (i+3) ) + 'px';      // actually, this doesn't matter...
        p.style.top = -yInc + 'px';                 // ... cuz this puts it outside the boundary. invisible.

        toyRoom.appendChild(p); 
    
    }   // end of for loop

}   // end of createBlockAgent()







function resetTetrisShape() {
// sets the shape of the tetris piece

    randomMatrix.randomize();

    currentTetris.form = Math.floor( randomMatrix.matrix.length * Math.random() );
    currentTetris.form = randomMatrix.matrix[currentTetris.form];
    currentTetris.pose = 0;

    for ( let i = 0 ; i <=3 ; i++ ) {
        blockPile[i+200].style.left = tetrisForms[currentTetris.form][i].x + 'px';
        blockPile[i+200].style.top = tetrisForms[currentTetris.form][i].y + 'px';
    }

    console.log('form: ' + currentTetris.form + ' pose: ' + currentTetris.pose);

}






function blockToGhost( arr ) {
    // stores tetris piece data to ghost.
    // PLUS, applies translation or rotation, depending on the 'arr' array.
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]
    // typically used with translateMatrix.left, .right, .down, and .stay.
    // ghost[].x and ghost[].y are numbers, NOT strings

    for ( let i = 0 ; i <= 3 ; i++ ) {
        ghost[i].x = px.off(blockPile[i+200].style.left) + arr[i].x ;
        ghost[i].y = px.off(blockPile[i+200].style.top) + arr[i].y ;
    }
}


function ghostToBlock() {
    // takes the data stored in ghost and insert back into the real tetris piece.
    // blockPile[].style.left and blockPile[].style.top are strings.

    for ( let i = 0 ; i <= 3 ; i++ ) {
        blockPile[i+200].style.left = ghost[i].x + 'px';
        blockPile[i+200].style.top = ghost[i].y + 'px';
    }

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
                    //blockPile[j].style.transformOrigin = '50% 100%';
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



    if ( yMove.demand() ) {
        blockToGhost(translateMatrix.down);
        if (crashFree()) ghostToBlock();
    }


}   // end of boxFall()







function moveHorizontal(arr) {
    // moves box left or right depending on stepX
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]

    blockToGhost(arr);

    if (crashFree()) ghostToBlock();


    
    



}   // end of moveHorizontal()












function moveVertical(arr) {


    blockToGhost(arr);

    if (crashFree()) ghostToBlock();

    /*
    let a = [];

    if (!crashImminent(0,step)) {
        for (let i = 0 ; i <= 3 ; i++ ) {
        // puts into a[] the proposed y coorinates for all four tetris pieces
            //a[i] = blockPile[i+200].style.top;
            //a[i] = eval(a[i].substring(0,a[i].length-2)) + step;

            a[i] = px.off(blockPile[i+200].style.top) + step;

        }

        let min = Math.min(...a);
        let max = Math.max(...a) + yInc;

        for ( let i = 0 ; i <= 3 ; i++ ) {
            if ( (min>=0) && (max<=yDim) ) blockPile[i+200].style.top = a[i] + 'px';
            else if ( max > yDim ) blockPile[i+200].style.top = a[i] + yDim - max + 'px';
            else blockPile[i+200].style.top = a[i] - min + 'px';
        }

    }   // end of if

    */


}   // end of moveVertical()












function moveRotate(direction) {
// rotates tetris cluster clockwise or counterclockwise
    

    /*

    let a = (direction == 'left')? 1 : -1;
    let b = currentTetris.form;
    let c = currentTetris.pose;

    if (direction == 'right' ) {
        c = ( c==0 )? rotateMatrix[b].length - 1 : c - 1;
    }

    for ( let i = 0 ; i <= 3 ; i++ ){
        let z = px.off(blockPile[i+200].style.left) + a * rotateMatrix[b][c][i].x;
        blockPile[i+200].style.left = px.on(z);
        z = px.off(blockPile[i+200].style.top) + a * rotateMatrix[b][c][i].y;
        blockPile[i+200].style.top = px.on(z);
    }

    currentTetris.flip(a);

    console.log('form: ' + currentTetris.form + ' pose: ' + currentTetris.pose);

    */


}   // end of moveRotate()











function integrateBlocks() {
// wait, what is this???

    let stopped = ( ghost[0].floor() == ghost[0].ceil() );
    //console.log(ghost[0].floor());
    //console.log(ghost[0].ceil());
    //console.log('did tetris stop? ' + stopped);
    if (stopped && boxFalling) {
        for (let i = 0 ; i <= 3 ; i++ ) {
            blockPile[ghost[i].ceil()].style.opacity = setOpacity.high;
        }
        resetTetrisShape();
        checkRow();
    }

}







function crashFree() {
    // (1) compares the GHOST[] to wall.left, wall.right, and wall.floor.
    // (2) compares ghost[] to blockPile[] with opacity at setOpacity.high
    // yields TRUE if no collisions.



    for ( let i = 0 ; i <= 3 ; i++ ) {

        // check walls first
        if (ghost[i].x < wall.left) return false;
        if (ghost[i].x > wall.right) return false;
        if (ghost[i].y > wall.floor) return false;

        // check for block collisions
        if ( blockPile[ ghost[i].floor() ].style.opacity == setOpacity.high ) return false;
        if ( blockPile[ ghost[i].ceil()  ].style.opacity == setOpacity.high ) return false;
    }

    return true;


    /*
    let crashed = false;
    for (let i = 0 ; i <= 3 ; i++ ) {
        ghost[i].fill(blockPile[i+200].style.left, blockPile[i+200].style.top, x, y);
        if ( blockPile[ghost[i].floor()].style.opacity == setOpacity.high ) crashed = true;
        if ( blockPile[ghost[i].ceil()].style.opacity == setOpacity.high ) crashed = true;
    }

    //console.log('done!');
    return crashed;
    */

}












// ----------------- MAIN BODY ----------------------------------------- //


// before the game starts...
setBoard();
checkRow();             // after random blocks are generated, check for row completion
createBlockAgent();     // create the four elements for the tetris block
resetTetrisShape();     // put the tetris piece on the board


// runs continuously
var timeFlow = setInterval(timeAction,timeInc);

// event listeners
document.addEventListener('keydown', keyDownAction);
document.addEventListener('keyup', keyUpAction);





