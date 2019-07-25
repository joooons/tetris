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
var moveButtons = document.getElementById('controller');


// booleans
var boxFalling = true;         // toggle to let box fall


// dimension variables
var xDim = toyRoom.offsetWidth;
var yDim = toyRoom.offsetHeight;
var xInc = xDim / 10;           // box size in x direction
var yInc = yDim / 20;           // box size in y direction. basically same as xInc


// color settings
var blockBackgroundColor = '#5AF';
var blockBoxShadow = '0px 0px 5px 0px inset blue';
var tetrisBackgroundColor = 'rgba(100, 130, 250, 0.1)';
var tetrisBoxShadow = '-2px -2px 9px 0px #05A inset';


// other settings
var timeInc = 100;              // used in 'var timeFlow'
var timeTick = 0;               // timeTick++ in timeAction()
var stepY = 0;                  // negative to move up, positive to move down
var setOpacity = { 
    low : 0.2 , 
    high : 1 ,
    flip : function(num) {return (num == this.low) ? this.high : this.low;}
};


// complex object definitions
var tetrisForms = [];
    tetrisForms[0] = [ {x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:4, y:3} ];    // long bar
    tetrisForms[1] = [ {x:5, y:0}, {x:5, y:1}, {x:5, y:2}, {x:4, y:2} ];    // inverse 'L'
    tetrisForms[2] = [ {x:4, y:0}, {x:4, y:1}, {x:4, y:2}, {x:5, y:2} ];    // 'L' shape
    tetrisForms[3] = [ {x:4, y:0}, {x:4, y:1}, {x:5, y:1}, {x:5, y:2} ];    // 'S' shape
    tetrisForms[4] = [ {x:5, y:0}, {x:5, y:1}, {x:4, y:1}, {x:4, y:2} ];    // 'Z' shape
    tetrisForms[5] = [ {x:5, y:0}, {x:5, y:1}, {x:4, y:1}, {x:5, y:2} ];    // 'T' tilted right
    tetrisForms[6] = [ {x:4, y:0}, {x:4, y:1}, {x:5, y:1}, {x:4, y:2} ];    // 'T' tilted left
    tetrisForms[7] = [ {x:4, y:0}, {x:4, y:1}, {x:5, y:0}, {x:5, y:1} ];    // square shape

var tetrisChance = [1, 1, 0, 0, 0, 0, 0, 0];
// ratio of how likely each tetris pattern will appear.
// does not need to add up to 100%.
// please make sure there are exactly 8 items. The first element refers to appearance rate of the long bar.
// the second element refers to relative appearance ratio of the inverse 'L' shape. And so on...
// I might want to change the appearance rates later.

var randomMatrix = {
// object that contains the array of probability of each shape and...
// ... the method for reconfiguring the probability when the tetrisChance array is modified.
    matrix : [],
    randomize : function() {
        for ( let n=0 ; n<tetrisChance.reduce(function(sum,num){return sum + num;} ) ; n++ ) this.matrix[n] = 0;
        let k = 0;
        for ( let i=0 ; i<=tetrisChance.length ; i++ ) for ( let j=0 ; j<tetrisChance[i] ; j++ ) this.matrix[k++] = i;
    }
}   // end of randomMatrix def

var currentTetris = { 
    form : 0 , 
    pose : 0 ,
    flip : function() {
        this.pose++;
        if (this.pose == transformMatrix[this.form].length) this.pose = 0;
    }
};
// global variable that contains key for the shape and orientation the tetris piece.
// 'form' is the shape. Is the tetris piece a long bar or a 'T' shape?
// there are 0 to 7 forms.
// 'pose' is the orientation. Is the long bar piece upright or flat?
// the number of poses vary among shapes. the 'T' shape has 4 poses. the square has only 1 pose.
// this will change how the moveRotate() function behaves.

var transformMatrix = [];
transformMatrix[0] = [];
transformMatrix[0][0] = [ { x:-1, y:1 }, { x:0, y:0 }, { x:1, y:-1 }, { x:2, y:-2 } ];
transformMatrix[0][1] = [ { x:1, y:-1 }, { x:0, y:0 }, { x:-1, y:1 }, { x:-2, y:2 } ];
//transformMatrix[1][0] = [ { x:}]









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

var ghost = [new ghostType(0,0), new ghostType(), new ghostType(), new ghostType() ];













// ---------- Functions ------------------------------------------ //


