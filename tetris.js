// JS for tetris

// Notes:
// I intend to work with vanilla JS for now. Need to learn basics first.
// Yep. This entire thing is entirely vanilla. Entirely. Vanilla.
//
// toyRoom is the box in which the game happens. blockPile, tetris piece, and shadow are children.
// blockPile[] contains both the blocks in the background and the tetris piece.
// blockPile[0] to blockPile[numOfBlock.t-1] are the background blocks. They toggle in opacity.
// blockPile[numOfBlock.t] to blockPile[numOfBlock.t+3] are the four blocks forming the TETRIS piece.
// blockPile[numOfBlock.t+4] to blockPile[numOfBlock.t+7] are the SHADOW tetris piece.







// ---------- Declaration Section -------------------------------- //

// DOM elements
    var toyRoom = document.getElementById('toyRoom');   
        var blockPile = toyRoom.children;
    var scoreBoard = document.getElementById('scoreBoard');
        var _points = document.getElementById('points');        // Child to scoreBoard
        var _lines = document.getElementById('lines');          // Child to scoreBoard
        var _speed = document.getElementById('speed');          // Child to scoreBoard
    var preView = document.getElementById('preView');
        preView.style.backgroundImage = "url('sky.jpg')";
    


// SCREEN and BROWSER parameters
    var screen = {  x : window.screen.width,
                    y : window.screen.height,
                    //r : window.devicePixelRatio,
                    t : 0.65 }                      // 't' for 'trim'. Percentage to vertically shrink toyRoom by.
        // screen.t is the percentage of the verical length of screen that we want toyRoom to occupy.
        // I thought that screen.t was necessary to prevent the browser from generating a vertical scroll bar.
        // if the toyRoom is too big, the browser puts on a scroll bar, and this interferes with the up and down button operation.



// GAME MODE variables
    var gameMode = {
        current : 'starting',
        starting : function() { this.current = 'starting'; },
        playing : function() { this.current = 'playing'; },
        paused : function() { this.current = 'paused'; },
        dead : function() { this.current = 'dead'; }
    }







// DIMENSIONS variables
    var numOfBlock = {  x : 8,              // Number of blocks in the horizontal direction.
                        y : 18,             // Number of blocks in the vertical direction.
                        m : 0,              // Starting horizontal location of the tetris piece.
                        t : 0,              // Total number of blocks on the board, minus the tetris piece.
                        initiate : function() { 
                            this.m = Math.floor( this.x / 2 ) - 2;
                            this.t = this.x * this.y; } }
        numOfBlock.initiate();

    var yInc = 4 * Math.ceil( 0.25 * ( screen.y * screen.t ) / numOfBlock.y );
        // The vertical length of a typical block.
        // dividing by 4 and multilying by 4 ensures the half-steps are still integer steps.
    var xInc = yInc;
        // The horizontal length of a typical block.
        // Making these equal to each other defeats the purpose of having a separate value for x and y direction.
        // But I think separating these is just good practice.
    var yDim = yInc * numOfBlock.y;
        // Vertical length of toyRoom.
    var xDim = xInc * numOfBlock.x;
        // Horizontal length of toyRoom.
    var yStep = 0.25 * yInc;
        // Vertical distance travelled by the tetris piece whenever it takes one step.
    var xStep = xInc;
        // Horizontal distance travelled by the tetris piece when it takes one step sideways.
        // This has to be the same as the length of the block. Otherwise, the game will not work.
        toyRoom.style.height = yDim + 'px';
        toyRoom.style.width = xDim + 'px';
            // making toyRoom fit the screen vertically
        preView.style.height = 3 * yInc + 'px';
            //scoreBoard.style.width = '300px';



// APPEARANCE settings
    var blockStyle = {
        bkgdColor : 'rgba(50, 150, 250, 0.3)' ,         // Nothing uses this right now.
        border : '1px solid rgba(0, 0, 0, 1)' ,
        boxShadow : '0px 0px 5px 0px inset white' ,
        borderRadius : '15%' ,
        opacity : 1 }         // This determines the opacity of the tetris background color, NOT the whole tetris piece.

    var tetrisColor = [];
        tetrisColor[0] = `rgba(250, 250, 250, ${blockStyle.opacity})`;
        tetrisColor[1] = `rgba(250, 000, 000, ${blockStyle.opacity})`;
        tetrisColor[2] = `rgba(000, 000, 250, ${blockStyle.opacity})`;
        tetrisColor[3] = `rgba(250, 250, 000, ${blockStyle.opacity})`;
        tetrisColor[4] = `rgba(000, 250, 000, ${blockStyle.opacity})`;
        tetrisColor[5] = `rgba(150, 050, 250, ${blockStyle.opacity})`;
        tetrisColor[6] = `rgba(000, 000, 000, ${blockStyle.opacity})`;

    var setOpacity = {  low : 0,        // Low setting of opacity. 
                        high : 1,       // High setting of opacity.
                        flip : function(num) {return (num == this.low) ? this.high : this.low;} };



