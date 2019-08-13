// JS for tetris

// Notes:
// I intend to work with vanilla JS for now. Need to learn basics first.
//
// blockPile[] contains both the blocks in the background and the tetris piece.
// blockPile[0] to blockPile[numOfBlock.t-1] are the background blocks.
// blockPile[numOfBlock.t] to blockPile[numOfBlock.t+3] are the four blocks forming the tetris piece.



// ---------- Declaration Section -------------------------------- //


// DOM elements
    var toyRoom = document.getElementById('toyRoom');   
    var blockPile = toyRoom.children;


// CANVAS elements
    //var canvas = document.getElementById('canvas');
    //var ctx = canvas.getContext('2d');
    

// SCREEN and BROWSER parameters
    var screen = {  x : window.screen.width,
                    y : window.screen.height,
                    r : window.devicePixelRatio,
                    t : 0.70 }                      // "trim", percentage to vertically shrink toyRoom by
    //console.log(`Screen res: ${screen.x} x ${screen.y}  ratio: ${screen.r}`);
    //console.log(navigator.userAgent);



// dimension variables
    var numOfBlock = {  x : 8,              // number of blocks in the horizontal direction
                        y : 18,             // number of blocks in the vertical direction
                        m : 0,              // starting horizontal location of the tetris piece        
                        t : 0,              // total number of blocks on the board, minus the tetris piece
                        midpoint : function() {this.m = Math.floor( this.x / 2 ) - 1},
                        total : function() {this.t = this.x * this.y} }
        numOfBlock.midpoint();      
        numOfBlock.total();

    var yInc = 2 * Math.ceil( 0.5 * ( screen.y * screen.t ) / numOfBlock.y );
        // dividing by 2 and multilying by 2 ensures the half-steps are still integer steps.
    var xInc = yInc;            // I admit, this doesn't allow for flexibility... oh wells...
    var yDim = yInc * numOfBlock.y;
    var xDim = xInc * numOfBlock.x;
        toyRoom.style.height = yDim + 'px';
        toyRoom.style.width = xDim + 'px';
        // making toyRoom fit the screen vertically

// appearance settings
    var blockBackgroundColor = 'rgba(50, 150, 250, 0.3)';
    var tetrisOpacity = 0.3;            // not used
    var blockBoxShadow = '0px 0px 5px 0px inset white';
    var blockBorderRadius = '0%';
    //var tetrisBackgroundColor = 'rgba(100, 130, 250, 0.1)';
    var tetrisColor = [];
        tetrisColor[0] = 'rgba(250, 100, 100, 0.3)';
        tetrisColor[1] = 'rgba(250, 250, 100, 0.3)';
        tetrisColor[2] = tetrisColor[1];
        tetrisColor[3] = 'rgba(100, 250, 100, 0.3)';
        tetrisColor[4] = tetrisColor[3];
        tetrisColor[5] = 'rgba(100, 250, 250, 0.3)';
        tetrisColor[6] = 'rgba(250, 100, 250, 0.3)';

    var tetrisBoxShadow = '0px 0px 5px 0px inset #FFF';
    var setOpacity = {  low : 0.1,                  // low setting of opacity
                        high : 1,                   // high setting of opacity
                        flip : function(num) {return (num == this.low) ? this.high : this.low;} };



// TIME settings
    var timeInc = 10;               // time interval used in timeFlow
    var timeTick = 0;               // time counter in setInterval in timeAction()
    var paused = false;             // true if game is paused.
    var count = {   set : { stagnant : 300,              // how long tetris piece should wait until it integrates into the pile
                            limit    : 700 },           // absolute limit for how long to wait until integration
                    stagnant : 0,                       // how long tetris piece has been stagnant right now
                    limit : 0,                          // how long tetris piece has been stagnant, regardless of movement
                    keyReleased : false,                // did keyup event with ArrowDown happen?
                    reset : function() { this.stagnant = 0; },                          // resets stagnant
                    resetlimit : function() { this.limit = 0; },                        // resets limit
                    fill : function() { this.stagnant = this.set.stagnant; } };         // times up!



