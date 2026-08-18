/* ==========================================================================
   animations.js — scroll-triggered reveal animations
   ========================================================================== */
(function () {
	'use strict';

	var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	var revealTargets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

	if (!revealTargets.length) return;

	/* Respect reduced-motion: show everything immediately, skip the observer */
	if (reduceMotionQuery.matches) {
		revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
		return;
	}

	if (!('IntersectionObserver' in window)) {
		revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
		return;
	}

	var observer = new IntersectionObserver(
		function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				}
			});
		},
		{
			threshold: 0.12,
			rootMargin: '0px 0px -8% 0px'
		}
	);

	revealTargets.forEach(function (el) { observer.observe(el); });
})();
