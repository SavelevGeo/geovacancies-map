document.addEventListener('DOMContentLoaded', () => {
  var iframeListener = document.querySelector('.iframe-listener');
  
  //https://www.geeksforgeeks.org/how-to-check-a-webpage-is-loaded-inside-an-iframe-or-into-the-browser-window-using-javascript/
  function iniFrame() {
    var gfg = window.frameElement;
    iframeListener.textContent = 'inside func'
    // Checking if webpage is embedded
    if (gfg) {
        // The page is in an iFrame
        iframeListener.textContent = "The page is in an iFrame";
    } 
    else {
        // The page is not in an iFrame
        iframeListener.textContent = "The page is not in an iFrame";
    }
  };
  iniFrame();
});