// MOVEMENT settings
    var yMove = {
        setting : { fallV : 60, downV : 3 },        // set these manually to adjust speed
        actual : { fallV : 0, downV : 0 },          // leave these alone!
        flip : { 
            fallV : function() { yMove.actual.fallV = (yMove.actual.fallV==0) ? yMove.setting.fallV : 0; } },
        press : {
            down : function() { yMove.actual.downV = yMove.setting.downV; },
            up : function() { yMove.actual.downV = 0 } },
        check : {
            fallV : function() { return (yMove.actual.fallV==0) ? false : true; },
            downV : function() { return (yMove.actual.downV==0) ? false : true; } },
        demand : function() {
            // if true, there is demand to move 1 step down at this time iteration.
            if (yMove.check.downV()) { 
                return ( (timeTick%yMove.actual.downV) == 0 ) ? true : false;
            } else {
                return ( (timeTick%yMove.actual.fallV) == 0 ) ? true : false;
            } } };
        yMove.flip.fallV();             // toggles whether the game starts with tetris falling or not
    
    

// OBJECTS to configure and move the TETRIS PIECE 
    var tetrisForms = [];
        tetrisForms[0] = [ {x:0, y:0}, {x:1, y:0}, {x:2, y:0}, {x:3, y:0} ];    // long bar
        tetrisForms[1] = [ {x:0, y:0}, {x:1, y:0}, {x:2, y:0}, {x:2, y:1} ];    // inverse 'L' shape
        tetrisForms[2] = [ {x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:2, y:0} ];    // 'L' shape
        tetrisForms[3] = [ {x:0, y:1}, {x:1, y:1}, {x:1, y:0}, {x:2, y:0} ];    // inverse 'Z' shape
        tetrisForms[4] = [ {x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:2, y:1} ];    // 'Z' shape
        tetrisForms[5] = [ {x:0, y:1}, {x:1, y:1}, {x:1, y:0}, {x:2, y:1} ];    // upside down 'T' shape
        tetrisForms[6] = [ {x:0, y:0}, {x:0, y:1}, {x:1, y:0}, {x:1, y:1} ];    // square shape
        for ( let i = 0 ; i < tetrisForms.length ; i++ ) {
            arrayAddMultiply(tetrisForms[i], numOfBlock.m, xInc, 0, yInc);
        }

    var tetrisChance = [2, 1, 1, 1, 1, 2, 2];
        // ratio of how likely each tetrisForm[] is to appear.
        // tetrisChance[0] represents how likely it is for the long bar to appear.
        // tetrisChance[1] represents how likely it is for the inverse 'L' shape to appear.
        // probability of appearance is the number over the sum of all numbers.

    var randomMatrix = {
        // object that contains the array of probability of each shape.
        // method for reconfiguring the probability when the tetrisChance array is modified.
        // for example, if tetrisChance[0] is 7, then the first 7 items in randomMatrix is 0.
        // if tetrisChance[1] is 4, then the next 4 items in randomMatrix is 1.
        matrix : [],
        randomize : function() {
            this.matrix = this.matrix.slice(0,tetrisChance.reduce(function(sum,num){return sum + num;} ));
            let k = 0;
            for ( let i=0 ; i<=tetrisChance.length ; i++ ) for ( let j=0 ; j<tetrisChance[i] ; j++ ) this.matrix[k++] = i; } };

    var currentTetris = { 
        form : 0,                               // there are 7 forms total. 0 to 6.
        pose : 0,                               // number of poses for each form varies. At most four.
            // NOTICE!!!! --- at the moment, currentTetris.pose is not used at all...
        flip : function(num) {                  // assumes num is either 1 or -1
            this.pose = this.pose + num;
            if (this.pose == rotateMatrix[this.form].length) this.pose = 0;
            if (this.pose < 0 ) this.pose = rotateMatrix[this.form].length - 1; } };
            // NOTICE!!! --- since I'm not useing rotateMatrix, the flip method is also unused.
            

    var rotateMatrix = [];
        // this is the rotation matrix. For the given form and pose, this is the tranformation...
        // ... that must take place to get to the next pose in line.
        // it assumes that the rotation is happening in the counterclockwise direction.
        // after having made this, I'm a little bit embarrassed that I didn't just come up with a formula...
        // NOTICE!!! --- at the moment, rotateMatrix is not used at all!!!
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
        for ( let i = 0 ; i < rotateMatrix.length ; i++ ) {
            for ( let j = 0 ; j < rotateMatrix[i].length ; j++ ) {
                arrayAddMultiply(rotateMatrix[i][j], 0, xInc, 0, yInc); } }

    var rotateP = {
        // this is an alternate way to rotate the tetris piece, using a formula instead of a pre-made array.
        // instead of using the rotateMatrix, use this to rotate each three of the tetris blocks relative to a pivot block.
        r : 0,          // radius
        initA : 0,      // initial angle [radians]
        newA : 0,       // new angle [radians]
        xNew : 0,
        yNew : 0,
        calc : function(x0, y0, x1, y1, rotA) {
            // x0, y0 are coordinates that the other block pivots around.
            // x1, y1 are coordinates of the block that rotates around the pivot coordinate.
            // rotA is the angle of rotation. [radians]
            // when rotA is positive, the rotation is CLOCKWISE.
            this.r = Math.sqrt( Math.pow( y1-y0 , 2 ) + Math.pow( x1-x0 , 2 ) );
            if (this.r==0) {
                // if radius is zero, the inverse sine formula yields and error.
                this.xNew = x0;
                this.yNew = y0;    
            } else {
                this.initA = ((x1-x0)<0) ? Math.PI - Math.asin( (y1-y0)/this.r ) : Math.asin( (y1-y0)/this.r );
                this.newA = this.initA + rotA;
                this.xNew = Math.round(this.r * Math.cos(this.newA) + x0);
                this.yNew = Math.round(this.r * Math.sin(this.newA) + y0); } } } 
    
    var longBarPivot = {
        // this is the pivot point for the long bar only. 
        // The long bar has a pivot point that is not exclusively any one of the tetris piece.
        // For all other tetris shapes, I can just set one of the blocks as the pivot point.
        // But for the long bar, the pivot point has to be outside the tetris piece itself...
        // ... in order to produce the nicely balanced rotation that doesn't swing too much in one way.
        x : 0,
        y : 0,
        calc : function(x0, y0, x1, y1) {
            // input: coordinates of the first tetris block and the fourth tetris block
            // output: coordinates of the pivot point
            let d = 0.5 * xInc;                         // perpendicular distance of the pivot point from the line from point 1 to point 2
            let r = Math.sqrt( Math.pow(y1-y0,2) + Math.pow(x1-x0,2) );         // distance between (x0,y0) and (x1,y1)
            let a = ((x1-x0)<0) ? Math.PI - Math.asin( (y1-y0)/r ) : Math.asin( (y1-y0)/r );    // angle between (x0,y0) and (x1,y1)
            let xMid = x0 + 0.5 * (x1 - x0);            // midpoint x
            let yMid = y0 + 0.5 * (y1 - y0);            // midpoint y
            let b = a + 0.5 * Math.PI;                  // new angle = old angle + 90 deg
            this.x = d * Math.cos(b) + xMid;
            this.y = d * Math.sin(b) + yMid;
            return true; } }




    var translateMatrix = {
        // this object is used as the input array for blockToGhost()
        // use this to move the tetris piece left, right, or down, without rotating.
        // use .stay to simulate an unmoved tetris piece.
        left : [ { x:-1, y:0 }, { x:-1, y:0 }, { x:-1, y:0 }, { x:-1, y:0 } ],
        right : [ { x:1, y:0 }, { x:1, y:0 }, { x:1, y:0 }, { x:1, y:0 } ],
        down : [ { x:0, y:1 }, { x:0, y:1 }, { x:0, y:1 }, { x:0, y:1 } ],
        stay : [ { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 } ] }
        for ( let i = 0 ; i <=3 ; i++ ) {
            translateMatrix.left[i].x *= xInc;              // length of side step
            translateMatrix.right[i].x *= xInc;             // length of side step
            translateMatrix.down[i].y *= 0.5*yInc; }        // length of downward step

    var ghost = [new ghostType(0,0), new ghostType(), new ghostType(), new ghostType() ];
        // the ghost is used as temporary storage of the tetris piece's current location.
        // whatever change we want to make on the tetris piece is applied first to the ghost.
        // then the ghost is used to test for collisions, against walls or other blocks.
        // if no collision is detected, the ghost is applied back to the tetris piece on blockPile[].
    function ghostType(x, y) {
        this.x = x,         // number, not string
        this.y = y,         // number, not string
        this.fill = function(left, top, xStep, yStep) {     // assumes 'left' and 'top' are strings.
             this.x = px.off(left) + xStep;          
             this.y = px.off(top) + yStep; },
        this.floor = function() { return numOfBlock.x * (Math.floor(this.y/yInc)) + (this.x/xInc); },      // outputs index
        this.ceil  = function() { return numOfBlock.x * (Math.ceil(this.y/yInc)) + (this.x/xInc); } };     // outputs index
            // ghost[].floor and ghost[].ceil yields an integer that corresponds to the index of a block in blockPile.
            // this index number is used to test whether that block has opacity = setOpacity.high. This counts as collision.

    var wall = {    
        // used for collision check
        left : 0,
        right : xDim - xInc,
        ceiling : 0,
        floor : yDim - yInc }

    var px = {  
        // removes 'px' from things like blockPile[].style.left
        off : function(text) { return eval( text.substring(0, text.length - 2) ) },
        on : function(number) { return eval(number) + 'px'} }
            // maybe px.on() useless...


        






    









