document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});

document.addEventListener('keydown', function (e) {

 
  

  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
    e.preventDefault();
  }

  

  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j') {
    e.preventDefault();
  }

  

  if (e.ctrlKey && e.key.toLowerCase() === 'u') {
    e.preventDefault();
  }

  

  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
    e.preventDefault();
  }

});
