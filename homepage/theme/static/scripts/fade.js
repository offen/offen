;(function ($) {
  $(document).ready(function () {
    $(window).scroll(function () {
      $('.brand-index').css('opacity', 0 + $(window).scrollTop() / 100)
    })
  })
})(window.jQuery)
