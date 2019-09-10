;(function ($) {
  $(document).ready(function () {
    $(window).scroll(function () {
      if ($(window).width() > 960) {
        var scrollProgress = parseInt($(window).scrollTop(), 10)
        $('body.index .brand').css('opacity', Math.min(scrollProgress / 100, 1))
      }
    })
  })
})(window.jQuery)
