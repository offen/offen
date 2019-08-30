;(function ($) {
  $(document).ready(function () {
    $(window).scroll(function () {
      var scrollProgress = parseInt($(window).scrollTop(), 10)
      $('.brand-index').css('opacity', Math.min(scrollProgress / 100, 1))
    })
  })
})(window.jQuery)
