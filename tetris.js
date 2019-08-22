// JS for tetris

// Notes:
// I intend to work with vanilla JS for now. Need to learn basics first.
// Yep. This entire thing is entirely vanilla. Entirely.
//
// blockPile[] contains both the blocks in the background and the tetris piece.
// blockPile[0] to blockPile[numOfBlock.t-1] are the background blocks.
// blockPile[numOfBlock.t] to blockPile[numOfBlock.t+3] are the four blocks forming the tetris piece.



// ---------- Declaration Section -------------------------------- //


// DOM elements
    var toyRoom = document.getElementById('toyRoom');   
        toyRoom.style.backgroundImage = "url('sky.jpg')";
        toyRoom.style.backgroundColor = '#DEF';                 // Does this even matter?
    var blockPile = toyRoom.children;
    var scoreBoard = document.getElementById('scoreBoard');
    var preView = document.getElementById('preView');
        preView.style.backgroundImage = "url('sky.jpg')";
    var _points = document.getElementById('points');
    var _lines = document.getElementById('lines');
    var _speed = document.getElementById('speed');



// SCREEN and BROWSER parameters
    var screen = {  x : window.screen.width,
                    y : window.screen.height,
                    r : window.devicePixelRatio,
                    t : 0.65 }                      // "trim", percentage to vertically shrink toyRoom by
    //console.log(`Screen res: ${screen.x} x ${screen.y}  ratio: ${screen.r}`);
    //console.log(navigator.userAgent);



// DIMENSIONS variables
    var numOfBlock = {  x : 8,              // number of blocks in the horizontal direction
                        y : 20,             // number of blocks in the vertical direction
                        m : 0,              // starting horizontal location of the tetris piece        
                        t : 0,              // total number of blocks on the board, minus the tetris piece
                        midpoint : function() {this.m = Math.floor( this.x / 2 ) - 2},
                        total : function() {this.t = this.x * this.y} }
        numOfBlock.midpoint();      
        numOfBlock.total();
            // I'm not sure why I made these into methods instead of just setting the .m and .t values right away.
            // Perhaps I imagined that I would change the toyRoom dimensions mid-game.

    var yInc = 4 * Math.ceil( 0.25 * ( screen.y * screen.t ) / numOfBlock.y );
        // dividing by 2 and multilying by 2 ensures the half-steps are still integer steps.
    var xInc = yInc;            // I admit, this doesn't allow for flexibility... oh wells...
    var yDim = yInc * numOfBlock.y;
    var xDim = xInc * numOfBlock.x;
        toyRoom.style.height = yDim + 'px';
        toyRoom.style.width = xDim + 'px';
            // making toyRoom fit the screen vertically
        preView.style.height = 3*yInc + 'px';
            //scoreBoard.style.width = '300px';



// APPEARANCE settings
    var blockStyle = {
        bkgdColor : 'rgba(50, 150, 250, 0.3)' ,         // Nothing uses this right now.
        border : '0.5px solid rgba(0, 0, 0, 1)' ,
        boxShadow : '0px 0px 20px 0px inset white' ,
        borderRadius : '20%' ,
        opacity : 0.5 }

    var tetrisColor = [];
        tetrisColor[0] = `rgba(250, 100, 100, ${blockStyle.opacity})`;
        tetrisColor[1] = `rgba(250, 250, 100, ${blockStyle.opacity})`;
        tetrisColor[2] = `rgba(100, 100, 250, ${blockStyle.opacity})`;
        tetrisColor[3] = `rgba(100, 250, 100, ${blockStyle.opacity})`;
        tetrisColor[4] = `rgba(100, 100, 100, ${blockStyle.opacity})`;
        tetrisColor[5] = `rgba(100, 250, 250, ${blockStyle.opacity})`;
        tetrisColor[6] = `rgba(250, 100, 250, ${blockStyle.opacity})`;

    var setOpacity = {  low : 0,        // Low setting of opacity. 
                        high : 1,       // High setting of opacity.
                        flip : function(num) {return (num == this.low) ? this.high : this.low;} };



