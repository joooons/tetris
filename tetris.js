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
        // I might want to call each child element by ID actually... later.


// SCREEN and BROWSER parameters
    var screen = {  x : window.screen.width,
                    y : window.screen.height,
                    r : window.devicePixelRatio,
                    t : 0.66 }       // trim - percentage to vertically shrink toyRoom by
    
    console.log(`Screen res: ${screen.x} x ${screen.y}  ratio: ${screen.r}`);
    console.log(navigator.userAgent);


// dimension variables
    var numOfBlock = {  x : 10,
                        y : 30,
                        m : 0,
                        t : 0,
                        midpoint : function() {this.m = Math.floor( this.x / 2 ) - 1},
                        total : function() {this.t = this.x * this.y} }
        numOfBlock.midpoint();
        numOfBlock.total();

    
    var yDim = (screen.y * screen.t) - (screen.y * screen.t ) % numOfBlock.y;
    var xDim = yDim * (numOfBlock.x / numOfBlock.y);
        toyRoom.style.height = yDim + 'px';
        toyRoom.style.width = xDim + 'px';
    var xInc = xDim / numOfBlock.x;           // box size in x direction
    var yInc = yDim / numOfBlock.y;           // box size in y direction. basically same as xInc


// color settings
    var blockBackgroundColor = 'rgba(50, 150, 250, 0.3)';
    var blockBoxShadow = '0px 0px 5px 0px inset blue';
    var tetrisBackgroundColor = 'rgba(100, 130, 250, 0.1)';
    var tetrisBoxShadow = '-2px -2px 9px 0px #05A inset';
    var setOpacity = {  low : 0.2,                  // low setting of opacity
                        high : 1,                   // high setting of opacity
                        flip : function(num) {return (num == this.low) ? this.high : this.low;} };

// TIME settings
    var timeInc = 5;              // time interval used in 'var timeFlow'
    var timeTick = 0;               // setInterval counter in timeAction()
    var count = {   set : { stagnant : 800 },
                    stagnant : 0,
                    reset : function() { this.stagnant = 0; },
                    fill : function() { this.stagnant = this.set.stagnant; } };



// MOVEMENT settings
    var yMove = {
        setting : { fallV : 10, downV : 1 },         // set these manually to adjust speed
        actual : { fallV : 0, downV : 0 },
        flip : { fallV : function() { yMove.actual.fallV = (yMove.actual.fallV==0) ? yMove.setting.fallV : 0; } },
        press : {
            down : function() { yMove.actual.downV = yMove.setting.downV; },
            up : function() { yMove.actual.downV = 0 } },
        check : {
            fallV : function() { return (yMove.actual.fallV==0) ? false : true; },
            downV : function() { return (yMove.actual.downV==0) ? false : true; } },
        demand : function() {
            // if true, there is demand to move 1 pixel down on this time iteration.
            if (yMove.check.downV()) { 
                return ( (timeTick%yMove.actual.downV) == 0 ) ? true : false;
            } else {
                return ( (timeTick%yMove.actual.fallV) == 0 ) ? true : false;
            } } };
        yMove.flip.fallV();
    
    



