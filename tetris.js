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


                
        toyRoom.lastChild.onclick = function() {

            let x = this.offsetLeft;
            let y = this.offsetTop;

            // this.style.opacity = -1 * (this.style.opacity - 1);
            this.style.opacity = -(this.style.opacity - 1.5);   // toggles 0.5 and 1
            
            // this gives index number of the block i clicked.
            // I should consider defining this outside the setBoard() function...
            var temp = Array.prototype.slice.call(toyRoom.children);
            var indexTemp = temp.indexOf(this);

            //console.log (`x, y, index = ${x}, ${y}, ${temp.indexOf(this)}`);
            console.log (`x, y, index = ${x}, ${y}, ${indexTemp}`);
            // actually this is misleading. the index of the DOM object is off by 1

            var t = setInterval(radiusSqueeze,50);
            var b = -(Math.ceil(xInc/2) - 4);
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
        default:
            break;
    }
}

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
        //p.style.cssFloat = 'left';

        p.style.position = 'absolute';
        p.style.left = (xInc * 4) + 'px';     // need xOffset cuz position:absolute
        p.style.top = '0px';      // need yOffset cuz position:absolute
        
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

    // just the second row from the bottom.
    // i will make this iterate over the whole screen, later.
    for (i = 181; i <= 190; i++) {
        count += eval(toyRoom.childNodes[i].style.opacity);
    }

    if (count==10) {
        
        let r = 0;
        let t = setInterval(rowSpin,10);
        
        function rowSpin() {
            for (i = 180; i <=189; i++) {
                toyRoom.children[i].style.transform = "rotate(" + r + "deg)";
            }
            r += 2;
            if (r > 90) {
                clearInterval(t);
                for (i = 180; i <= 189; i++ ) {
                    toyRoom.children[i].style.opacity = 0.5;
                }
                dropMountain();
            }   // if r reaches 90 deg...

        }   // end of rowSpin()

    }   // end of if count is 10

}   // end of checkRow()


function dropMountain() {
    var dummy;
    for ( let i = 180 ; i >=10 ; i -= 10 ) {
        for ( let j = i ; j <= i+9 ; j++ ) {
            dummy = toyRoom.children[j-10].style.opacity;
            //console.log('opacity is ' + dummy);
            toyRoom.children[j].style.opacity = dummy;
        }
    }
    
    
    for ( let k = 0 ; k <= 9 ; k++ ) {
        toyRoom.children[k].style.opacity = 0.5;
    }
    
    
    //toyRoom.children[9].style.opacity = 0.5;

}




// ---------- Main Body ----------------------------------------- //


setBoard();
document.addEventListener('keydown', keyAction);