// TIME settings
    var timeInc = 5;               // time interval used in timeFlow.[ms]
    var timeTick = 0;               // time counter in setInterval in timeAction()
    var paused = false;             // true if game is paused.
    var count = {   set : { stagnant : 300,             // how long tetris piece should wait until it integrates into the pile
                            limit    : 700 },           // absolute limit for how long to wait until integration
                    stagnant : 0,                       // how long tetris piece has been stagnant right now
                    limit : 0,                          // how long tetris piece has been stagnant, regardless of movement
                    keyReleased : false,                // did keyup event with ArrowDown happen?
                    reset : function() { this.stagnant = 0; },                          // resets stagnant
                    resetlimit : function() { this.limit = 0; },                        // resets limit
                    fill : function() { this.stagnant = this.set.stagnant; } };         // times up!



// MOVEMENT settings
    var yMove = {
        setting : { absFallV : 300, fallV : 300, downV : 2, dropIncrement : 5 },       // set these manually to adjust speed
        actual : { fallV : 0, downV : 0 },          // leave these alone!
        flip : { 
            fallV : function() { yMove.actual.fallV = (yMove.actual.fallV==0) ? yMove.setting.fallV : 0; } },
        press : {
            down : function() { yMove.actual.downV = yMove.setting.downV; },
            up : function() { yMove.actual.downV = 0 } },
        speedUp : function() {
            //if ((yMove.setting.fallV - yMove.setting.dropIncrement) > 0) { 
                //yMove.setting.fallV -= yMove.setting.dropIncrement; }
            yMove.setting.fallV -= ((yMove.setting.fallV-yMove.setting.dropIncrement) > 0) ? yMove.setting.dropIncrement : 0;
            yMove.actual.fallV = (yMove.actual.fallV==0) ? 0 : yMove.setting.fallV;
            _speed.innerText = (1000 * translateMatrix.downstep / timeInc / yMove.actual.fallV).toFixed(0); },
        reset : function() {
            yMove.setting.fallV = yMove.setting.absFallV;
            yMove.actual.fallV = yMove.setting.fallV;
            _speed.innerText = (1000 * translateMatrix.downstep / timeInc / yMove.actual.fallV).toFixed(0); },
        check : {
            fallV : function() { return (yMove.actual.fallV==0) ? false : true; },
            downV : function() { return !(yMove.actual.downV==0); } },
        demand : function() {
            // If true, there is demand to move 1 step down at this time iteration.
            // Also, displays the speed on the screen.
            if (yMove.check.downV()) { 
                _speed.innerText = (1000 * translateMatrix.downstep / timeInc / yMove.actual.downV).toFixed(0);
                return ( (timeTick%yMove.actual.downV) == 0 ) ? true : false;
            } else if (yMove.check.fallV()) {
                _speed.innerText = (1000 * translateMatrix.downstep / timeInc / yMove.actual.fallV).toFixed(0);
                return ( (timeTick%yMove.actual.fallV) == 0 ) ? true : false;
            } else {
                _speed.innerText = 0;
                return false;
            } } };
        yMove.flip.fallV();             // toggles whether the game starts with tetris falling or not



// GAME SCORE settings
    var score = {
        unit : 100,
        total: 0,
        top : 0,
        count : 0,              // number of rows completed this round.
        countTotal : 0,         // total number of rows completed in game.
        bonus : [ 0 , 1 , 1.25 , 1.5 , 2 ],
        tally : function() {
            this.total += this.unit * this.count * this.bonus[this.count];
            this.countTotal += this.count;
            this.count = 0;
            _points.innerText = this.total; 
            _lines.innerText = this.countTotal;
        },
        update : function() {
            this.top = Math.max(this.top, this.total); 
            },
        reset : function() {
            this.count = 0;
            this.total = 0;
            this.countTotal = 0;
            _points.innerText = this.total;
            _lines.innerText = this.countTotal;
        } };


    

