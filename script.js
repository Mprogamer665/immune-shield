document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const sections = [...document.querySelectorAll('main section[id]')];

  sections.forEach((s, i) => {
    s.classList.add('reveal');
    s.style.transitionDelay = `${Math.min(i * 40, 240)}ms`;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in-view');
    });
  }, { threshold: 0.12 });
  sections.forEach(s => io.observe(s));

  const setActive = () => {
    const scrollY = window.scrollY + 140;
    let current = sections[0]?.id;
    for (const s of sections) {
      if (scrollY >= s.offsetTop) current = s.id;
    }
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  };

  window.addEventListener('scroll', setActive, { passive: true });
  setActive();

  navLinks.forEach(a => {
    a.addEventListener('click', () => {
      a.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(.95)' },
        { transform: 'scale(1)' }
      ], { duration: 220, easing: 'ease-out' });
    });
  });
});