// ---------- Functions ------------------------------------------ //


function setBoard() {
    // fills toyRoom with empty boxes.
    // low opacity blocks 

    //let rarity = 0.01;                   // used for randomly placing blocks on board. delete later.

    for ( let i = 0 ; i < numOfBlock.t ; i++ ) {
        // filling toyRoom with lots of block elements. starting at low opacity.

        var p = document.createElement('div');

        p.style.cursor = 'pointer';             // not necessary

        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = blockBackgroundColor;
        
        //p.style.opacity = ( 0 == ( Math.floor( rarity * i * Math.random() ) ) ) ? setOpacity.low : setOpacity.high;
        
        p.style.opacity = setOpacity.low;

        p.style.border = '0.5px solid rgba(255, 255, 255, 1)'; 
        p.style.borderRadius = blockBorderRadius; 
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


    // mouse click to move tetris possible!!!
        //moveButtons.children[0].onclick = function() { moveHorizontal(translateMatrix.left); }
        //moveButtons.children[1].onclick = function() { ( yMove.check.downV() == true ) ? yMove.press.up() : yMove.press.down(); }
        //moveButtons.children[2].onclick = function() { moveHorizontal(translateMatrix.right); }
        //moveButtons.children[3].onclick = function() { moveRotate('left'); }
        //moveButtons.children[4].onclick = function() { resetTetrisShape(); }
        //moveButtons.children[5].onclick = function() { integrateBlocks(); }
        // might have to remove this later. Think about it...

}   // end of setBoard()







function timeAction() {
    // this function runs in --> var timeFlow = setInterval(timeAction,timeInc);    

    if (!paused) {
        timeTick++                      // general use clicker
        tetrisBlink();                  // animates the facial expression. pretty useless.
        boxFall();                      // make tetris fall continually
        integrateBlocks();              // integrate tetris into blockPile after some time.
    }

}   // end of timeAction()






function tetrisBlink() {
    // making the tetris piece facial expression blink
    // pretty useless. but I couldn't help myself...

    if (yMove.check.fallV() == false) {
        let a = timeTick % 300;
        let b = [ ( (a>0) && (a<40) ),
                ( (a>20) && (a<60) ),
                ( (a>40) && (a<80) ),
                ( (a>60) && (a<100) ) ];
        for ( let i = 0 ; i <= 3 ; i++ ) {
            (b[i])? blockPile[i+numOfBlock.t].innerText = "-__-": blockPile[i+numOfBlock.t].innerText = "o__o";
            //blockPile[i+numOfBlock.t].innerText = i;
        }
    }
}   // end of tetrixBlink()







function keyDownAction(ev) {

    //console.log('you pressed ' + ev.code);

    switch (ev.code) {
        case 'KeyA':
            if (!paused) moveRotate('left');
            break;
        case 'KeyS':
            if (!paused) moveRotate('right');
            break;
        case 'KeyN':
            if (!paused) resetTetrisShape();
            break;
        case 'Space':
            break;
        case 'KeyF':
            yMove.flip.fallV();         // toggles whether tetris slowly falls or not
            break;
        case 'KeyT':
            test();
            break;
        case 'KeyP':
            pauseGame();
            break;

        // directional movement
        case 'ArrowLeft':
            count.reset();              // resets the counter for integrateBlock()
            if (!paused) moveHorizontal(translateMatrix.left);
            break;
        case 'ArrowRight':
            count.reset();              // resets the counter for intergrateBlock()
            if (!paused) moveHorizontal(translateMatrix.right);
            break;
        case 'ArrowUp':
            if (!paused) moveRotate('left');
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



function createTitlePage() {
    // creates title page
    // make sure to create the title page AFTER you already set the board and tetris piece


    var p = document.createElement('div');
    p.style.position = 'relative';
    p.style.backgroundColor = '#0005';
    p.style.left = '10px';
    p.style.top = '10px';
    p.style.width = '200px';
    p.style.height = '500px';

    p.style.color = '#FFF';
    p.style.fontSize = '9pt';
    p.style.borderRadius = '20px';
    //p.style.display = 'block';
    p.innerText = 'hello';
    
    
    /*
    p.onclick = function() {
        let a = 0;
        var t = setInterval(function() {
            p.innerText = a;
            if (a=20) clearInterval(t);
        },10);
    }
    */

    toyRoom.appendChild(p); 

    //toyRoom.lastChild.innerText = 'why';
    //toyRoom.lastChild.style.borderRadius = '0%';

}





function createTetrisPiece() {
    // creates the four blocks of the tetris piece.
    // But the shape is not initiated. The shape should be initiated by a different function.
    // createTetrisPiece() should be run only once. at the beginning.

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
        //p.style.backgroundColor = tetrisBackgroundColor;
        p.style.border = '0.5px solid rgba(255, 255, 255, 1)';
        p.style.borderRadius = blockBorderRadius;
        p.style.visibility = 'visible';
        
        p.style.boxShadow = tetrisBoxShadow;
        
        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        
        p.style.position = 'absolute';
        
        p.style.left = '0px';               // actually, this doesn't matter...
        p.style.top = -yInc + 'px';         // ... cuz this puts it outside the boundary. invisible.

        toyRoom.appendChild(p); 
    
    }   // end of for loop

}   // end of createTetrisPiece()







function resetTetrisShape() {
    // sets the shape of the tetris piece

    randomMatrix.randomize();

    //currentTetris.form = Math.floor( randomMatrix.matrix.length * Math.random() );
    //currentTetris.form = randomMatrix.matrix[currentTetris.form];
    currentTetris.form = randomMatrix.matrix[Math.floor(randomMatrix.matrix.length * Math.random() )];
    currentTetris.pose = 0;
        // currentTetris.pose isn't really being used right now. So sad...

    for ( let i = 0 ; i <=3 ; i++ ) {
        blockPile[i+numOfBlock.t].style.left = tetrisForms[currentTetris.form][i].x + 'px';
        blockPile[i+numOfBlock.t].style.top = tetrisForms[currentTetris.form][i].y + 'px';
        blockPile[i+numOfBlock.t].style.backgroundColor = tetrisColor[currentTetris.form];
    }

}   // end of resetTetrisShape()






function blockToGhost( arr ) {
    // stores tetris piece data to ghost.
    // PLUS, applies translation or rotation, depending on the 'arr' array.
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]
    // typically used with translateMatrix.left, .right, .down, and .stay.
    // rotates the tetris piece if rotateMatrix is inserted in arr.
    // ghost[].x and ghost[].y are numbers, NOT strings

    for ( let i = 0 ; i <= 3 ; i++ ) {
        ghost[i].x = px.off(blockPile[i+numOfBlock.t].style.left) + arr[i].x ;
        ghost[i].y = px.off(blockPile[i+numOfBlock.t].style.top) + arr[i].y ;
    }
}   // end of blockToGhost()


function ghostToBlock() {
    // takes the data stored in ghost and insert back into the real tetris piece.
    // blockPile[].style.left and blockPile[].style.top are strings.

    for ( let i = 0 ; i <= 3 ; i++ ) {
        blockPile[i+numOfBlock.t].style.left = ghost[i].x + 'px';
        blockPile[i+numOfBlock.t].style.top = ghost[i].y + 'px';
    }

}   // end of ghostToBlock()










function checkRow() {
    // checks the entire board to look for rows that are filled up completely.
    // then the filled up rows are eliminated, and all above blocks are migrated one level lower.

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
    // ... if there is a demand for the block to drop.
    // includes both natural falling and falling due to pressing the down key.
    // before applying the new coordinates, checks for collision first. 

    if ( yMove.demand() ) {
        blockToGhost(translateMatrix.down);
        if (crashFree()) {
            ghostToBlock();
            for ( let i = 0 ; i <= 3 ; i++ ) { blockPile[i+numOfBlock.t].innerText = '>__<'; }
        }
    }
}   // end of boxFall()







function moveHorizontal(arr) {
    // moves box left or right depending on stepX
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]
    // copy the tetris piece coordinate info to ghost. then check ghost for collision.
    // if no collision, then move the ghost data back to blockPile.

    blockToGhost(arr);
    if (crashFree()) ghostToBlock();

}   // end of moveHorizontal()