// TIME settings
    var timeInc = 5;                // Time interval used in timeFlow.[ms]
    var timeTick = 0;               // Time counter in setInterval in actByTime()
    var count = {   set : { stagnant : 150,             // How long tetris piece should wait until it integrates into the pile
                            limit    : 800 },           // Absolute limit for how long to wait until integration
                    stagnant : 0,                       // How long tetris piece has been stagnant right now
                    limit : 0,                          // How long tetris piece has been stagnant, regardless of movement
                    keyReleased : false,                // Did keyup event with ArrowDown happen?
                    reset : function() { this.stagnant = 0; },                          // Resets stagnant
                    resetlimit : function() { this.limit = 0; },                        // Resets limit
                    fill : function() { this.stagnant = this.set.stagnant; } };         // Times up!



// MOVEMENT settings
    var yMove = {
        v_Low : 5,              // Lowest speed setting. Does not change.
        v_High : 1000,          // Highest speed setting. Does not change.
        v_Inc : 5,              // Increments of speed change. Does not change.
        v_mid : 0,                  // Falling speed that changes over the course of the game.
        v_fall : 0,                 // If the tetris piece is falling, this is equal to v_mid. Otherwise, zero.
        v_drop : 0,                 // If the tetris piece is dropping, this is equal to v_High. Otherwise, v_fall.
        show : function() { _speed.innerText = this.v_drop; },
        update : function() {
                this.v_fall = (this.v_fall==0) ? 0 : this.v_mid;
                this.v_drop = (this.v_drop==this.v_High) ? this.v_High : this.v_fall; },
        flip : function() {
                this.v_fall = (this.v_fall==0) ? this.v_mid : 0;
                this.update();
                this.show(); },
        press : function() {
                addFace('>__<');
                this.v_drop = this.v_High;
                this.v_fall = this.v_mid;
                this.show(); },
        release : function() {
                addFace('o__o');
                this.v_drop = this.v_fall;
                this.show(); },
        speedUp : function() {
                this.v_mid += ( (this.v_mid + this.v_Inc) > this.v_High) ? 0 : this.v_Inc;
                this.update();
                this.show(); },
        reset : function() {
                this.v_mid = this.v_Low;
                this.v_fall = this.v_mid;
                this.v_drop = this.v_fall;
                this.show(); },
        calc : function() { return parseInt(1000 * yStep / timeInc / this.v_drop ); },
        demand : function() {
            // The falling motion of the tetris piece happens in the tempo of the actByTime() function, which repeats itself...
            // ... at an interval of timeInc microseconds.
            // So, a slow moving tetris piece will do nothing, for example, for 99 iterations of actByTime(), and then on the...
            // ... 100th iteration it will move down one step. Then repeat for the next 100 iterations. Etc.
            // A fast moving tetris piece will do nothing, for example, for 19 iterations of actByTime(), and then on the...
            // ... 20th iteration it will move down one step. Then repeat.
            // yMove.demand is always called from inside actByTime(). It yields true if it is time to move down one step.
            if (this.v_drop!=0) { return ( (timeTick % this.calc() ) == 0 ) ? true : false; }
            return false; } };
        yMove.reset();
        



