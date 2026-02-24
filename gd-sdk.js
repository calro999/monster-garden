// GD SDK Loader
(function(){
  var gd = document.createElement('script');
  gd.src = 'https://html5.api.gamedistribution.com/main.min.js';
  gd.async = true;
  gd.onload = function() {
    // GD SDK loaded
    window.gdsdk && window.gdsdk.init && window.gdsdk.init();
  };
  document.head.appendChild(gd);
})();