// OBJECTS to configure and move the TETRIS PIECE
    const t_Forms = {
        // t_Forms stands for Tetris Forms.
        // Contains an array with the template for each of the shapes.
        // Contains also a method for applying the correct lengths and coordinates to the array.
        arr : [] ,
        applyScalars : function() { 
            for ( let i = 0 ; i < t_Forms.arr.length ; i++ ) { 
                arrayAddMultiply(t_Forms.arr[i], numOfBlock.m, xInc, 0, yInc);
            } } };
        t_Forms.arr[0] = [ {x:0, y:0}, {x:1, y:0}, {x:2, y:0}, {x:3, y:0} ];    // long bar
        t_Forms.arr[1] = [ {x:1, y:0}, {x:2, y:0}, {x:3, y:0}, {x:3, y:1} ];    // inverse 'L' shape
        t_Forms.arr[2] = [ {x:1, y:1}, {x:2, y:1}, {x:3, y:1}, {x:3, y:0} ];    // 'L' shape
        t_Forms.arr[3] = [ {x:1, y:1}, {x:2, y:1}, {x:2, y:0}, {x:3, y:0} ];    // inverse 'Z' shape
        t_Forms.arr[4] = [ {x:1, y:0}, {x:2, y:0}, {x:2, y:1}, {x:3, y:1} ];    // 'Z' shape
        t_Forms.arr[5] = [ {x:1, y:1}, {x:2, y:1}, {x:2, y:0}, {x:3, y:1} ];    // upside down 'T' shape
        t_Forms.arr[6] = [ {x:1, y:0}, {x:1, y:1}, {x:2, y:0}, {x:2, y:1} ];    // square shape    
        t_Forms.applyScalars();

    const p_Forms = {
        // p_Forms stands for Preview Forms.
        // Template for each of the shapes, as they appear in the Preview block.
        // Basically the same as t_Forms, but shifted to top left corner.
        // Also contains a method for applying the proper lengths and position.
        arr : [] ,
        applyScalar : function() {
            for ( let i = 0 ; i < p_Forms.arr.length ; i++ ) { 
                arrayAddMultiply(p_Forms.arr[i], 0, xInc, 0, yInc);
            } } };
        p_Forms.arr[0] = [ {x:0, y:0.5}, {x:1, y:0.5}, {x:2, y:0.5}, {x:3, y:0.5} ];    // long bar
        p_Forms.arr[1] = [ {x:0, y:0}, {x:1, y:0}, {x:2, y:0}, {x:2, y:1} ];    // inverse 'L' shape
        p_Forms.arr[2] = [ {x:0, y:1}, {x:1, y:1}, {x:2, y:1}, {x:2, y:0} ];    // 'L' shape
        p_Forms.arr[3] = [ {x:0, y:1}, {x:1, y:1}, {x:1, y:0}, {x:2, y:0} ];    // inverse 'Z' shape
        p_Forms.arr[4] = [ {x:0, y:0}, {x:1, y:0}, {x:1, y:1}, {x:2, y:1} ];    // 'Z' shape
        p_Forms.arr[5] = [ {x:0, y:1}, {x:1, y:1}, {x:1, y:0}, {x:2, y:1} ];    // upside down 'T' shape
        p_Forms.arr[6] = [ {x:0, y:0}, {x:0, y:1}, {x:1, y:0}, {x:1, y:1} ];    // square shape  
        p_Forms.applyScalar();

    var tetrisChance = [
        // The probability of a shape appearing is the number divided by the sum of all numbers.
        // For example, if tetrisChance was [1,1,0,0,0,0,0], the Long Bar would appear 50% of the time...
        // ... and the Square would never appear.
        1 ,      // likelihood of the Long Bar tetris piece appearing
        1 ,      // likelihood of the inverse 'L' shape
        1 ,      // likelihood of the 'L' shape
        1 ,      // likelihood of the inverse'Z' shape
        1 ,      // likelihood of the 'Z' shape
        1 ,      // likelihood of the 'T' shape
        1];     // likelihood of the Square shape

    var randomMatrix = {
        // Object that contains the array of probability of each shape.
        // Contains method 'populate' for reconfiguring the probability when the tetrisChance array is modified.
        // For example, if tetrisChance[0] is 7, then the first 7 items in randomMatrix is 0.
        // If tetrisChance[1] is 4, then the next 4 items in randomMatrix is 1.
        matrix : [],                // Array containing the t_Forms.arr[] in quantities that correspond to the probabilites.
        max : 8,                    // length of the buffer array.
        buffer : [],                // Array containing the t_Forms.arr[] that are randomly chosen.
        current : 0,                // The tetrisForm that is currently in the board.
        populate : function() {
            // This method simply populates the randomMatrix according to tetrisChance.
            // In case I want to chance tetrisChance mid-game, this line adjusts randomMatrix accordingly.
            this.matrix = this.matrix.slice(0,tetrisChance.reduce(function(sum,num){return sum + num;} ));
            let k = 0;
            for ( let i=0 ; i<=tetrisChance.length ; i++ ) for ( let j=0 ; j<tetrisChance[i] ; j++ ) this.matrix[k++] = i; },
        randomize : function(n) {
            // This method moves all elements of randomMatrix.buffer[] down.
            // Then this method assigns a random number to the top of randomMatrix.buffer[].
            // randomMatrix.randomize will repeat itself by 'n' times.
            do { for ( let i = 1 ; i < this.max ; i++ ) { this.buffer[i-1] = this.buffer[i]; }
                 this.buffer[this.max-1] = randomMatrix.matrix[Math.floor(randomMatrix.matrix.length * Math.random() )]; 
                 this.current = this.buffer[0];
                 console.log(this.buffer);
                 n--; } while (n>0); },
        initiateBuffer : function() {
            for ( let i = 0 ; i < this.max ; i++ ) { this.buffer[i] = 0; } } }
        randomMatrix.populate();
        randomMatrix.initiateBuffer();
    
    var rotateP = {
        // This object uses a formula to generate a new coordinate after rotation around a reference point.
        // Use this for each of the four tetris block to perform the rotate operation.
        r : 0,          // radius
        initA : 0,      // initial angle [radians]
        newA : 0,       // new angle [radians]
        xNew : 0,       // output
        yNew : 0,       // output
        calc : function(x0, y0, x1, y1, rotA) {
            // x0, y0 are coordinates that the other block pivots around.
            // x1, y1 are coordinates of the block that rotates around the pivot coordinate.
            // rotA is the angle of rotation. [radians]
            // When rotA is positive, the rotation is CLOCKWISE.
            this.r = Math.sqrt( Math.pow( y1-y0 , 2 ) + Math.pow( x1-x0 , 2 ) );
            if (this.r==0) {
                // If radius is zero, the inverse sine formula yields and error.
                this.xNew = x0;
                this.yNew = y0;    
            } else {
                this.initA = ((x1-x0)<0) ? Math.PI - Math.asin( (y1-y0)/this.r ) : Math.asin( (y1-y0)/this.r );
                this.newA = this.initA + rotA;
                this.xNew = Math.round(this.r * Math.cos(this.newA) + x0);
                this.yNew = Math.round(this.r * Math.sin(this.newA) + y0); } } };
    
    var longBarPivot = {
        // This is the pivot point for the long bar shape only. 
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
        // This object is used as the input array for blockToGhost().
        // Use this to move the tetris piece left, right, or down, without rotation.
        // Use .stay to simulate the tetris piece staying in place without moving.
        left : [ { x:-1, y:0 }, { x:-1, y:0 }, { x:-1, y:0 }, { x:-1, y:0 } ],
        right : [ { x:1, y:0 }, { x:1, y:0 }, { x:1, y:0 }, { x:1, y:0 } ],
        down : [ { x:0, y:1 }, { x:0, y:1 }, { x:0, y:1 }, { x:0, y:1 } ],
        stay : [ { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 } ],
        downstep : 0.25 * yInc,
        sidestep : xInc,
        applyScalar : function() {
            for ( let i = 0 ; i <=3 ; i++ ) {
                translateMatrix.left[i].x *= translateMatrix.sidestep;              // length of side step
                translateMatrix.right[i].x *= translateMatrix.sidestep;             // length of side step
                translateMatrix.down[i].y *= translateMatrix.downstep; }        // length of downward step
            } };
        translateMatrix.applyScalar();

    var ghost = [new ghostType(0,0), new ghostType(), new ghostType(), new ghostType() ];
        // The ghost is used as temporary storage of the tetris piece's current location.
        // Whatever change you want to make on the tetris piece, apply it to the ghost first!
        // Use the ghost to test for collisions, against walls or other blocks.
        // If no collision is detected, then apply the ghost back to the tetris piece on blockPile[]!
    function ghostType(x, y) {
        this.x = x,         // number, not string
        this.y = y,         // number, not string
        this.fill = function(left, top, xStep, yStep) {     // assumes 'left' and 'top' are strings with 'px' at the end.
             this.x = pxOff(left) + xStep;          
             this.y = pxOff(top) + yStep; },
        this.floor = function() { return numOfBlock.x * (Math.floor(this.y/yInc)) + (this.x/xInc); },      // outputs index
        this.ceil  = function() { return numOfBlock.x * (Math.ceil(this.y/yInc)) + (this.x/xInc); } };     // outputs index
            // ghost[].floor and ghost[].ceil yields an integer that corresponds to the index of a block in blockPile.
            // This index number is used to test whether that block has opacity = setOpacity.high. This counts as collision.

    var wall = {    
        // Used for collision check.
        // left, right, ceiling, and floor represents the four edges of the toyRoom box.
        left : 0,
        right : xDim - xInc,
        ceiling : 0,
        floor : yDim - yInc };

    function pxOff(text) { return eval( text.substring(0, text.length - 2) ) };
        






    









