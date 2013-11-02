
self.onmessage = function (oEvent) {
	
	var imgData = oEvent.data;

	for (var i=0;i<imgData.data.length;i+=4) {
		imgData.data[i+3]=220;
	}

 	postMessage({status: 'complete', imgData: imgData});

};
