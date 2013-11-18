$(document).ready(function() {
    
    ////////////////////
    //Initial Settings//
    ////////////////////
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
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
        
        
        canvas.width = $(window).width();
        canvas.height = $(window).height()-300;
        
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
        drawGrid(x,y,w,h, oneLightYear);
        drawPlanets(w, planets, oneLightYear);
        // drawShips();
        // drawRoutes();
        // drawStorms();
        setWrap(w,h);
        

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
                
                ((x+((canvas.height)*z))<0)?(x += Math.abs(lastX - newX)):(x -= Math.abs(lastX - newX));

            } else {
                
                (x>(canvas.width))?(x -= Math.abs(lastX - newX)):(x += Math.abs(lastX - newX));

            }

            if(newY > lastY) {
                y += Math.abs(lastY - newY);

                // if((y+(((canvas.height)*z))>=canvas.height)&&(y>=0)) {
                //     y -= Math.abs(lastY - newY);
                // }

            } else {
                y -= Math.abs(lastY - newY);

                // if((y<=0)&&((y+(((canvas.height)*z)))<=(canvas.height))) {
                //     y += Math.abs(lastY - newY);
                // } 
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

     function drawGrid(x,y,w,h, oneLightYear) {
        var gridX = x;
        var gridY = y;
        var oneHundredLY = oneLightYear*100;
        var LYcounter = 0;
        
        ctx.lineWidth=.25;
        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "#fff"
        ctx.font = z*10+'pt Calibri';
        ctx.beginPath();
        for(i=0;i<=(oneLightYear*2000);i+=oneHundredLY) {
            
            ctx.fillText(LYcounter, gridX, gridY+h+15);
            ctx.moveTo(gridX,gridY);
            ctx.lineTo(gridX,gridY+h);
            gridX+=oneHundredLY;    
            LYcounter+=100;
        }

        gridX=x;

        for(i=0;i<=(oneLightYear*2000);i+=oneHundredLY) {
            ctx.moveTo(gridX,gridY);
            ctx.lineTo(gridX+w,gridY);
            gridY+=oneHundredLY;    
        }
        ctx.stroke();
        ctx.closePath();
        gridY=y;
    
    }

    function setWrap(w,h) {

        $(".showWrap").off("click");
        $(".showWrap").on("click", function() {
            doWrap(w,h);
        });
        function doWrap(w,h) {
            var mapImg = ctx.getImageData(x, y, w, h);
            var wrapImgProcessorWorker = new Worker("js/wrapImgProcessor.js");
            
            wrapImgProcessorWorker.postMessage(mapImg);       
            
            wrapImgProcessorWorker.onmessage = function (oEvent) {
                var newMapImg = oEvent.data.imgData;
                console.log(newMapImg);
                ctx.putImageData(newMapImg, x+w, y);
                ctx.putImageData(newMapImg, x-w, y);
                ctx.putImageData(newMapImg, x-w, y-h);
                ctx.putImageData(newMapImg, x+w, y+h);
                ctx.putImageData(newMapImg, x, y+h);
                ctx.putImageData(newMapImg, x, y-h);
                ctx.putImageData(newMapImg, x+w, y-h);
                ctx.putImageData(newMapImg, x-w, y+h);
            };    
        }
        
    }

    function drawPlanets(w, planets, oneLightYear) {
       
        key = Object.keys(planets);
        
        $(key).each(function() {
            var planetX = planets[this].x*oneLightYear;
            var planetY = planets[this].y*oneLightYear;
            var basicConnections = planets[this].basicConnections;
            
            ctx.lineWidth=.25;
            ctx.strokeStyle = '#f90';
            ctx.beginPath();

            $(basicConnections).each(function() {
                var conX = planets[this].x*oneLightYear;;
                var conY = planets[this].y*oneLightYear;;
                ctx.moveTo(x+planetX,y+planetY);
                ctx.beginPath;
                ctx.lineTo(x+conX,y+conY);

            });
            ctx.stroke();
            ctx.closePath();
            
        });

        $(key).each(function() {
            var planetX = x + planets[this].x*oneLightYear;
            var planetY = y + planets[this].y*oneLightYear;
            var planetName = planets[this].name;
            var planetSize = planets[this].size;
            var planetTemp = parseInt(planets[this].temp);
            var gradient = ctx.createRadialGradient(planetX-((w/500)/10), planetY-((w/500)/10), (w/500)/30, planetX, planetY, w/500);

            if(planetTemp>200) {
                var color1 = 'rgb(250, 135, 170)';
                var color2 = 'rgb(230, 40, 40)';
                var color3 = 'rgb(190, 60, 60)';
            } else if(planetTemp>100&&planetTemp<199) {
                var color1 = 'rgb(220, 200, 144)';
                var color2 = 'rgb(230, 160, 12)';
                var color3 = 'rgb(220, 200, 100)';
            } else if(planetTemp>32&&planetTemp<99) {
                var color1 = 'rgb(150, 180, 150)';
                var color2 = 'rgb(60, 150, 70)';
                var color3 = 'rgb(45, 130, 45)';
            } else if(planetTemp<32) {
                var color1 = 'rgb(235, 235, 235)';
                var color2 = 'rgb(170, 220, 230)';
                var color3 = 'rgb(200, 200, 200)';
            }

            gradient.addColorStop(0, color1);
            gradient.addColorStop(0.5, color2);
            gradient.addColorStop(1, color3);
            ctx.beginPath();
            ctx.arc(planetX, planetY, w/(500/(planetSize*2)), 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.font = (((w/z)/100)*(planetSize))+'pt Calibri';
            ctx.fillStyle = 'lightblue';
            ctx.fillText(planetName, planetX+z, planetY-((w/(500/(planetSize)))+10));

        });

    }

    function reDrawCanvas() {
        canvas.width = $(window).width();
        canvas.height = $(window).height()-300;
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
        z>50 ? z=50: z=z;

        //this recalculates the images position under the cursors as a % of the total images size at the new level of zoom
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