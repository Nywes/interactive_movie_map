$(document).scroll(function(){
    if ($(document).scrollTop() > 320 ) {
      $('.main').addClass('active');
      $('.reveal-main').addClass('activetwo');
    }
   
   else {
     $('.main').removeClass('active');
          $('.reveal-main').removeClass('activetwo');
   }
 
 });
  