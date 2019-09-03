;(function ($) {
  $(function () {
    $('nav ul li a:not(:only-child)').click(function (e) {
      $(this).siblings('.nav-dropdown').toggle()
      $('.dropdown').not($(this).siblings()).hide()
      e.stopPropagation()
    })
    $('html').click(function () {
      $('.nav-dropdown').hide()
    })
    $('#nav-toggle').click(function () {
      $(this).closest('nav').find('ul').slideToggle()
      $(this).toggleClass('active')
    })
  })
})(window.jQuery)
