//redundant function declaration, see mappingAlg.js
export function gcd_two_numbers(x, y) { // greatest common divisor
  if ((typeof x !== 'number') || (typeof y !== 'number')) 
    return false;
  x = Math.abs(x);
  y = Math.abs(y);
  while(y) {
    var t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function downloadObjectAsJson(exportObj, exportName){
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

export function readFile(files) {
  return new Promise((resolve, reject) => {
    if (!files.length) {
      alert('Please select a file!');
      return;
    }

    var file = files[0];
    var start = 0;
    var stop = file.size - 1;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
      if (evt.target.readyState === FileReader.DONE) { // DONE == 2
        resolve(evt.target.result);
      }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob);
  });
}

export const sanitizeTime = (timeString) => {
  if (timeString.length === 0){return '00:00';}
  if (timeString.length === 1){
    const hours = Number(timeString);
    if (isNaN(hours)){return '00:00';}
    return '0'+hours+':00';
  }
  if (timeString.length === 2){
    return timeString+':00';
  }
  const parts = timeString.split(':');
  if (parts.length < 2){
    if (parts[0].length > 2){
      parts.push(parts[0].substr(parts[0].length-2,2));
      parts[0] = parts[0].substr(0,parts[0].length-2);
    } else {
      parts.push('00');
    }
  }
  if (parts[0].length < 2){
    parts[0] = '0'+parts[0];
  }
  return parts.join(':');
};