// ---------- Functions ------------------------------------------ //


function setBoard() {
    // Fills toyRoom with blocks. All blocks are set to low opacity.

    for ( let i = 0 ; i < numOfBlock.t ; i++ ) {
        // filling toyRoom with lots of block elements. starting at low opacity.

        var p = document.createElement('div');

        p.style.cursor = 'pointer';             // not necessary. I might delete this later.

        decorateTetrisPiece(p);

        p.style.opacity = setOpacity.low;

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

    //randomMatrix.populate();
    randomMatrix.randomize(randomMatrix.max);
        // This fills the randomMatrix.buffer. Otherwise, this array would be all zeroes.


}   // end of setBoard()







function setPreview() {
    // This function fills the 'preView' element with the preview items.

    for ( let i = 1 ; i <= randomMatrix.max ; i++ ) {
        // Removing existing wrappers to make room for new wrappers.
        if (preView.hasChildNodes()==true) { preView.removeChild(preView.lastChild); }
    }

    let wrapperLength = 0;        
    let xPosition = 0.5 * yInc;  

    for ( let i = 1 ; i < randomMatrix.max ; i++ ) {
        // Creating the 'wrappers' for the tetris preview pieces.
        
        var p = document.createElement('div');    
        
        p.style.backgroundColor = '#ACF';
        
        p.style.position = 'relative';
        //p.style.cssFloat = 'left';

        //p.style.left = '5px';
        //p.style.top = '10px';

        

        preView.appendChild(p);

        for ( let j = 0 ; j <= 3 ; j++ ) { 
            // Creating the actual preview tetris pieces.
            
            var p = document.createElement('div');    

            decorateTetrisPiece(p);
            
            p.style.backgroundColor = tetrisColor[ randomMatrix.buffer[i] ];
            
            p.style.position = 'absolute';
            p.style.left = p_Forms.arr[randomMatrix.buffer[i]][j].x + 'px';
            p.style.top = p_Forms.arr[randomMatrix.buffer[i]][j].y + 'px';
            
            preView.lastChild.appendChild(p);

            wrapperLength = Math.max(wrapperLength , p_Forms.arr[randomMatrix.buffer[i]][j].x);

        } // end of for

        preView.lastChild.style.left = xPosition + 'px';
        preView.lastChild.style.top = 0.5 * xInc + 'px';
        //preView.lastChild.style.width = wrapperLength + xInc + 'px';
        //preView.lastChild.style.height = 2*yInc + 'px';

        xPosition += 2 * xInc + wrapperLength;
        wrapperLength = 0;

    }   // end of for




}






function timeAction() {
    // this function runs in --> var timeFlow = setInterval(timeAction,timeInc);    

    if (!paused) {
        timeTick++                      // general use clicker
        tetrisBlink();                  // animates the facial expression. pretty useless.
        boxFall();                      // make tetris fall continually
        integrateBlocks(); }            // integrate tetris into blockPile after some time.

}   // end of timeAction()








function tetrisBlink() {
    // making the tetris piece facial expression blink
    // pretty useless. but I couldn't help myself...

    let interval = 800;                 // time increment between blinks.
    let d = 40;                         // time between eyes open and eyes closed.
    let arr = [ 0 , 0.5*d , d , 1.5*d ];     // blink start time of each blocks scattered.

    if (yMove.check.fallV() == false) {
        let a = timeTick % interval;
        let b = [ ( (a>arr[0]) && (a<(arr[0]+d)) ),
                ( (a>arr[1]) && (a<(arr[1]+d)) ),
                ( (a>arr[2]) && (a<(arr[2]+d)) ),
                ( (a>arr[3]) && (a<(arr[3]+d)) ) ];
        for ( let i = 0 ; i <= 3 ; i++ ) { blockPile[i+numOfBlock.t].innerText = (b[i])? "-__-" : "o__o"; }
    }

}   // end of tetrixBlink()



function decorateTetrisPiece(elem) {
    // Decorates the tetris piece with everything except color and position.
    // Applies to the tetris piece on the board and on the preview block.

    elem.style.fontSize = (0.4 * xInc) + 'px';
    elem.style.color = 'black';
    elem.style.fontWeight = 'bold';
    elem.style.textAlign = 'center';
    elem.style.lineHeight = 2.4;
    //elem.innerText = 'o__o';
        
    elem.style.boxSizing = 'border-box';
    elem.style.border = blockStyle.border;
    elem.style.borderRadius = blockStyle.borderRadius;
    elem.style.boxShadow = blockStyle.boxShadow;

    //elem.style.visibility = 'visible';
            
    elem.style.width = xInc + 'px';
    elem.style.height = yInc + 'px';
        
    //elem.style.position = 'absolute';
        
    //elem.style.left = '0px';               // actually, this doesn't matter...
    //elem.style.top = -yInc + 'px';         // ... cuz this puts it outside the boundary. invisible.


}






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
            //test();
            setPreview();
            break;
        case 'KeyP':
            pauseGame();
            break;
        case 'KeyR':
            restartGame();
            break;
        case 'KeyV':
            yMove.speedUp();
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
            yMove.actual.fallV = yMove.setting.fallV;
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
    // NOT USED right now... Fix this!!!


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
        
        decorateTetrisPiece(p);

        p.style.position = 'absolute';

        p.innerText = '>__<';
        
        //p.style.left = '0px';               // actually, this doesn't matter...
        //p.style.top = -yInc + 'px';         // ... cuz this puts it outside the boundary. invisible.



        toyRoom.appendChild(p); 
    
    }   // end of for loop


}   // end of createTetrisPiece()