// complex object definitions
    var tetrisForms = [];
        tetrisForms[0] = [ {x:0, y:0}, {x:0, y:1}, {x:0, y:2}, {x:0, y:3} ];    // long bar
        tetrisForms[1] = [ {x:1, y:0}, {x:1, y:1}, {x:1, y:2}, {x:0, y:2} ];    // inverse 'L' shape
        tetrisForms[2] = [ {x:0, y:0}, {x:0, y:1}, {x:0, y:2}, {x:1, y:2} ];    // 'L' shape
        tetrisForms[3] = [ {x:0, y:0}, {x:0, y:1}, {x:1, y:1}, {x:1, y:2} ];    // inverse 'Z' shape
        tetrisForms[4] = [ {x:1, y:0}, {x:1, y:1}, {x:0, y:1}, {x:0, y:2} ];    // 'Z' shape
        tetrisForms[5] = [ {x:-1, y:1}, {x:0, y:1}, {x:1, y:1}, {x:0, y:0} ];    // upside down 'T' shape
        tetrisForms[6] = [ {x:0, y:0}, {x:0, y:1}, {x:1, y:0}, {x:1, y:1} ];    // square shape

        // multiplies scalar xInc and yInc to the tetrisForms[]
        for ( let i = 0 ; i < tetrisForms.length ; i++ ) {
            for ( let j = 0 ; j < tetrisForms[i].length ; j++ ) {
                tetrisForms[i][j].x += numOfBlock.m;
                tetrisForms[i][j].x *= xInc;
                tetrisForms[i][j].y *= yInc; } }

    var tetrisChance = [1, 1, 1, 1, 1, 1, 1];
        // ratio of how likely each tetrisForm[] is to appear.

    var randomMatrix = {
        // object that contains the array of probability of each shape and...
        // ... the method for reconfiguring the probability when the tetrisChance array is modified.
        matrix : [],
        randomize : function() {
            this.matrix = this.matrix.slice(0,tetrisChance.reduce(function(sum,num){return sum + num;} ));
            let k = 0;
            for ( let i=0 ; i<=tetrisChance.length ; i++ ) for ( let j=0 ; j<tetrisChance[i] ; j++ ) this.matrix[k++] = i; } };

    var currentTetris = { 
        form : 0,           // there are 7 forms total.
        pose : 0,           // number of poses for each form varies. At most four.
        flip : function(num) {
            this.pose = this.pose + num;
            if (this.pose == rotateMatrix[this.form].length) this.pose = 0;
            if (this.pose < 0 ) this.pose = rotateMatrix[this.form].length - 1; } };

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
                    rotateMatrix[i][j][k].y *= yInc; } } }

    var translateMatrix = {
        // this object is used as the input array for blockToGhost()
        // use .stay to simulate an unmoved tetris piece.
        left : [ { x:-1, y:0 }, { x:-1, y:0 }, { x:-1, y:0 }, { x:-1, y:0 } ],
        right : [ { x:1, y:0 }, { x:1, y:0 }, { x:1, y:0 }, { x:1, y:0 } ],
        down : [ { x:0, y:1 }, { x:0, y:1 }, { x:0, y:1 }, { x:0, y:1 } ],
        stay : [ { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 } ] }
        
        // multiplies scalar xInc to translateMatrix left and right only
        for ( let i = 0 ; i <=3 ; i++ ) {
            translateMatrix.left[i].x *= xInc;
            translateMatrix.right[i].x *= xInc; }



    var px = {  off : function(text) { return eval( text.substring(0, text.length - 2) ) },
                on : function(number) { return eval(number) + 'px'} }             // maybe px.on() useless...
        // px.off removes the 'px'.  px.on puts the 'px' back on, plus it adds one more thing.


    var wall = {    left : 0,
                    right : xDim - xInc,
                    floor : yDim - yInc }
        // used for collision check



    function ghostType(x, y) {
        this.x = x,
        this.y = y,
        this.fill = function(left, top, xStep, yStep) {
            this.x = px.off(left) + xStep;
            this.y = px.off(top) + yStep; },
        this.floor = function() { return numOfBlock.x * (Math.floor(this.y/yInc)) + (this.x/xInc); },     // outputs index
        this.ceil  = function() { return numOfBlock.x * (Math.ceil(this.y/yInc)) + (this.x/xInc); } };     // outputs index

    var ghost = [new ghostType(0,0), new ghostType(), new ghostType(), new ghostType() ];













// ---------- Functions ------------------------------------------ //


function setBoard() {
// fills toyRoom with empty boxes. These will turn into the PILE one by one.

    //let rarity = 0.01;                   // used for randomly placing blocks on board. delete later.

    for ( let i = 0 ; i < numOfBlock.t ; i++ ) {
        // filling toyRoom with lots of block elements. starting at low opacity.

        var p = document.createElement('div');

        p.style.cursor = 'pointer';

        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = blockBackgroundColor;
        
        //p.style.opacity = ( 0 == ( Math.floor( rarity * i * Math.random() ) ) ) ? setOpacity.low : setOpacity.high;
        p.style.opacity = setOpacity.low;

        p.style.border = '0.5px solid rgba(255, 255, 255, 1)'; 
        p.style.borderRadius = '12px'; 
        p.style.boxShadow = blockBoxShadow;

        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';
        p.style.position = 'relative';

        p.style.transformOrigin = '50% 100%';

        toyRoom.appendChild(p);


        toyRoom.lastChild.onclick = function() {
            // I need this for now to directly control what the board looks like
            // I will remove this function in a later version

            this.style.opacity = setOpacity.flip(this.style.opacity);
            checkRow();
        }   // end of onclick

    }   // end of for loop




    // set up the movement speed of the falling tetris piece



    // mouse click to move tetris possible!!!
    moveButtons.children[0].onclick = function() { moveHorizontal(translateMatrix.left); }

    moveButtons.children[1].onclick = function() { ( yMove.check.downV() == true ) ? yMove.press.up() : yMove.press.down(); }

    moveButtons.children[2].onclick = function() { moveHorizontal(translateMatrix.right); }

    moveButtons.children[3].onclick = function() { moveRotate('left'); }

    moveButtons.children[4].onclick = function() { resetTetrisShape(); }

    moveButtons.children[5].onclick = function() { integrateBlocks(); }
        // might have to remove this later. Think about it...

}   // end of setBoard()








