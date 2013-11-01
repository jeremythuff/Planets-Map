///////////////////////////////////////////////////////////////////
//TODOS                                                          //
///////////////////////////////////////////////////////////////////
//1. "Smart" buffer next and prev images to an off screen canvas.//
///////////////////////////////////////////////////////////////////
//2. handle images as dzi if they have the data format           //
///////////////////////////////////////////////////////////////////
//3. Integrate into a backend that prepares and serves the data  //
///////////////////////////////////////////////////////////////////
//4. Make the zoom level of the image be a product of the images'//
//   size relative to the whole of the image                     //
///////////////////////////////////////////////////////////////////

$(document).ready(function() {
    ////////////////////
    //Initial Settings//
    ////////////////////
    var mapData = {};
    var z = 1;
    var x = (canvas.width/2)-(canvas.height/2);
    var y = 0;
    
    
    //////////////////////
    //ajax & init draw()//
    //////////////////////
    
    //we are currently getting the data with ajax but we should chekc into websockets for
    //a potential performance boost.
    var getImgData = $.ajax({
        url: "json/data.json",
        dataType: "json"
    });

    getImgData.done(function(data) {
        mapData = data.map;
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        
        canvas.width = $(window).width();
        canvas.height = $(window).height();
        
        x = (canvas.width/2)-((canvas.height*z)/2)
        drawStuff(x, y, z);
    });

    

    //////////////////////
    //main draw function//
    //////////////////////
    function drawStuff(x, y, z) {
        canvas.width = canvas.width;//cleans the canvas
        ctx.fillStyle = "rgba(50, 50, 50, .85)";
        ctx.fillRect (0, 0, canvas.width, canvas.height);

        var w = (canvas.height)*z;//the width of each region is set relative tot eh zoom level 
        var h = w;//the layout is square
        var map = mapData[0];
        var oneLightYear = w/2000;
        var r = map.color.r;
        var g = map.color.g;
        var b = map.color.b;
        var planets = map.planets;


        drawBg(x,y,w,h,r,g,b);
        drawWrap(x,y,w,h,r,g,b);
        drawPlanets(w, planets, oneLightYear);
        // drawShips();
        // drawRoutes();
        // drawStorms();
        
    }

    ///////////////////
    //event listeners//
    ///////////////////

    $(window).on('resize', reDrawCanvas);

    $("canvas").on('mousewheel', function(event) {
        zoom(event.originalEvent.clientX, event.originalEvent.clientY, event.originalEvent.wheelDelta);
    });

    $("canvas").on("dblclick", function(event) {
        var counter = 0;
        var clickZoom = setInterval(function() {
            
            if(counter < 4) {
                delta = counter * 1;
            } else if (counter > 30) {
                delta = counter * 2;
            }  else {
                delta = counter * 4;
            }

            zoom(event.clientX, event.clientY, delta);
            
            counter++;
            if(counter === 40) {
                clearInterval(clickZoom);
            }

        }, 10); 
    });

    $("canvas").on('mousedown', function(event) {

        lastX = event.clientX;
        lastY = event.clientY; 

        $(window).on('mousemove', function(e) {
            var newX = e.clientX;
            var newY = e.clientY;            

            if(lastX > newX) {
                x -= Math.abs(lastX - newX);

                if((x<=0)&&(x+(((canvas.height)*z))<=canvas.width)) {
                    x += Math.abs(lastX - newX);
                }

            } else {
                x += Math.abs(lastX - newX);

                if((x+(((canvas.height)*z))>=canvas.width)&&(x>=0)) {
                    x -= Math.abs(lastX - newX);
                }
            }

            if(newY > lastY) {
                y += Math.abs(lastY - newY);

                if((y+(((canvas.height)*z))>=canvas.height)&&(y>=0)) {
                    y -= Math.abs(lastY - newY);
                }

            } else {
                y -= Math.abs(lastY - newY);

                if((y<=0)&&((y+(((canvas.height)*z)))<=(canvas.height))) {
                    y += Math.abs(lastY - newY);
                } 
            }
            lastX = newX;
            lastY = newY; 
            drawStuff(x, y, z);
            
        });
    });

    $(window).on('mouseup', function() {
        $(window).off('mousemove');
    });

    /////////////
    //Functions//
    /////////////

    function drawBg(x,y,w,h,r,g,b) {
        ctx.fillStyle = "rgba("+r+", "+g+", "+b+", .75)";
        ctx.fillRect (x, y, w, h);
    }

    function drawWrap(x,y,w,h,r,g,b) {
        ctx.fillStyle = "rgba("+r+", "+g+", "+b+", .25)";
        ctx.fillRect (x+w, y, w, h);
        ctx.fillRect (x-w, y, w, h);
        ctx.fillRect (x, y+w, w, h);
        ctx.fillRect (x, y-w, w, h);
        ctx.fillRect (x+w, y+w, w, h);
        ctx.fillRect (x-w, y-w, w, h);
        ctx.fillRect (x+w, y-w, w, h);
        ctx.fillRect (x-w, y+w, w, h);
    }

    function drawPlanets(w, planets, oneLightYear) {
       
        key = Object.keys(planets);
        
        $(key).each(function() {
            var planetX = planets[this].x*oneLightYear;
            var planetY = planets[this].y*oneLightYear;
            var basicConnections = planets[this].basicConnections;
            
            $(basicConnections).each(function() {
                var conX = planets[this].x*oneLightYear;;
                var conY = planets[this].y*oneLightYear;;
                ctx.moveTo(x+planetX,y+planetY);
                ctx.lineTo(x+conX,y+conY);
                ctx.strokeStyle = '#ff0000';
                ctx.stroke();

            });
            
        });

        $(key).each(function() {
            var planetX = planets[this].x*oneLightYear;
            var planetY = planets[this].y*oneLightYear;
            var grd = ctx.createRadialGradient(planetX, planetY, (w/500)/10, planetX, planetY, w/500);
            
            grd.addColorStop(0,"white");
            grd.addColorStop(1,"blue");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(x + planetX, y + planetY, w/500, 0, w/200);
            ctx.fill();

        });

    }

    function reDrawCanvas() {
        canvas.width = $(window).width();
        canvas.height = $(window).height();
        drawStuff(x, y, z); 
    }


    function isOnScreen(x,y) {
        if((x<canvas.width)&&(x+((canvas.height)*z)>0)&&(y<canvas.height)&&(y+((canvas.height)*z)>0)) {
            return true;
        } else {
            return false;
        }
    }

    function zoom(clientX, clientY, delta) {
        //get the cursors absolute screen position over the canvas
        //NOTE this will not work as it is written unless the canvas is in the top left corner of the screen
        var mouseXOnScreen = clientX;
        var mouseYOnScreen = clientY;

        //this calculates the position of the mouse over the drawn object on the screen
        var mouseXOnImg = mouseXOnScreen-x;
        var mouseYOnImg = mouseYOnScreen-y;

        //this calculated the cursors offset over the image as a % of the total images size
        var oldMouseXPosPercentOfImg = mouseXOnImg/(canvas.height*z);
        var oldMouseYPosPercentOfImg = mouseYOnImg/(canvas.height*z);

        /*
            z is a result of delta squared so that it willl zoom faster the harder you scroll the wheel,
            one of the deltas is held at an absolut value so that the product will be positive or negative
            depending on the direction of the wheel's spin, finally z is reduced by a factor of z/n so that
            zooming will occure more and more quickly as the zoom increases.
        */
        z += Math.abs(delta)*delta*(z/150000);
        //this places a min/max zoom in/out level
        z<.5 ? z=.5: z=z;
        z>5 ? z=5: z=z;

        //this recalculates the cursors position as a % of the total images size at the new level of zoom
        var newMouseXPosPercentOfImg = mouseXOnImg/(canvas.height*z);
        var newMouseYPosPercentOfImg = mouseYOnImg/(canvas.height*z);

        //this calculates the difference in the % of the total images size both before and after the zoom
        var percentXShift = newMouseXPosPercentOfImg - oldMouseXPosPercentOfImg;
        var percentYShift = newMouseYPosPercentOfImg - oldMouseYPosPercentOfImg;

        // this converts the % into the the relative pixel distance at this level of zoom
        var pixelsNowEqualToPercentXShift = (canvas.height*z)*percentXShift;
        var pixelsNowEqualToPercentYShift = (canvas.height*z)*percentYShift;

        //this shifts x and y by the number of pixels represented by the shift in the cursors position relative tot eh image.
        x += pixelsNowEqualToPercentXShift;
        y += pixelsNowEqualToPercentYShift;

        drawStuff(x, y, z); 
    }

});