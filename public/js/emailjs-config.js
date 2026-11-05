(function () {
  

  var EMAILJS_PUBLIC_KEY = 'TU_PUBLIC_KEY';   

  var EMAILJS_SERVICE    = 'TU_SERVICE_ID';   

  var EMAILJS_TEMPLATE   = 'TU_TEMPLATE_ID';  

  

  if (typeof emailjs === 'undefined') {
    console.warn('[Sneak] EmailJS SDK no encontrado. Carga el SDK antes de este script.');
    return;
  }

  

  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

  

  window.SNEAK_EMAILJS = {
    service : EMAILJS_SERVICE,
    template: EMAILJS_TEMPLATE,
    key     : EMAILJS_PUBLIC_KEY,
  };
})();