function resetTetrisShape() {
    // sets the shape of the tetris piece

    randomMatrix.randomize();
        // This drops the first array item and addes a new random number to the last item of the array.

    for ( let i = 0 ; i <=3 ; i++ ) {
        // give the tetris piece its stating LOCATION and COLOR
        blockPile[i+numOfBlock.t].style.left = t_Forms.arr[randomMatrix.current][i].x + 'px';
        blockPile[i+numOfBlock.t].style.top = t_Forms.arr[randomMatrix.current][i].y + 'px';
        blockPile[i+numOfBlock.t].style.backgroundColor = tetrisColor[randomMatrix.current];
    }

    blockToGhost(translateMatrix.stay);
    if ( !crashFree() ) {
        // If the newly created tetris piece has nowhere to go, it's clearly GAMEOVER!
        // Remember, the crashFree() function tests whether the ghost[] crashes or not.
        // So, yes, you do need to run blockToGhost() first.
        endGame();
    }

    timeTick -= timeTick % yMove.setting.fallV;
        // this prevents the new tetris piece from jumping to the second lane prematurely.

    setPreview();
        // This moves the preview tetris pieces to the left.

}   // end of resetTetrisShape()






function blockToGhost( arr ) {
    // Stores tetris piece data to ghost[].
    // PLUS, applies translation or rotation, depending on the 'arr' array.
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]
    // Typically used with translateMatrix.left, .right, .down, and .stay.
    // ghost[].x and ghost[].y are numbers, NOT strings

    for ( let i = 0 ; i <= 3 ; i++ ) {
        ghost[i].x = pxOff(blockPile[i+numOfBlock.t].style.left) + arr[i].x ;
        ghost[i].y = pxOff(blockPile[i+numOfBlock.t].style.top) + arr[i].y ;
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
    // Checks the entire board to look for rows that are filled up completely.
    // Then the filled up rows are eliminated, and all above blocks are migrated one level lower.
    // Also tallies the score.

    for (let i = 0 ; i < numOfBlock.t ; i += numOfBlock.x ) {
        // Iterates through each ROW.
        // in this case, the 'i' is the first index of each row.
        
        let count = 0;

        for (let j=i; j<i+numOfBlock.x ; j++) { count += (blockPile[j].style.opacity==setOpacity.high) ? 1 : 0; }
            // Counts number of blocks in the row.

        if (count == numOfBlock.x) {
            // Triggers when the row is filled up.

            score.count++;



            let r = 0;
            let t = setInterval(rowSpin,10);
            function rowSpin() {
                // Visually flips the row down.
                r += 4;
                for ( let j = i ; j < i + numOfBlock.x ; j++ ) {
                    blockPile[j].style.transform = "rotateX(" + r + "deg)";
                }
                if ( r > 90 ) {
                    clearInterval(t);
                    for ( let j = i ; j < i+numOfBlock.x ; j++ ) {
                        // after the rotating is done, make the row transparent...
                        // ... then reset the rotation.
                        blockPile[j].style.opacity = setOpacity.low;
                        blockPile[j].style.transform = "rotateX(0deg)";
                    }
                    
                    dropMountain(i);    // 'i' refers to the row that filled up
                }
            }   // end of rowSpin()
        }   // end of if
    }   // end of for

    score.tally();


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

    if (randomMatrix.current==6) { return };
        // don't rotate the square shaped tetris

    blockToGhost(translateMatrix.stay);

    if (randomMatrix.current==0) {
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
        if (ghost[2].y < yInc ) { for ( let i = 0 ; i <= 3 ; i++ ) { ghost[i].y += yInc; }; }
        
        if ( crashFree() ) {
            ghostToBlock();
            return;
        }
    }

}   // end of moveRotate()