function moveRotate(text) {
    // rotates tetris piece clockwise or counterclockwise.
    // if text is 'left', rotate counterclockwise.
    // if text is 'right', rotate clockwise.

    let rotA = (text=='left') ? -Math.PI/2 : Math.PI/2;
    let arr = { x:0 , y:0 };
    let pivot = 1;

    if (currentTetris.form==6) { return };
        // don't rotate the square shaped tetris

    blockToGhost(translateMatrix.stay);

    if (currentTetris.form==0) {
        // change the pivot coordinate if the tetris piece is the LONG BAR
        longBarPivot.calc( ghost[0].x, ghost[0].y, ghost[3].x, ghost[3].y );
        arr.x = longBarPivot.x;
        arr.y = longBarPivot.y;
    } else {
        // for all other tetris piece shapes, just use one of the middle blocks as pivot
        arr.x = ghost[pivot].x;
        arr.y = ghost[pivot].y;
    }

    for ( let i = 0 ; i <= 3 ; i++ ) {
        // put the rotated positions into the ghost object.
        // before we change the position of the actual tetris piece, we're going to test it first.
        rotateP.calc( arr.x , arr.y , ghost[i].x , ghost[i].y , rotA );
        ghost[i].x = rotateP.xNew;
        ghost[i].y = rotateP.yNew;           
    }

    if ( crashFree() ) { 
        // this is where we crash-test the rotated position using the ghost object
        // if it passes the test, copy the positions into the actual tetris piece
        ghostToBlock(); 
        return;
    } else {
        // this is the SECOND CHANCE function.
        // if the rotation failed because the tetris piece was too close to the wall...
        // ... this else statement will scoot it over once and try again.
        if (ghost[1].x == 0) { for ( let i = 0 ; i <= 3 ; i++ ) { ghost[i].x += xInc; }; } 
        
        if (ghost[1].x == (xDim-xInc) ) { for ( let i = 0 ; i <= 3 ; i++ ) { ghost[i].x -= xInc; }; }
        
        if ( crashFree() ) {
            ghostToBlock();
            return;
        }
    }

}   // end of moveRotate()