function timeAction() {
    // this function runs in --> var timeFlow = setInterval(timeAction,timeInc);    

    timeTick++;                     // general use clicker
    tetrisBlink();                  // animates the facial expression. pretty useless.
    boxFall();                      // make tetris fall continually
    integrateBlocks();              // integrate tetris into blockPile after some time.

}   // end of timeAction()






function tetrisBlink() {
// making the tetris piece facial expression blink

    if (yMove.check.fallV() == 0) {
        let a = timeTick % 300;
        let b = [ ( (a>0) && (a<40) ),
                ( (a>20) && (a<60) ),
                ( (a>40) && (a<80) ),
                ( (a>60) && (a<100) ) ];
        for ( let i = 0 ; i <= 3 ; i++ ) {
            (b[i])? blockPile[i+numOfBlock.t].innerText = "-__-": blockPile[i+numOfBlock.t].innerText = "o__o";
        }
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
        case 'Space':
            count.fill();               // accelerates integrateBlock()
            break;
        case 'KeyF':
            yMove.flip.fallV();         // toggles whether tetris slowly falls or not
            break;
        case 'KeyR':
            rotateTest();
            break;

        // directional movement
        case 'ArrowLeft':
            moveHorizontal(translateMatrix.left);
            break;
        case 'ArrowRight':
            moveHorizontal(translateMatrix.right);
            break;
        case 'ArrowUp':
            count.reset();              // resets the counter for integrateBlock()
            break;
        case 'ArrowDown':
            yMove.press.down();         // accelerates falling speed
            break;
        default:
            break;
    }
}   // end of keyDownAction()







function keyUpAction(ev) {

    //console.log('you released ' + ev.code);
    
    switch (ev.code) {
        case 'ArrowUp':
            break;
        case 'ArrowDown':
            yMove.press.up();
            break;
        default:
            break;
    }
}









function createBlockAgent() {
// creates the four blocks of the tetris piece.
// But the shape is not initiated. The shape should be initiated by a different function.
// createBlockAgent() should be run only once.

    for ( let i = 0 ; i <=3 ; i++ ) {

        var p = document.createElement('div');
        
        //p.style.fontSize = '8px';
        p.style.fontSize = (0.4 * xInc) + 'px';
        p.style.color = 'black';
        p.style.fontWeight = 'bold';
        p.style.textAlign = 'center';
        p.style.lineHeight = 2.4;
        p.innerText = 'o__o';
        
        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = tetrisBackgroundColor;
        p.style.border = '0.5px solid rgba(255, 255, 255, 1)';
        p.style.borderRadius = '1px 11px 11px 11px';
        p.style.visibility = 'visible';
        
        p.style.boxShadow = tetrisBoxShadow;
        
        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        
        p.style.position = 'absolute';
        
        p.style.left = '0px';      // actually, this doesn't matter...
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
        blockPile[i+numOfBlock.t].style.left = tetrisForms[currentTetris.form][i].x + 'px';
        blockPile[i+numOfBlock.t].style.top = tetrisForms[currentTetris.form][i].y + 'px';
    }

    console.log(`form:${currentTetris.form} pose:${currentTetris.pose} (NEW)`);

}






function blockToGhost( arr ) {
    // stores tetris piece data to ghost.
    // PLUS, applies translation or rotation, depending on the 'arr' array.
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]
    // typically used with translateMatrix.left, .right, .down, and .stay.
    // ghost[].x and ghost[].y are numbers, NOT strings

    for ( let i = 0 ; i <= 3 ; i++ ) {
        ghost[i].x = px.off(blockPile[i+numOfBlock.t].style.left) + arr[i].x ;
        ghost[i].y = px.off(blockPile[i+numOfBlock.t].style.top) + arr[i].y ;
    }
}


function ghostToBlock() {
    // takes the data stored in ghost and insert back into the real tetris piece.
    // blockPile[].style.left and blockPile[].style.top are strings.

    for ( let i = 0 ; i <= 3 ; i++ ) {
        blockPile[i+numOfBlock.t].style.left = ghost[i].x + 'px';
        blockPile[i+numOfBlock.t].style.top = ghost[i].y + 'px';
    }

}










