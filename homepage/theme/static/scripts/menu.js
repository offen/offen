(function ($) {
  $('nav ul li a:not(:only-child)').click(function (e) {
    $(this).siblings('.nav-dropdown').toggle()
    $('.dropdown').not($(this).siblings()).hide()
    e.stopPropagation()
  })
  $('html').click(function () {
    $('.nav-dropdown').hide()
  })
  $('#nav-toggle').click(function () {
    $(this)
      .toggleClass('active')
      .closest('nav')
      .find('ul')
      .slideToggle()
  })

  $(window).scroll(function () {
    $('.brand-index').css('opacity', 0 + $(window).scrollTop() / 100)
  })
})(window.jQuery)
