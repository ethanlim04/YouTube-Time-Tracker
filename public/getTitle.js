/* eslint-disable */
if(typeof init === 'undefined') {
    const init = function() {
        return document.querySelector(".style-scope ytd-watch-metadata").querySelector("h1").textContent;
    }
    init();
}