function checkRow() {

    for (let i = 0 ; i < numOfBlock.t ; i += numOfBlock.x ) {
    // 'i' refers to the first index of each row
        
        let count = 0;

        for (let j = i; j < i+numOfBlock.x ; j++) count += eval(blockPile[j].style.opacity);
        
        if (count == numOfBlock.x) {

            let r = 0;
            let t = setInterval(rowSpin,10);
            function rowSpin() {
                r += 4;
                for ( let j = i ; j < i + numOfBlock.x ; j++ ) {
                    blockPile[j].style.transform = "rotateX(" + r + "deg)";
                }
                if ( r > 90 ) {
                    clearInterval(t);
                    for ( let j = i ; j < i+numOfBlock.x ; j++ ) {
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
    
    for ( let i = filledRow ; i >= numOfBlock.x ; i -= numOfBlock.x ) {
        for ( let j = i ; j < i+numOfBlock.x ; j++ ) {
            let a = blockPile[j-numOfBlock.x].style.opacity;
            blockPile[j].style.opacity = a;
        }
    }

    for ( let k = 0 ; k < numOfBlock.x ; k++ ) blockPile[k].style.opacity = setOpacity.low;

}   // end of dropMountain()








function boxFall() {
// makes the tetris piece (agent) drop slowly...

    if ( yMove.demand() ) {
        blockToGhost(translateMatrix.down);
        if (crashFree()) {
            ghostToBlock();
            for ( let i = 0 ; i <= 3 ; i++ ) {
                blockPile[i+numOfBlock.t].innerText = '>__<';
            }

        }
    }

}   // end of boxFall()







function moveHorizontal(arr) {
    // moves box left or right depending on stepX
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]

    blockToGhost(arr);
    if (crashFree()) ghostToBlock();


}   // end of moveHorizontal()







function moveRotate(text) {
    // rotates tetris piece clockwise or counterclockwise
    // arr contains rotateMatrix[pose][form]
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]

    if (text == 'left') {
        blockToGhost(rotateMatrix[currentTetris.form][currentTetris.pose]);
        if (crashFree()) {
            ghostToBlock();
            currentTetris.flip(1);
        }
    } 
    
    // tbh i don't like that I have to make this complicated. I really want a simpler solution...
    if (text == 'right') {
        currentTetris.flip(-1);
        let a = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0} ];
        for ( let i = 0 ; i <= 3 ; i++ ) {
            a[i].x = -rotateMatrix[currentTetris.form][currentTetris.pose][i].x;
            a[i].y = -rotateMatrix[currentTetris.form][currentTetris.pose][i].y;
        }
        //console.log(a);
        blockToGhost(a);
        if (crashFree()) {
            ghostToBlock();
        } else {
            currentTetris.flip(1);
        }
    }

    //console.log('form:' + currentTetris.form + ' pose:' + currentTetris.pose);

}   // end of moveRotate()





function rotateTest() {

    blockToGhost(translateMatrix.stay);
    displayGhost();

    let a = Math.sin( 0.5 * Math.PI );
    a = a.toFixed(2);
    
    console.log(`sin() is ${a}`);




}




function displayGhost() {
    console.log(`(${ghost[0].x},${ghost[0].y}) (${ghost[1].x},${ghost[1].y}) (${ghost[2].x},${ghost[2].y}) (${ghost[3].x},${ghost[3].y})`);
}





function integrateBlocks() {
    // integrates tetris into blockPile, then reset tetris piece back to top.

    blockToGhost(translateMatrix.stay);

    //let a = ( ghost[0].floor() == ghost[0].ceil() );
    //a = ( a && yMove.check.fallV() );

    let a = ( ( ghost[0].floor() == ghost[0].ceil() ) && yMove.check.fallV() );
    //console.log(`count.stagnant is ${count.stagnant}`);

    if (a) {

        if ( count.stagnant > 10 ) {
            let b = Math.ceil( count.stagnant / (count.set.stagnant / 10) ) ;
            for ( let i = 0 ; i <= 3 ; i++ ) {
                blockPile[i+numOfBlock.t].innerText = b;
            }
        }


        if ( count.stagnant == count.set.stagnant ) {
            for (let i = 0 ; i <= 3 ; i++ ) {
                blockPile[ghost[i].ceil()].style.opacity = setOpacity.high;
                }
            resetTetrisShape();
            checkRow();
            count.reset();
        } else {
            count.stagnant++;
        }
    } else {
        count.reset();
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





