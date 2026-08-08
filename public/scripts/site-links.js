(function () {
  var FACEBOOK_URL = 'https://www.facebook.com/alfaquest0';

  function facebookLinkHtml() {
    return '<a class="site-social-link site-social-link--facebook" href="' + FACEBOOK_URL +
      '" target="_blank" rel="noopener noreferrer">Follow on Facebook</a>';
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