function pauseGame() {
    paused = !paused;
    
    for ( let i = 0 ; i <= 3 ; i++ ) { blockPile[i+numOfBlock.t].innerText = "x__x"; }

    if (paused) console.log('paused!'); 
}



function endGame() {
    // sets all of blockPile to low opacity. All except the tetris piece.
    // And pauses the game
    pauseGame();

}


function restartGame() {

    for ( let i = 0 ; i < numOfBlock.t ; i++ ) {
        blockPile[i].style.opacity = setOpacity.low;
    }

    resetTetrisShape();
    tetrisBlink();
    paused = false;
    score.reset();
    yMove.reset();
    

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
                blockPile[ghost[i].ceil()].style.backgroundColor = tetrisColor[randomMatrix.current];
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
// just some math functions and other tools



function RadToDeg(a) { return a * 180 / Math.PI; }


function DegToRad(a) { return a * Math.PI / 180; }


function displayGhost(a) {
    // console displays the provided array.
    // the array has to have this format: [ {x,y}, {x,y}, {x,y}, {x,y} ]
    console.log(`(${a[0].x},${a[0].y}) (${a[1].x},${a[1].y}) (${a[2].x},${a[2].y}) (${a[3].x},${a[3].y})`); }
    // this is just for troubleshooting. I can delete this later.


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
checkRow();                 // after random blocks are generated, check for row completion
createTetrisPiece();        // create the four elements for the tetris block
resetTetrisShape();         // put the tetris piece on the board
//setPreview();               // put preview pieces on the board

//createTitlePage();


// runs continuously
var timeFlow = setInterval(timeAction,timeInc);

// event listeners
document.addEventListener('keydown', keyDownAction);
document.addEventListener('keyup', keyUpAction);





