(function () {
  var FACEBOOK_URL = 'https://www.facebook.com/alfaquest0';

  function facebookIconSvg() {
    return '<svg class="site-social-icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false">' +
      '<path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>' +
      '</svg>';
  }

  function facebookLinkHtml() {
    return '<a class="site-social-link site-social-link--facebook" href="' + FACEBOOK_URL +
      '" target="_blank" rel="noopener noreferrer">' +
      facebookIconSvg() + '<span>Follow on Facebook</span></a>';
  }

  function renderSiteSocialLinks() {
    var slots = document.querySelectorAll('[data-site-social-links]');
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      if (slot.dataset.siteLinksReady === 'true') continue;
      slot.innerHTML = facebookLinkHtml();
      slot.dataset.siteLinksReady = 'true';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSiteSocialLinks);
  } else {
    renderSiteSocialLinks();
  }
})();