function setBoard() {
// fills toyRoom with empty boxes. These will turn into the PILE one by one.

    for ( let i = 0 ; i < 200 ; i++ ) {

        var p = document.createElement('div');

        /*
        p.style.color = 'black';
        p.style.fontFamily = 'helvetica, san-serif';
        p.style.fontSize = '7pt';
        p.style.lineHeight = 3;
        p.style.textAlign = 'center';
        p.innerText = i;
        */

        p.style.cursor = 'pointer';

        p.style.boxSizing = 'border-box';
        //p.style.backgroundColor = '#9D5';
        p.style.backgroundColor = blockBackgroundColor;
        
        p.style.opacity = (0==(Math.floor(0.012*i*Math.random())))? setOpacity.low: setOpacity.high;

        p.style.border = '0.5px solid rgba(255, 255, 255, 1)';      // thin white border
        p.style.borderRadius = '12px';       // unnecessary, but cooler?
        //p.style.boxShadow = '0px 0px 5px 0px inset blue';
        p.style.boxShadow = blockBoxShadow;

        p.style.width = xInc + 'px';
        p.style.height = yInc + 'px';
        p.style.cssFloat = 'left';          // needed to fill horizontally too
        p.style.position = 'relative';

        p.style.transformOrigin = '50% 100%';

        toyRoom.appendChild(p);
        //checkRow();

        // the ONCLICK function
        toyRoom.lastChild.onclick = function() {
            // I need this for now to directly control what the board looks like
            // I will remove this function in a later version

            let a = setOpacity.flip(this.style.opacity);
            var b = 0;
            this.style.opacity = a;

            /*
            let t = setInterval(blockRotate, 10);
            function blockRotate() {
                
                this.style.transform = "rotateY(" + b + "deg)";
                b += 5;
                if (b > 90) {
                    if (!(this.style.opacity == a)) {
                        this.style.opacity = a;
                    }
                }
                if (b > 180) {
                    clearInterval(t);
                }
            }
            */
            
            checkRow();

        }   // end of onclick function def

    }   // end of for loop, iterated over only the first 200 blocks

    // multiplies scalar xInc and yInc to the transformMatrix[]
    for ( let i = 0 ; i < transformMatrix.length ; i++ ) {
        for ( let j = 0 ; j < transformMatrix[i].length ; j++ ) {
            for ( let k = 0 ; k < transformMatrix[i][j].length ; k++ ) {
                transformMatrix[i][j][k].x *= xInc;
                transformMatrix[i][j][k].y *= yInc;
            }
        }
    }


    // mouse click to move tetris possible!!!
    moveButtons.children[0].onclick = function() {
        moveHorizontal(-xInc);
    }
    moveButtons.children[1].onclick = function() {
        moveHorizontal(xInc);
    }
    moveButtons.children[2].onclick = function() {
        integrateBlocks();
    }

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
        blockPile[i+200].style.left = xInc * tetrisForms[currentTetris.form][i].x + 'px';
        blockPile[i+200].style.top = yInc * tetrisForms[currentTetris.form][i].y + 'px';
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

}   // end of boxFall()









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

}   // end of moveVertical()












function moveRotate(direction) {
// rotates tetris cluster clockwise or counterclockwise
    
    let a = (direction == 'left')? -1 : 1;

    console.log(direction);     // 'left' or 'right'. really should be clockwise or counter, but oh well...
    console.log(a);

    // Let's assume for simplicity that we only have the long bar shape!!!

    console.log('form is ' + currentTetris.form);
    console.log('pose is ' + currentTetris.pose);

    for ( let i = 0 ; i <= 3 ; i++ ){
        let b = pxOff(blockPile[i+200].style.left) + transformMatrix[currentTetris.form][currentTetris.pose][i].x;
        blockPile[i+200].style.left = pxOn(b);
        b = pxOff(blockPile[i+200].style.top) + transformMatrix[currentTetris.form][currentTetris.pose][i].y;
        blockPile[i+200].style.top = pxOn(b);
    }

    currentTetris.flip();




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







function crashImminent(x, y) {

    let crashed = false;
    for (let i = 0 ; i <= 3 ; i++ ) {
        ghost[i].fill(blockPile[i+200].style.left, blockPile[i+200].style.top, x, y);
        if ( blockPile[ghost[i].floor()].style.opacity == setOpacity.high ) crashed = true;
        if ( blockPile[ghost[i].ceil()].style.opacity == setOpacity.high ) crashed = true;
    }

    //console.log('done!');
    return crashed;

}






function pxOff(text) {
    return eval( text.substring(0, text.length - 2) );
}

function pxOn(number) {
    return eval(number) + 'px';
}







// ----------------- MAIN BODY ----------------------------------------- //


setBoard();

checkRow();         // must do setBoard() first

createBlockAgent();     // must do setBoard() first

resetTetrisShape();


// runs continuously
var timeFlow = setInterval(timeAction,timeInc);

// event listeners
document.addEventListener('keydown', keyDownAction);
document.addEventListener('keyup', keyUpAction);