function pauseGame() {
    paused = !paused;
    
    for ( let i = 0 ; i <= 3 ; i++ ) { blockPile[i+numOfBlock.t].innerText = "o__o"; }

    if (paused) alert('paused!'); 
}




function crashFree() {
    // (1) compares the GHOST[] to wall.left, wall.right, and wall.floor.
    // (2) compares ghost[] to blockPile[] with opacity at setOpacity.high
    // yields TRUE if no collisions.
    // this function requires that the block is perfectly aligned with the columns. Otherwise, ghost[i].floor will not work.

    for ( let i = 0 ; i <= 3 ; i++ ) {

        // check walls first
        if (ghost[i].x < wall.left) return false;
        if (ghost[i].x > wall.right) return false;
        if (ghost[i].y < wall.ceiling) return false;
        if (ghost[i].y > wall.floor) return false;

        // check for block collisions
        // requires ghost[i].floor and .ceil to yield integers
        if ( blockPile[ ghost[i].floor() ].style.opacity == setOpacity.high ) return false;
        if ( blockPile[ ghost[i].ceil()  ].style.opacity == setOpacity.high ) return false;
    }

    return true;
}   // end of crashFree()











function integrateBlocks() {
    // integrates tetris into blockPile, then reset tetris piece back to top.

    blockToGhost(translateMatrix.down);
    let onSolidGround = !crashFree();
    
    blockToGhost(translateMatrix.stay);

    if ( ( ghost[0].floor() == ghost[0].ceil() ) && yMove.check.fallV() && onSolidGround ) {
        // check that block is aligned to grid AND block has instruction to fall if it can.
        // the counter will reset once you break the chain, by moving or by toggling the falling condition off.


        
        if ( count.stagnant > 4 ) {
            // makes the tetris blocks display a number that counts to 10.
            // the number 4 here is arbitrary. I put the 4 here because otherwise the count.stagnant at zero...
            // ... interrupts the tetris face.
            if ( count.limit < (count.set.limit - count.set.stagnant + 5 ) ) {
                // the number 5 here is also arbitrary...
                for ( let i=0 ; i<=3 ; i++ ) { 
                    blockPile[i+numOfBlock.t].innerText = 11 - Math.ceil( count.stagnant / (count.set.stagnant / 10) ); 
                }
            } else {
                for ( let i=0 ; i<=3 ; i++ ) { 
                    blockPile[i+numOfBlock.t].innerText = 11 - Math.ceil( ( count.limit - count.set.limit + count.set.stagnant ) / (count.set.stagnant / 10) ); 
                }
            }
        }
        
        
        // Instantly integrates if user releases key and presses down again.
        document.addEventListener('keyup', (ev) => { count.keyReleased = true; } );
        document.addEventListener('keydown', (ev) => { 
            if ( (ev.code=='ArrowDown') && count.keyReleased ) { count.fill(); };
            count.keyReleased = false;
            }
        );

        if ( count.stagnant == count.set.stagnant ) {
            // once the counter reaches the end...
            // integrate the tetris piece into the pile of blocks...
            // reset the tetris shape...
            // check for any rull rows...
            // and reset the counter back to zero.
            
            for ( let i = 0 ; i <= 3 ; i++ ) { blockPile[i+numOfBlock.t].innerText = ">__<"; }
                // gives tetris a face when reset to top

            for ( let i=0 ; i<=3 ; i++ ) { 
                // integrated block has high opacity and color
                blockPile[ghost[i].ceil()].style.opacity = setOpacity.high; 
                blockPile[ghost[i].ceil()].style.backgroundColor = tetrisColor[currentTetris.form];
            }
            
            timeTick -= timeTick % yMove.setting.fallV;
                // this prevents the new tetris piece from jumping to the second lane prematurely.

            resetTetrisShape();
            checkRow();
            count.reset();
        } else { 
            count.stagnant++; 
            if (count.limit++ == count.set.limit) count.fill();
        }

    } else { 
        count.reset(); 
        count.resetlimit();
        count.keyReleased = false;
    }
}   // end of integrateBlocks()