// GAME SCORE settings
    var score = {
        unit : 100,             // The score goes up by this increment, multiplied by bonus multipliers.
        total: 0,               // The total score for one game.
        top : 0,                // The top score over all games played.
        count : 0,              // Number of rows completed THIS ROUND.
        next : 1,               // Complete this many lines to speed up.
        countTotal : 0,         // TOTAL number of rows completed in game.
        bonus : [ 0 , 1 , 1.25 , 1.5 , 2 ],     // The bonus multipliers.
        tally : function() {
            this.total += this.unit * this.count * this.bonus[this.count];
            this.countTotal += this.count;
            this.count = 0;
            yMove.v_mid = yMove.v_Low + (yMove.v_Inc * parseInt(this.countTotal/this.next));
            yMove.update();
            yMove.show();
            _points.innerText = this.total; 
            _lines.innerText = this.countTotal; },
        update : function() { this.top = Math.max(this.top, this.total); },
        reset : function() {
            this.count = 0;
            this.total = 0;
            this.countTotal = 0;
            _points.innerText = this.total;
            _lines.innerText = this.countTotal; } };


    

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
        slideDistance : 0 ,
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
        5 ,      // likelihood of the Long Bar tetris piece appearing
        3 ,      // likelihood of the inverse 'L' shape
        3 ,      // likelihood of the 'L' shape
        3 ,      // likelihood of the inverse'Z' shape
        3 ,      // likelihood of the 'Z' shape
        5 ,      // likelihood of the 'T' shape
        1];     // likelihood of the Square shape

    var randomMatrix = {
        // Object that contains the array of probability of each shape.
        // Contains method 'populate' for reconfiguring the probability when the tetrisChance array is modified.
        // For example, if tetrisChance[0] is 7, then the first 7 items in randomMatrix is 0.
        // If tetrisChance[1] is 4, then the next 4 items in randomMatrix is 1.
        matrix : [],                // Array containing the t_Forms.arr[] in quantities that correspond to the probabilites.
        max : 6,                    // length of the buffer array.
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
                 //console.log(this.buffer);
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
        applyScalar : function() {
            for ( let i = 0 ; i <=3 ; i++ ) {
                translateMatrix.left[i].x *= xStep;              // length of side step
                translateMatrix.right[i].x *= xStep;             // length of side step
                translateMatrix.down[i].y *= yStep; }        // length of downward step
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





    









// ---------- FUNCTIONS ------------------------------------------ //



function openTitlePage() {
    // This is the first thing that users see when they open this website.

    gameMode.current = 'nothing';           // Disables key input
    
    score.top = sessionStorage.getItem('topScore');
    

    toyRoom.style.textAlign = 'center';
    toyRoom.style.lineHeight = 4;
    toyRoom.style.fontFamily = 'snes';
    toyRoom.style.fontSize = '90pt';
    
    toyRoom.innerText = 'TETRIS\n';

    var t = setTimeout( () => {
        toyRoom.style.lineHeight = 20;
        toyRoom.style.fontSize = '20pt';
        toyRoom.innerText = 'press any key';
        // var p = createElement('p');
        //     p.style.fontFamily = 'calibri';
        //     p.style.fontSize = '12pt';
        //     p.innerText = 'press any key';
        // toyRoom.appendChild(p);
        gameMode.starting();
    } , 1000);


    

    

}




function closeTitlePage() {

    // toyRoom.style.textAlign = 'left';
    toyRoom.style.fontFamily = 'calibri';
    toyRoom.innerText = '';

}


function startGame() {

    configureToyRoom();
    createBlockPile();
    createTetrisPiece();        // Create the four elements for the tetris block
    createShadow();             // Creates the shadow of the tetris piece.
    createPauseSign();
    resetGame();

    // Runs continuously
    var timeFlow = setInterval(actByTime,timeInc);

}







function configureToyRoom() {
    toyRoom.style.backgroundImage = "url('sky.jpg')";
    toyRoom.style.backgroundColor = '#DEF';                 // Does this even matter?
    toyRoom.style.zIndex = 0;
    // toyRoom.style.display = 'inline-table';                 // This is to vertically center the Pause Sign.
}









function createBlockPile() {
    // Fills toyRoom with blocks. All blocks are set to low opacity initially.
    // The opacity setting is what I use to make the block 'exist' or not.
    // Although the tetris piece and the shadow piece will be included in the blockPile array later...
    // ...the tetris piece and shadow piece are not included in this function.

    for ( let i = 0 ; i < numOfBlock.t ; i++ ) {
        var p = document.createElement('div');
            styleTetrisPiece(p);
            p.style.cursor = 'pointer';             // Not necessary. But not bad either.
            p.style.opacity = setOpacity.low;       // Low opacity means the tetris piece does not bump into it.
            p.style.cssFloat = 'left';              // Float lets the pieces line themselves up effortlessly.
            p.style.position = 'relative';
            p.style.transformOrigin = '50% 100%';   // This is necessary for the animation when the row is completed.
        toyRoom.appendChild(p);
        toyRoom.lastChild.onclick = function() {
            this.style.opacity = setOpacity.flip(this.style.opacity);
            checkRow();
        }   // end of onclick
    }   // end of for loop
}   // end of createBlockPile()








function createTetrisPiece() {
    // Creates the four blocks of the tetris piece.
    // But the shape is not initiated. The shape should be initiated by a different function.
    // CreateTetrisPiece() should be run only once, at the beginning.
    // This function also kickstarts the randomMatrix. It runs the randomMatrix randomize method several times...
    // ...until all of its array items are randomly generated.

    randomMatrix.randomize(randomMatrix.max);

    for ( let i = 0 ; i <=3 ; i++ ) {
        var p = document.createElement('div');
            styleTetrisPiece(p);
            p.style.position = 'absolute';
            p.innerText = 'o__o';
        toyRoom.appendChild(p); 
    }   // end of for loop
}   // end of createTetrisPiece()







function resetTetrisPiece() {
    // Resets the tetris piece back to the top. Also gives it a new random shape.
    addFace('o__o');
    randomMatrix.randomize();
        // This drops the first array item of randomMatrix.buffer[].
        // Then it adds a new random number to the last item of randomMatrix.buffer[].
    for ( let i = 0 ; i <=3 ; i++ ) {
        // Gives the tetris piece its stating LOCATION and COLOR
        blockPile[i+numOfBlock.t].style.left = t_Forms.arr[randomMatrix.current][i].x + 'px';
        blockPile[i+numOfBlock.t].style.top = t_Forms.arr[randomMatrix.current][i].y + 'px';
        blockPile[i+numOfBlock.t].style.backgroundColor = tetrisColor[randomMatrix.current];
    }
    blockToGhost(translateMatrix.stay);
    if ( !IsCrashFree() ) {
        // If the newly created tetris piece has nowhere to go, it's clearly GAMEOVER!
        // Remember, the IsCrashFree() function tests whether the ghost[] crashes or not.
        // So, yes, you do need to run blockToGhost() first.
        endGame();
    }
    timeTick -= timeTick % yMove.calc();
        // This prevents the new tetris piece from jumping to the second lane prematurely.
        // yMove.calc() calculates the time interval that corresponds to the tetris piece speed.
    castShadow();
    resetPreview();
}   // end of resetTetrisPiece()





function styleTetrisPiece(elem) {
    // Decorates the element with text settings, border, radius, and sizing.
    // This function is used for the tetris piece on the board and on the preview tetris piece.
    // Background color and position are not included.

    elem.style.fontSize = (0.4 * xInc) + 'px';
    elem.style.color = 'black';
    elem.style.fontWeight = 'bold';
    elem.style.textAlign = 'center';
    elem.style.lineHeight = 2.4;
        
    elem.style.boxSizing = 'border-box';
    elem.style.border = blockStyle.border;
    elem.style.borderRadius = blockStyle.borderRadius;
    elem.style.boxShadow = blockStyle.boxShadow;

    elem.style.width = xInc + 'px';
    elem.style.height = yInc + 'px';
}   // end of styleTetrisPiece()






function blinkTetrisPiece() {
    // Makes the tetris piece facial expression blink
    // Pretty useless. But I couldn't help myself...

    let interval = 800;                     // Time increment between blinks.
    let d = 40;                             // Time between eyes open and eyes closed.
    let arr = [ 0 , 0.5*d , d , 1.5*d ];    // Blink start time of each blocks scattered.

    if (yMove.v_drop == 0) {
        let a = timeTick % interval;
        let b = [ ( (a>arr[0]) && (a<(arr[0]+d)) ),
                ( (a>arr[1]) && (a<(arr[1]+d)) ),
                ( (a>arr[2]) && (a<(arr[2]+d)) ),
                ( (a>arr[3]) && (a<(arr[3]+d)) ) ];
        for ( let i = 0 ; i <= 3 ; i++ ) { blockPile[i+numOfBlock.t].innerText = (b[i])? "-__-" : "o__o"; }
    }
}   // end of blinkTetrisPiece()





function mergeTetrisPiece() {
    // Integrates tetris piece into the blockPile.
    // Afterward, it calls the resetTetrisPiece() function.
    // It also calls the slidePreview() function.

    blockToGhost(translateMatrix.down);
    let onSolidGround = !IsCrashFree();
        // This confirms that the tetris piece has made contact with a level surface.
        // To check this, a ghost that is one yInc lower had to be generated.
    
    blockToGhost(translateMatrix.stay);
        // This reassigns the ghost to have the identical position as the tetris piece itself.

    if ( ( ghost[0].floor() == ghost[0].ceil() ) && (yMove.v_fall != 0 ) && onSolidGround ) {
        // Checks for several conditions:
        // (1) Is the block aligned to the grid? If it is, ghost[].floor() would equal ghost[].ceil().
        // (2) Is there a call for the tetris piece to keep falling? If not, there's no reason to integrate.
        // (3) Is the block actually touching the floor? If so, onSolidGround would be true.
        // These three conditions merely start the timer for integration. These are not yet enough to integrate.
        // If these conditions are kept up for some time, then the integration happens.
        
        if ( count.stagnant > 4 ) {
            // Makes the tetris blocks display a number that counts to 10, instead of that stupid face.
            // The number 4 here is arbitrary. It just has to be a low number.
            // I put the 4 here because otherwise the stupid face is interrupted at unfortunate times.

            if ( count.limit < (count.set.limit - count.set.stagnant + 5 ) ) {
                // This checks whether the counter is still well under the absolute time limit.
                // The number 5 here is also arbitrary...
                // The counter counts backward from 10 to 1.
                for ( let i=0 ; i<=3 ; i++ ) { 
                    blockPile[i+numOfBlock.t].innerText = 11 - Math.ceil( count.stagnant / (count.set.stagnant / 10) ); 
                }
            } else {
                // This else condition is met if the counter is close to the absolute time limit.
                // The counter counts backward from 10 to 1.
                for ( let i=0 ; i<=3 ; i++ ) { 
                    blockPile[i+numOfBlock.t].innerText = 11 - Math.ceil( ( count.limit - count.set.limit + count.set.stagnant ) / (count.set.stagnant / 10) ); 
                }
            }
        }
        
        document.addEventListener('keyup', (ev) => { count.keyReleased = true; } );
        document.addEventListener('keydown', (ev) => { 
            if ( (ev.code=='ArrowDown') && count.keyReleased ) { count.fill(); };
            count.keyReleased = false;
            } );
            // Checks for two things: (1) key release, and (2) the ArrowDown key being pressed.
            // When these conditions are met, it instantly bypasses the countdown.

        if ( count.stagnant == count.set.stagnant ) {
            // Integrates the tetris piece after the time runs out.
            // Then, resets to new tetris piece. 
            // Also checks for any full rows. Then the counter is reset back to zero.
            addFace('o__o');
                // Gives tetris a face when reset to top.
            for ( let i=0 ; i<=3 ; i++ ) { 
                // Integrated block has high opacity and color.
                blockPile[ghost[i].ceil()].style.opacity = setOpacity.high; 
                blockPile[ghost[i].ceil()].style.backgroundColor = tetrisColor[randomMatrix.current];
            }
            timeTick -= timeTick % yMove.calc();    // Prevents new tetris piece from jumping to second lane prematurely.
            resetTetrisPiece();
            slidePreview();
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

}   // end of mergeTetrisPiece()






function addFace(text) {
    for ( let i = 0 ; i <= 3 ; i++ ) { blockPile[i+numOfBlock.t].innerText = text; }; 
}







function createShadow() {
    // This function creates the shadowy tetris piece that shows where the real tetris piece would end up...
    // ... if the player allowed the tetris piece to drop.
    // The shadow will simply be the next four elements in the toyRoom, after the four elements of the tetris piece.

    for ( let i = 0 ; i <= 3 ; i++ ) {
        var p = document.createElement('div');
            p.style.boxSizing = 'border-box';
            // p.style.borderRadius = '2px';
            p.style.borderRadius = blockStyle.borderRadius;
            //p.style.backgroundColor = '#0002';
            p.style.backgroundColor = '#000';
            p.style.width = xInc + 'px';
            p.style.height = yInc + 'px';
            p.style.position = 'absolute';
            p.style.zIndex = -1;
            p.style.left = '0px';
            p.style.top = -yInc + 'px';
        toyRoom.appendChild(p);
    }   // end of for
}   // end of createShadoe()





function castShadow() {
    // Puts the shadow on the board where the tetris piece would be if it dropped straight down.
    blockToGhost(translateMatrix.stay);
    do {
        ghostToShadow();
        ghostToGhost(translateMatrix.down);
    } while ( IsCrashFree() );

    let a = pxOff(blockPile[4+numOfBlock.t].style.top) - pxOff(blockPile[numOfBlock.t].style.top);
    a = (yDim-a)/yDim;
    for ( let i = 4 + numOfBlock.t ; i <= 7 + numOfBlock.t ; i++ ) {
        blockPile[i].style.opacity = 0.15 * (1 + a);
    }
}   // end of castShadow()








function createPauseSign() {
    // Creates the PAUSE sign. 
    // This function has to run AFTER blockPile has been assigned to the board, tetris, and shadow already.
    // Can be used for Game Over too?

    var p = document.createElement('div');
        p.style.position = 'absolute';              // The text doesn't appear on screen if this is 'relative'.
        p.style.left = 0.1 * xDim + 'px';
        p.style.width = 0.8 * xDim + 'px';
        // p.style.height = 0.2 * xDim + 'px';
        p.style.boxSizing = 'border-box';
        p.style.backgroundColor = '#FFF';
        p.style.borderRadius = '10px';
        p.style.border = '5px solid black';
        p.style.color = '#000';
        p.style.lineHeight = 0.15 * xDim + 'px';
        p.style.fontSize = 0.14 * xDim + 'px';
        p.style.textAlign = 'center';
        // p.innerText = 'PAUSED';
    toyRoom.appendChild(p); 

    togglePauseSign('off');                  // This initiates the position to outside the frame.
}   // end of createPauseSign()





function togglePauseSign(text) {
    let a = yDim + 'px';
    let b = 0.4 * yDim + 'px';
    
    blockPile[8+numOfBlock.t].innerText = 'PAUSED';
    blockPile[8+numOfBlock.t].style.top = (text=='on') ? b : a;

}



function toggleGameOverSign(text) {
    // This reuses the Pause Sign, rewrite it as 'Game Over', and makes it pop up.
    let a = yDim + 'px';
    let b = 0.4 * yDim + 'px';
    let c = 0;
    let d;
    let interval;

    blockPile[8+numOfBlock.t].innerText = 'GAME OVER';
    blockPile[8+numOfBlock.t].style.top = (text=='on') ? b : a;

    if (score.total < 1000) {
        d = 1;
        interval = 1000 / score.total;
        var t = setInterval( function() {
            blockPile[8+numOfBlock.t].innerText = 'GAMEOVER\nScore: ' + c + '\nBest: ' + score.top;
            if (c==score.total) {
                clearInterval(t);
            }
            c += d;
        } , interval);
    } else {
        d = 50;
        interval = d * 1000 / score.total;
        var t = setInterval( function() {
            blockPile[8+numOfBlock.t].innerText = 'GAMEOVER\nScore: ' + c + '\nBest: ' + score.top;
            if (c==score.total) {
                clearInterval(t);
            }
            c += d;
        } , interval);
    } 
    
}



function resetPreview() {
    // This function fills the 'preView' element with the preview tetris pieces.
    // Before showing the preview tetris pieces, this function creates children elements to the...
    // ... 'preView' elements that serves as 'wrappers' for the tetris pieces.
    // Each tetris piece is inside an invisible 'wrapper'.
    // Note to self: this function is a bit clunky. Think about it!!!

    for ( let i = 0 ; i < randomMatrix.max ; i++ ) {
        // Removing existing wrappers to make room for new wrappers.
        // It's a bit overkill, but it does prevent misalignment from adding up over along time.
        if (preView.hasChildNodes()==true) { preView.removeChild(preView.lastChild); }
    }

    let wrapperLength;                  // Hypothetical horizontal length of the 'wrapper' element
    let gapDistance = 0.2 * xInc;       // Distance between 'wrappers'.
    let xPosition = gapDistance;        // Horizontal position of the 'wrappers'.

    for ( let i = 0 ; i < randomMatrix.max ; i++ ) {
        // Creating the 'wrappers'
        wrapperLength = 0;
        var p = document.createElement('div');            
            p.style.position = 'relative';
            p.style.opacity = (randomMatrix.max - i) / randomMatrix.max;
        preView.appendChild(p);

        for ( let j = 0 ; j <= 3 ; j++ ) { 
            // Creating the preview tetris piece inside the wrapper.
            var p = document.createElement('div');    
                styleTetrisPiece(p);
                p.style.position = 'absolute';
                p.style.backgroundColor = tetrisColor[ randomMatrix.buffer[i] ];
                p.style.left = p_Forms.arr[randomMatrix.buffer[i]][j].x + 'px';
                p.style.top = p_Forms.arr[randomMatrix.buffer[i]][j].y + 'px';
            preView.lastChild.appendChild(p);
            wrapperLength = Math.max(wrapperLength , p_Forms.arr[randomMatrix.buffer[i]][j].x + xInc );
        } // end of for

        if (i==0) p_Forms.slideDistance = gapDistance + wrapperLength; 
            // p_Forms.slideDistance is used by slidePreview()
        preView.lastChild.style.left = xPosition + 'px';
        preView.lastChild.style.top = 0.5 * yInc + 'px';
        xPosition += gapDistance + wrapperLength;
    }   // end of for
}   // end of resetPreview()







function slidePreview() {
    // Moves all children of preView to the left.
    // It stops moving when the first element is completely hidden beyond the left boundary.
    // This function does not actually remove any element. Should it?

    let stepInc = 0.1 * xInc;           // Step Increment. Length of each step toward left.
    let stepTotal = 0;                  // Step Total. The total length travelled left.
    let c = preView.childNodes;         // This is an array with the child elements in it. So, it's c[].
    
    var t = setInterval( () => { 
            stepTotal += stepInc;
            for ( let i = 0 ; i < randomMatrix.max ; i++ ) { 
                c[i].style.left = pxOff(c[i].style.left) - stepInc + 'px';
            }
            if ( stepTotal >= p_Forms.slideDistance ) clearInterval(t); } , 5);
}   // end of slidePreview()








function actByTime() {
    // This function runs in --> var timeFlow = setInterval(actByTime,timeInc);    


    switch (gameMode.current) {
        case 'starting':
            break;
        case 'playing':
            timeTick++                       // General use clicker.
                console.log(timeTick);
            blinkTetrisPiece();              // Animates the facial expression. pretty useless.
            moveDown();                      // Make tetris fall continually.
            mergeTetrisPiece();              // Integrate tetris into blockPile after some time.
            break;
        case 'paused':
            break;
        case 'dead':
            break;
        default:
            break;
    }
    
}   // end of actByTime()



















function actByKeyDown(ev) {
    

    if (gameMode.current=='starting') {
        // switch (ev.code) {
        //     case 'KeyA':    
        //                     break;
        //     default:        break; } 
        
        gameMode.playing();
        closeTitlePage();
        startGame();
        
        }
    else if (gameMode.current=='playing') {
        switch (ev.code) {
            case 'KeyA':    moveRotate('left');
                            break;
            case 'KeyS':    moveRotate('right');
                            break;
            case 'KeyN':    resetTetrisPiece();
                            slidePreview();
                            break;
            case 'Space':   break;
            case 'KeyF':    yMove.flip();         // toggles whether tetris slowly falls or not
                            break;
            case 'KeyT':    endGame();              // This is just a test.
                            break;
            case 'KeyP':    pauseGame('on');
                            break;
            case 'KeyR':    score.total += 100;
                            break;
            case 'KeyV':    //yMove.speedUp();
                            //createShadow();
                            break;
            case 'ArrowLeft':       count.reset();              // resets the counter for integrateBlock()
                                    moveLeftRight(translateMatrix.left);
                                    break;
            case 'ArrowRight':      count.reset();              // resets the counter for intergrateBlock()
                                    moveLeftRight(translateMatrix.right);
                                    break;
            case 'ArrowUp':         moveRotate('left');
                                    break;
            case 'ArrowDown':       yMove.press();         // accelerates falling speed
                                    //yMove.act.fallInt = yMove.calc(yMove.set.speed);
                                    break;
            default:        break; } }

    else if (gameMode.current=='paused') {
        switch (ev.code) {
            case 'KeyP':    pauseGame('off');
                            yMove.release();        // This fixes the glitch where the speed gets stuck if you pause while dropping.
                            break;
            default:        break; } }

    else if (gameMode.current=='dead') {
        // resetGame();
        window.location.reload(true);
    
    }



}   // end of actByKeyDown()







function actByKeyUp(ev) {    
    

    
    if (gameMode.current=='starting') {
        switch (ev.code) {
            case 'KeyA':    break;
            default:        break; } }
    
    else if (gameMode.current=='playing') {
        switch (ev.code) {
            case 'ArrowUp':     break;
            case 'ArrowDown':   yMove.release();
                                break;
            default:            break; } }

    else if (gameMode.current=='paused') {
        switch (ev.code) {
            case 'KeyA':    break;
            default:        break; } }

    else if (gameMode.current=='dead') {
        switch (ev.code) {
            case 'KeyA':    break;
            default:        break; } }

}   // end of actByKeyUp()






function moveDown() {
    // Makes the tetris piece fall slowly, if there is a demand for the tetris piece to fall.
    // Includes both natural falling and manual dropping.
    // Before applying the new coordinates, checks for collision first using ghost.
    if ( yMove.demand() ) {
        blockToGhost(translateMatrix.down);
        if (IsCrashFree()) {
            ghostToBlock();
            addFace('>__<');
        }
    }
    castShadow();
}   // end of moveDown()







function moveLeftRight(arr) {
    // Moves box left or right depending on xStep.
    // arr is expected to have the format [{x,y}, {x,y}, {x,y}, {x,y}]
    // Copy the tetris piece coordinate info to ghost. then check ghost for collision.
    // If no collision, then move the ghost data back to blockPile.
    blockToGhost(arr);
    if (IsCrashFree()) ghostToBlock();
    castShadow();
}   // end of moveLeftRight()







function moveRotate(text) {
    // Rotates tetris piece clockwise or counterclockwise.
    // If text is 'left', rotate counterclockwise.
    // If text is 'right', rotate clockwise.

    let rotA = (text=='left') ? -Math.PI/2 : Math.PI/2;
    let arr = { x:0 , y:0 };        // The coordinates to pivot around.
    let pivot = 1;                  // The index for the pivot block.

    if (randomMatrix.current==6) { return };        // Don't rotate the SQUARE tetris!
    blockToGhost(translateMatrix.stay);

    if (randomMatrix.current==0) {
        // Change the pivot coordinate if the tetris piece is the LONG BAR.
        longBarPivot.calc( ghost[0].x, ghost[0].y, ghost[3].x, ghost[3].y );
        arr.x = longBarPivot.x;
        arr.y = longBarPivot.y;
    } else {
        // For all other tetris piece shapes, just use one of the middle blocks as pivot.
        arr.x = ghost[pivot].x;
        arr.y = ghost[pivot].y;
    }   // end of if-else

    for ( let i = 0 ; i <= 3 ; i++ ) {
        // Put the rotated positions into the ghost object.
        rotateP.calc( arr.x , arr.y , ghost[i].x , ghost[i].y , rotA );
        ghost[i].x = rotateP.xNew;
        ghost[i].y = rotateP.yNew;           
    }
    
    if ( IsCrashFree() ) { 
        // This is where we crash-test the rotated position using the ghost object.
        // If it passes the test, copy the positions into the actual tetris piece.
        ghostToBlock(); 
        castShadow();
        return;
    } else {
        // This is the SECOND CHANCE function.
        // If the rotation failed because the tetris piece was too close to the wall...
        // ... this else statement will scoot it over once and try again.
        if (ghost[1].x == 0) { for ( let i = 0 ; i <= 3 ; i++ ) { ghost[i].x += xInc; }; }
            // SECOND CHANCE condition #1: is it too close to the left wall?
        if (ghost[1].x == (xDim-xInc) ) { for ( let i = 0 ; i <= 3 ; i++ ) { ghost[i].x -= xInc; }; }
            // SECOND CHANCE condition #2: is it too close to the right wall?
        if (ghost[2].y < yInc ) { for ( let i = 0 ; i <= 3 ; i++ ) { ghost[i].y += yInc; }; }
            // SECOND CHANCE condition #3: is it too close to the ceiling?
        if ( IsCrashFree() ) {
            ghostToBlock();
            castShadow();
            return;
        }
    }   // end of if-else
}   // end of moveRotate()































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




function ghostToGhost( arr ) {
    for ( let i = 0 ; i <= 3 ; i++ ) {
        ghost[i].x = ghost[i].x + arr[i].x ;
        ghost[i].y = ghost[i].y + arr[i].y ;
    }
}   // end of ghostToGhost()



function ghostToShadow() {
    for ( let i = 0 ; i <= 3 ; i++ ) {
        blockPile[4+i+numOfBlock.t].style.left = ghost[i].x + 'px';
        blockPile[4+i+numOfBlock.t].style.top = ghost[i].y + 'px';
    }
}   // end of ghostToShadow()









function checkRow() {
    // Checks the entire board to look for rows that are filled up completely.
    // Then the filled up rows are eliminated, and all above blocks are migrated one level lower.
    // Also tallies the score.

    for (let i = 0 ; i < numOfBlock.t ; i += numOfBlock.x ) {
        // Iterates through each ROW.
        // in this case, the 'i' is the first index of each row.
        let count = 0;
        for (let j=i; j<i+numOfBlock.x ; j++) { count += (blockPile[j].style.opacity==setOpacity.high) ? 1 : 0; }
        if (count == numOfBlock.x) {
            // Triggers when the row is filled up.
            score.count++;
            let r = 0;
            let t = setInterval(rowSpin,10);
            function rowSpin() {
                // Visually flips the row down.
                
                r += 4;         // Determines how quickly the blocks rotate.

                for ( let j = i ; j < i + numOfBlock.x ; j++ ) { blockPile[j].style.transform = "rotateX(" + r + "deg)"; }
                if ( r > 90 ) {
                    clearInterval(t);
                    for ( let j = i ; j < i+numOfBlock.x ; j++ ) {
                        // After the rotating is done, make the row transparent...
                        // ... then reset the rotation.
                        blockPile[j].style.opacity = setOpacity.low;
                        blockPile[j].style.transform = "rotateX(0deg)";
                    }
                    dropRow(i);    // 'i' refers to the row that filled up
                }   // end of if
            }   // end of rowSpin()
        }   // end of if
    }   // end of for
    score.tally();
}   // end of checkRow()








function dropRow(filledRow) {
    // From the filled row up, drop the pile of blocks.
    for ( let i = filledRow ; i >= numOfBlock.x ; i -= numOfBlock.x ) {
        for ( let j = i ; j < i+numOfBlock.x ; j++ ) {
            blockPile[j].style.opacity = blockPile[j-numOfBlock.x].style.opacity;
            blockPile[j].style.backgroundColor = blockPile[j-numOfBlock.x].style.backgroundColor;
        }
    }
    for ( let k = 0 ; k < numOfBlock.x ; k++ ) blockPile[k].style.opacity = setOpacity.low;
    castShadow();
}   // end of dropRow()













function pauseGame(text) {
    // Toggles the 'paused' boolean. Toggles Pause Sign.
    // Disables many of the game functions.
    // Changes tetris piece face expression.
    (gameMode.current != 'paused') ? gameMode.paused() : gameMode.playing();
    togglePauseSign(text);
    (gameMode.current=='paused') ? addFace('x__x') : addFace('o__o');
}



function endGame() {
    addFace('x__x');
    score.update();
    
    
    sessionStorage.setItem('topScore',score.top);

    

    toggleGameOverSign('on');
    gameMode.dead();

    
}


function resetGame() {

    for ( let i = 0 ; i < numOfBlock.t ; i++ ) {
        blockPile[i].style.opacity = setOpacity.low;
    }
    
    // window.location.reload(true);

    randomMatrix.randomize(randomMatrix.max);
    resetTetrisPiece();
    slidePreview();
    
    gameMode.playing();
    toggleGameOverSign('off');
    score.reset();
    yMove.reset();
    timeTick = 0;
}









function IsCrashFree() {
    // (1) compares the GHOST[] to wall.left, wall.right, and wall.floor.
    // (2) compares ghost[] to blockPile[] with opacity at setOpacity.high
    // Yields TRUE if no collisions.
    // This function requires that the block is perfectly aligned with the columns. Otherwise, ghost[i].floor will not work.

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
}   // end of IsCrashFree()

















// ---------------------- SHORTCUT FUNCTIONS --------------------------- //
// just some math functions and other general use functions.


function RadToDeg(a) { return a * 180 / Math.PI; }

function DegToRad(a) { return a * Math.PI / 180; }

function displayGhost(a) {
    // The console displays the provided array.
    // The array has to have this format: [ {x,y}, {x,y}, {x,y}, {x,y} ]
    console.log(`(${a[0].x},${a[0].y}) (${a[1].x},${a[1].y}) (${a[2].x},${a[2].y}) (${a[3].x},${a[3].y})`); }

function arrayAddMultiply(arr, xAdd, xMul, yAdd, yMul) {
    // Assumes arr is an array of {x,y} objects.
    // Adds xAdd to every x value, then multiplies every x value by xMul.
    // Adds yAdd to every y value, then multiplies every y value by yMul.
    for ( let i = 0 ; i < arr.length ; i++ ) {
        arr[i].x += xAdd;
        arr[i].x *= xMul;
        arr[i].y += yAdd;
        arr[i].y *= yMul; } }

function pxOff(text) { return eval( text.substring(0, text.length - 2) ) };
        












// ----------------- MAIN BODY ----------------------------------------- //


// Before the game starts...

// Event listeners
document.addEventListener('keydown', actByKeyDown);
document.addEventListener('keyup', actByKeyUp);


openTitlePage();

    // configureToyRoom();
    // createBlockPile();
    // createTetrisPiece();        // Create the four elements for the tetris block
    // createShadow();             // Creates the shadow of the tetris piece.
    // createPauseSign();
    // resetGame();

    // // Runs continuously
    // var timeFlow = setInterval(actByTime,timeInc);