// ---------------------- SHORTCUT FUNCTIONS --------------------------- //




function RadToDeg(a) { return a * 180 / Math.PI; }


function DegToRad(a) { return a * Math.PI / 180; }


function displayGhost(a) {
    // console displays the provided array.
    // the array has to have this format: [ {x,y}, {x,y}, {x,y}, {x,y} ]
    console.log(`(${a[0].x},${a[0].y}) (${a[1].x},${a[1].y}) (${a[2].x},${a[2].y}) (${a[3].x},${a[3].y})`); }


function arrayAddMultiply(arr, xAdd, xMul, yAdd, yMul) {
    // assumes arr is an array of {x,y} objects.
    // adds xAdd to every x value, then multiplies every x value by xMul.
    // adds yAdd to every y value, then multiplies every y value by yMul.
    for ( let i = 0 ; i < arr.length ; i++ ) {
            arr[i].x += xAdd;
            arr[i].x *= xMul;
            arr[i].y += yAdd;
            arr[i].y *= yMul; } }

function test() {
    // this is where you conduct all the test you want to test.....


}


















// ----------------- MAIN BODY ----------------------------------------- //


// before the game starts...
setBoard();
checkRow();             // after random blocks are generated, check for row completion
createTetrisPiece();     // create the four elements for the tetris block
resetTetrisShape();     // put the tetris piece on the board

//createTitlePage();


// runs continuously
var timeFlow = setInterval(timeAction,timeInc);

// event listeners
document.addEventListener('keydown', keyDownAction);
document.addEventListener('keyup', keyUpAction);





