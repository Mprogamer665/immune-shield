/* =========================================================================
   IMMUNE SHIELD — SCRIPT
   Structure:
   1. Loading screen        6. Body diagram hotspots     11. Search
   2. Particle background   7. Vaccine before/after slider 12. Glossary
   3. Router (SPA pages)    8. Herd immunity diagram      13. Theme toggle
   4. Reveal-on-scroll      9. Quiz engine                14. Sound toggle
   5. Tabs / Accordion /   10. Mobile nav
      Flip cards
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================================
     1. LOADING SCREEN
     ===================================================================== */
  const loadingScreen = document.getElementById('loading-screen');
  const loaderBarFill = document.getElementById('loader-bar-fill');
  let loadProgress = 0;
  const loadTimer = setInterval(() => {
    loadProgress += Math.random() * 22;
    if (loadProgress >= 100) {
      loadProgress = 100;
      clearInterval(loadTimer);
      setTimeout(() => loadingScreen.classList.add('done'), 350);
    }
    loaderBarFill.style.width = loadProgress + '%';
  }, 180);

  /* =====================================================================
     2. PARTICLE + DNA BACKGROUND CANVAS
     ===================================================================== */
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: null, y: null };

  function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  const PARTICLE_COUNT = Math.min(60, Math.floor((W * H) / 26000));
  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1.4 + Math.random() * 2.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        hue: Math.random() > 0.5 ? '45,212,232' : '52,211,153'
      });
    }
  }
  initParticles();

  // Slowly rotating DNA helix drawn faintly in a corner of the viewport
  let dnaOffset = 0;
  function drawDNA() {
    const originX = W * 0.86;
    const originY = H * 0.5;
    const amplitude = Math.min(70, W * 0.07);
    const length = Math.min(H * 0.8, 620);
    const rungs = 18;
    ctx.save();
    ctx.translate(originX, originY - length / 2);
    for (let i = 0; i < rungs; i++) {
      const t = i / (rungs - 1);
      const y = t * length;
      const phase = t * Math.PI * 4 + dnaOffset;
      const x1 = Math.sin(phase) * amplitude;
      const x2 = Math.sin(phase + Math.PI) * amplitude;
      const alpha = 0.10 + 0.06 * Math.sin(t * Math.PI);

      ctx.strokeStyle = `rgba(45,212,232,${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();

      ctx.fillStyle = `rgba(45,212,232,${alpha + 0.12})`;
      ctx.beginPath(); ctx.arc(x1, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(52,211,153,${alpha + 0.12})`;
      ctx.beginPath(); ctx.arc(x2, y, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawDNA();
    dnaOffset += 0.004;

    particles.forEach(p => {
      // gentle drift
      p.x += p.vx; p.y += p.vy;
      // subtle mouse parallax repulsion
      if (mouse.x !== null) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x += (dx / dist) * 0.6;
          p.y += (dy / dist) * 0.6;
        }
      }
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.hue},0.5)`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!prefersReducedMotion) requestAnimationFrame(animate);
  }
  animate();
  if (prefersReducedMotion) { ctx.clearRect(0,0,W,H); } // draw once, skip loop

  /* =====================================================================
     3. ROUTER — hash-based single-page navigation
     ===================================================================== */
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-links a[data-route]');

  function goToRoute(route, scrollTop = true) {
    let matched = false;
    pages.forEach(p => {
      const isMatch = p.id === route;
      p.classList.toggle('active', isMatch);
      if (isMatch) matched = true;
    });
    if (!matched) { document.getElementById('home').classList.add('active'); }

    navLinks.forEach(a => a.classList.toggle('active', a.dataset.route === route));

    if (scrollTop) window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });

    // re-trigger reveal check for newly visible page
    setTimeout(checkReveal, 60);
    closeMobileNav();
  }

  function currentRouteFromHash() {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  }

  window.addEventListener('hashchange', () => goToRoute(currentRouteFromHash()));

  // Delegate clicks for any element with data-route (nav links, buttons, cards)
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-route]');
    if (target) {
      // allow default hash update, router listens to hashchange;
      // but also fire directly in case hash is unchanged (e.g. clicking Home while already there)
      const route = target.dataset.route;
      if (currentRouteFromHash() === route) { goToRoute(route); }
    }
  });

  goToRoute(currentRouteFromHash());

  /* =====================================================================
     4. REVEAL-ON-SCROLL
     ===================================================================== */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));
  function checkReveal() {
    revealEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) el.classList.add('in-view');
    });
  }
  checkReveal();

  // Scroll progress bar + header shrink shadow
  const scrollProgress = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  });

  /* =====================================================================
     5. TABS / ACCORDION / FLIP CARDS
     ===================================================================== */
  // Tabs (White Blood Cells section)
  document.querySelectorAll('.tab-group').forEach(group => {
    const buttons = group.querySelectorAll('.tab-btn');
    const panels = group.querySelectorAll('.tab-panel');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        group.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.add('active');
        playBeep(520, 0.05);
      });
    });
  });

  // Accordion FAQ
  document.querySelectorAll('.accordion-item').forEach(item => {
    const head = item.querySelector('.accordion-head');
    head.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
      playBeep(460, 0.05);
    });
  });

  // Flip cards (Virus vs Bacteria)
  document.querySelectorAll('.flip-card').forEach(card => {
    const toggle = () => { card.classList.toggle('flipped'); playBeep(500, 0.05); };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  /* =====================================================================
     6. BODY DIAGRAM HOTSPOTS (Prevention page)
     ===================================================================== */
  const bodyFacts = {
    skin: { title: 'Skin', text: 'Unbroken skin is the body\'s largest physical barrier — a tough, mostly waterproof layer that blocks most pathogens from entering, and hosts helpful bacteria that outcompete harmful ones.' },
    nose: { title: 'Nose & airways', text: 'Nasal hairs and sticky mucus trap airborne particles and pathogens before they reach the lungs, while tiny hair-like cilia sweep trapped debris back out.' },
    hands: { title: 'Hands', text: 'Hands pick up pathogens from surfaces and other people constantly. Regular hand washing physically removes them before they can be transferred to your eyes, nose, or mouth.' },
    gut: { title: 'Digestive system', text: 'Stomach acid destroys many swallowed pathogens, while the gut lining and its resident bacteria form another barrier against infection.' },
    lungs: { title: 'Lungs', text: 'Deep in the airways, resident phagocytes patrol the lung tissue, engulfing any pathogens that get past the upper airway defences.' }
  };
  const bodyTitle = document.getElementById('body-info-title');
  const bodyText = document.getElementById('body-info-text');
  document.querySelectorAll('.hotspot').forEach(spot => {
    spot.setAttribute('tabindex', '0');
    spot.setAttribute('role', 'button');
    const activate = () => {
      const fact = bodyFacts[spot.dataset.part];
      if (fact) { bodyTitle.textContent = fact.title; bodyText.textContent = fact.text; }
      playBeep(600, 0.06);
    };
    spot.addEventListener('click', activate);
    spot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
  });

  /* =====================================================================
     7. VACCINE BEFORE/AFTER SLIDER
     ===================================================================== */
  const sliderRange = document.getElementById('slider-range');
  const sliderHandle = document.getElementById('slider-handle');
  const compareAfter = document.querySelector('.compare-after');
  if (sliderRange && compareAfter) {
    compareAfter.style.position = 'absolute';
    compareAfter.style.top = '0'; compareAfter.style.left = '0';
    compareAfter.style.width = '100%'; compareAfter.style.height = '100%';
    function updateSlider(val) {
      compareAfter.style.clipPath = `inset(0 0 0 ${val}%)`;
      sliderHandle.style.left = val + '%';
    }
    updateSlider(sliderRange.value);
    sliderRange.addEventListener('input', () => updateSlider(sliderRange.value));
  }

  /* =====================================================================
     8. HERD IMMUNITY DIAGRAM — generate surrounding population dots
     ===================================================================== */
  const herdGroup = document.querySelector('.herd-people');
  if (herdGroup) {
    const total = 40;
    const cx = 150, cy = 150;
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2;
      const radius = 60 + (i % 3) * 30;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const isSusceptible = i % 9 === 0; // small minority unvaccinated/susceptible
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', y.toFixed(1));
      dot.setAttribute('r', 6);
      dot.setAttribute('fill', isSusceptible ? 'rgba(248,113,113,0.55)' : 'rgba(52,211,153,0.55)');
      dot.setAttribute('stroke', isSusceptible ? '#f87171' : '#34d399');
      dot.setAttribute('stroke-width', '1.5');
      herdGroup.appendChild(dot);
    }
  }

  /* =====================================================================
     9. QUIZ ENGINE — 20 questions, shuffled, scored, explained
     ===================================================================== */
  const quizBank = [
    { q: "What is the main job of the immune system?", opts: ["To digest food", "To detect and destroy pathogens and abnormal cells", "To pump blood around the body", "To produce hormones for growth"], correct: 1, explain: "The immune system's core role is identifying and eliminating disease-causing organisms and abnormal cells, such as some cancer cells." },
    { q: "Which of these is part of the FIRST line of defence?", opts: ["Killer T cells", "Antibodies", "Skin and mucous membranes", "Memory B cells"], correct: 2, explain: "The first line of defence is made up of physical and chemical barriers like skin, mucus, and stomach acid, which stop pathogens entering the body at all." },
    { q: "The second line of defence is best described as:", opts: ["Specific to one exact pathogen", "Fast but non-specific, e.g. phagocytes and inflammation", "Only active after vaccination", "Located solely in the bone marrow"], correct: 1, explain: "The second line (innate response) reacts quickly to any pathogen the same way, using tools like phagocytes, inflammation, and fever." },
    { q: "Which line of defence is the only one that creates long-term immune memory?", opts: ["First line", "Second line", "Third line (adaptive)", "None of them"], correct: 2, explain: "Only the adaptive (third line) response produces memory B cells and T cells that provide long-lasting immunity." },
    { q: "What is phagocytosis?", opts: ["A virus copying itself inside a cell", "A white blood cell engulfing and digesting a pathogen", "The production of antibodies", "The process of blood clotting"], correct: 1, explain: "Phagocytosis is when a phagocyte engulfs a pathogen and breaks it down internally." },
    { q: "Which white blood cells produce antibodies?", opts: ["Killer T cells", "Neutrophils", "B cells (plasma cells)", "Red blood cells"], correct: 2, explain: "B cells that have been activated turn into plasma cells, which mass-produce antibodies specific to one pathogen." },
    { q: "What is the main job of a killer (cytotoxic) T cell?", opts: ["To produce antibodies", "To directly destroy infected or abnormal body cells", "To engulf bacteria whole", "To form the skin barrier"], correct: 1, explain: "Killer T cells identify and destroy body cells that have been infected by a virus or have become cancerous." },
    { q: "Helper T cells mainly work by:", opts: ["Engulfing pathogens directly", "Releasing chemical signals that activate B cells and killer T cells", "Producing stomach acid", "Forming scar tissue"], correct: 1, explain: "Helper T cells coordinate the immune response by releasing cytokines that activate other immune cells." },
    { q: "An antibody recognises a pathogen by binding to its:", opts: ["Antigen", "Nucleus", "Flagellum", "Cell wall only"], correct: 0, explain: "Antibodies are shaped to match a specific antigen — a marker molecule on the surface of a pathogen." },
    { q: "Which best describes the difference between a virus and a bacterium?", opts: ["Viruses are always larger than bacteria", "Bacteria are living single cells that can reproduce alone; viruses must hijack a host cell to reproduce", "Antibiotics work equally well on both", "Bacteria always cause disease, viruses never do"], correct: 1, explain: "Bacteria are living organisms capable of independent reproduction, while viruses cannot reproduce without hijacking a host cell's machinery." },
    { q: "Why don't antibiotics work against viral infections like the common cold?", opts: ["Because viruses aren't affected by drugs targeting bacterial structures", "Because viruses are too large", "Because antibiotics only work on plants", "Because viruses live outside the body"], correct: 0, explain: "Antibiotics target structures found in bacteria (like cell walls); viruses don't have these structures, so antibiotics have no effect on them." },
    { q: "Antibiotic resistance develops mainly because:", opts: ["Vaccines stop working over time", "Bacteria with random resistance mutations survive antibiotic exposure and reproduce", "Bacteria can photosynthesise", "White blood cells attack antibiotics"], correct: 1, explain: "When antibiotics kill most bacteria, any bacteria with a resistance mutation survive and multiply, eventually dominating the population." },
    { q: "Why is it important to finish a full course of prescribed antibiotics?", opts: ["It tastes better that way", "Stopping early can leave partially-resistant bacteria alive to multiply", "It has no real effect either way", "It only matters for viral infections"], correct: 1, explain: "Stopping antibiotics early can leave the hardier, partially-resistant bacteria alive, helping resistance develop faster." },
    { q: "How does a vaccine train the immune system?", opts: ["By introducing a harmless antigen so B and T cells learn to recognise it", "By killing all bacteria in the body", "By directly replacing red blood cells", "By permanently disabling the pathogen worldwide"], correct: 0, explain: "A vaccine introduces a harmless piece (or safe version) of a pathogen so the immune system can build antibodies and memory cells without illness." },
    { q: "What is 'herd immunity'?", opts: ["When only herd animals can get vaccinated", "When enough of a population is immune that a pathogen struggles to spread, protecting even unvaccinated individuals", "A vaccine given only to farm animals", "The immune system of a single very healthy person"], correct: 1, explain: "Herd immunity occurs when high vaccination rates limit a pathogen's ability to find new hosts, indirectly protecting those who can't be vaccinated." },
    { q: "What made COVID-19 mRNA vaccines novel?", opts: ["They contained the live virus", "They gave cells instructions to briefly produce a harmless viral protein to trigger immunity", "They only worked on animals", "They required no clinical trials"], correct: 1, explain: "mRNA vaccines deliver genetic instructions for a harmless spike protein fragment, training the immune system without causing infection." },
    { q: "According to health authorities like the CDC, hands should be washed with soap for at least:", opts: ["2 seconds", "5 seconds", "20 seconds", "2 minutes"], correct: 2, explain: "Health authorities recommend washing hands for at least 20 seconds to effectively remove pathogens." },
    { q: "Which of these supports healthy immune function?", opts: ["Chronic sleep deprivation", "A balanced diet, regular sleep, and moderate exercise", "Skipping all physical activity", "Ignoring hydration"], correct: 1, explain: "Sleep, balanced nutrition, hydration, and moderate exercise all support the body's ability to produce and circulate immune cells effectively." },
    { q: "The hadith 'cleanliness is half of faith' is found in which authenticated collection?", opts: ["Sahih Muslim", "A modern newspaper", "A history textbook", "An unrelated folk tale"], correct: 0, explain: "This well-known hadith is recorded in Sahih Muslim, reflecting the strong emphasis on physical and spiritual cleanliness in Islamic teaching." },
    { q: "The Prophet Muhammad's (peace be upon him) instruction not to enter or leave a plague-affected land closely resembles which modern public health practice?", opts: ["Vaccination", "Quarantine", "Antibiotic prescription", "Blood donation"], correct: 1, explain: "This instruction, recorded in Sahih al-Bukhari, mirrors the modern concept of quarantine — limiting movement to stop a disease spreading further." }
  ];

  const quizStartScreen = document.getElementById('quiz-start-screen');
  const quizActiveScreen = document.getElementById('quiz-active-screen');
  const quizResultScreen = document.getElementById('quiz-result-screen');
  const quizStartBtn = document.getElementById('quiz-start-btn');
  const quizRestartBtn = document.getElementById('quiz-restart-btn');
  const quizNextBtn = document.getElementById('quiz-next-btn');
  const quizQuestionEl = document.getElementById('quiz-question');
  const quizOptionsEl = document.getElementById('quiz-options');
  const quizExplainEl = document.getElementById('quiz-explain');
  const quizProgressFill = document.getElementById('quiz-progress-fill');
  const quizProgressLabel = document.getElementById('quiz-progress-label');
  const quizBadge = document.getElementById('quiz-badge');
  const quizScoreHeading = document.getElementById('quiz-score-heading');
  const quizScoreMessage = document.getElementById('quiz-score-message');

  let quizQuestions = [];
  let currentQ = 0;
  let score = 0;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz() {
    quizQuestions = shuffle(quizBank).map(item => {
      // shuffle options too, tracking the correct answer's new position
      const optIndices = shuffle(item.opts.map((_, i) => i));
      return {
        q: item.q,
        opts: optIndices.map(i => item.opts[i]),
        correct: optIndices.indexOf(item.correct),
        explain: item.explain
      };
    });
    currentQ = 0; score = 0;
    quizStartScreen.classList.add('hidden');
    quizResultScreen.classList.add('hidden');
    quizActiveScreen.classList.remove('hidden');
    renderQuestion();
  }

  function renderQuestion() {
    const item = quizQuestions[currentQ];
    quizQuestionEl.textContent = item.q;
    quizOptionsEl.innerHTML = '';
    quizExplainEl.hidden = true;
    quizExplainEl.textContent = '';
    quizNextBtn.hidden = true;

    item.opts.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = optText;
      btn.addEventListener('click', () => selectAnswer(idx));
      quizOptionsEl.appendChild(btn);
    });

    const pct = ((currentQ) / quizQuestions.length) * 100;
    quizProgressFill.style.width = pct + '%';
    quizProgressLabel.textContent = `Question ${currentQ + 1} of ${quizQuestions.length}`;
  }

  function selectAnswer(idx) {
    const item = quizQuestions[currentQ];
    const buttons = quizOptionsEl.querySelectorAll('.quiz-option');
    buttons.forEach(b => b.disabled = true);

    if (idx === item.correct) {
      buttons[idx].classList.add('correct');
      score++;
      playBeep(700, 0.09);
    } else {
      buttons[idx].classList.add('incorrect');
      buttons[item.correct].classList.add('correct');
      playBeep(220, 0.12);
    }

    quizExplainEl.hidden = false;
    quizExplainEl.textContent = item.explain;
    quizNextBtn.hidden = false;
    quizProgressFill.style.width = (((currentQ + 1) / quizQuestions.length) * 100) + '%';
  }

  function nextQuestion() {
    currentQ++;
    if (currentQ >= quizQuestions.length) {
      showResults();
    } else {
      renderQuestion();
    }
  }

  function showResults() {
    quizActiveScreen.classList.add('hidden');
    quizResultScreen.classList.remove('hidden');
    const total = quizQuestions.length;
    quizScoreHeading.textContent = `You scored ${score} / ${total}`;
    let message;
    if (score === total) message = "Outstanding! A perfect score — you clearly understand how the immune system protects the body.";
    else if (score >= total * 0.8) message = "Great work! You have a strong grasp of immunity and disease prevention.";
    else if (score >= total * 0.5) message = "Good effort! Revisit a few sections and try again to sharpen your understanding.";
    else message = "Thanks for trying! Explore the chapters again, then come back for another attempt.";
    quizScoreMessage.textContent = message;

    if (score >= total * 0.8) {
      quizBadge.classList.remove('hidden');
    } else {
      quizBadge.classList.add('hidden');
    }
  }

  quizStartBtn.addEventListener('click', startQuiz);
  quizRestartBtn.addEventListener('click', startQuiz);
  quizNextBtn.addEventListener('click', nextQuestion);

  /* =====================================================================
     10. MOBILE NAV TOGGLE
     ===================================================================== */
  const navToggle = document.getElementById('nav-toggle');
  const navLinksEl = document.getElementById('nav-links');
  function closeMobileNav() {
    navToggle.classList.remove('open');
    navLinksEl.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  /* =====================================================================
     11. SEARCH
     ===================================================================== */
  const searchIndex = [
    { title: 'What is the immune system?', route: 'immune', snippet: 'An overview of the body\'s defence network of organs, cells, and proteins.' },
    { title: 'Three lines of defence', route: 'immune', snippet: 'Physical barriers, the innate response, and the adaptive response.' },
    { title: 'White blood cells', route: 'immune', snippet: 'Phagocytes, B cells, T cells, and antibodies explained.' },
    { title: 'Phagocytes', route: 'immune', snippet: 'How phagocytes engulf and digest pathogens.' },
    { title: 'B cells', route: 'immune', snippet: 'How B cells produce antibodies and memory cells.' },
    { title: 'T cells', route: 'immune', snippet: 'Killer T cells and helper T cells.' },
    { title: 'Antibodies', route: 'immune', snippet: 'Y-shaped proteins that target specific antigens.' },
    { title: 'Lymph nodes', route: 'immune', snippet: 'Filtering stations packed with immune cells.' },
    { title: 'Virus vs bacteria', route: 'diseases', snippet: 'Key differences between viruses and bacteria.' },
    { title: 'Antibiotic resistance', route: 'diseases', snippet: 'How overuse of antibiotics leads to resistant bacteria.' },
    { title: 'COVID-19', route: 'diseases', snippet: 'A modern case study in immunology and public health.' },
    { title: 'Why vaccines work', route: 'vaccines', snippet: 'How vaccines train the immune system safely.' },
    { title: 'Herd immunity', route: 'vaccines', snippet: 'Population-level protection from high vaccination rates.' },
    { title: 'Vaccination timeline', route: 'vaccines', snippet: 'A history from Edward Jenner to mRNA vaccines.' },
    { title: 'Hand hygiene', route: 'prevention', snippet: 'Why and how to wash your hands properly.' },
    { title: 'Healthy lifestyle', route: 'prevention', snippet: 'Sleep, nutrition, exercise, and immune function.' },
    { title: 'Interactive quiz', route: 'quiz', snippet: '20 questions on the immune system and disease prevention.' },
    { title: 'Wudu', route: 'islam', snippet: 'Ritual washing before prayer and its hygiene connection.' },
    { title: 'Islamic teachings on cleanliness', route: 'islam', snippet: 'Hadith and Qur\'an verses about purification and health.' },
    { title: 'Quarantine in Islamic tradition', route: 'islam', snippet: 'An early instruction resembling modern quarantine.' },
    { title: 'Sources', route: 'sources', snippet: 'WHO, CDC, Better Health Channel, Mayo Clinic, and more.' }
  ];

  const searchToggle = document.getElementById('search-toggle');
  const searchOverlay = document.getElementById('search-overlay');
  const searchClose = document.getElementById('search-close');
  const searchInput = document.getElementById('search-input');
  const searchResultsEl = document.getElementById('search-results');

  function openOverlay(overlay) { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); }
  function closeOverlay(overlay) { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); }

  function renderSearchResults(query) {
    searchResultsEl.innerHTML = '';
    const q = query.trim().toLowerCase();
    if (!q) return;
    const matches = searchIndex.filter(item =>
      item.title.toLowerCase().includes(q) || item.snippet.toLowerCase().includes(q)
    );
    if (matches.length === 0) {
      const li = document.createElement('li');
      li.className = 'search-empty';
      li.textContent = `No results for "${query}". Try a different term.`;
      searchResultsEl.appendChild(li);
      return;
    }
    matches.forEach(item => {
      const li = document.createElement('li');
      li.className = 'search-result-item';
      const h4 = document.createElement('h4'); h4.textContent = item.title;
      const p = document.createElement('p'); p.textContent = item.snippet;
      li.appendChild(h4); li.appendChild(p);
      li.addEventListener('click', () => {
        window.location.hash = item.route;
        goToRoute(item.route);
        closeOverlay(searchOverlay);
        searchInput.value = '';
        searchResultsEl.innerHTML = '';
      });
      searchResultsEl.appendChild(li);
    });
  }

  searchToggle.addEventListener('click', () => { openOverlay(searchOverlay); searchInput.focus(); });
  searchClose.addEventListener('click', () => closeOverlay(searchOverlay));
  searchOverlay.addEventListener('click', (e) => { if (e.target === searchOverlay) closeOverlay(searchOverlay); });
  searchInput.addEventListener('input', () => renderSearchResults(searchInput.value));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeOverlay(searchOverlay); closeOverlay(document.getElementById('glossary-overlay')); }
  });

  /* =====================================================================
     12. GLOSSARY
     ===================================================================== */
  const glossaryTerms = [
    { term: 'Pathogen', def: 'A disease-causing organism, such as a virus, bacterium, fungus, or parasite.' },
    { term: 'Antigen', def: 'A marker molecule on the surface of a pathogen that the immune system recognises.' },
    { term: 'Antibody', def: 'A Y-shaped protein produced by plasma cells that binds to one specific antigen.' },
    { term: 'Phagocyte', def: 'A white blood cell that engulfs and digests pathogens through phagocytosis.' },
    { term: 'B cell', def: 'A white blood cell that produces antibodies once activated by a matching antigen.' },
    { term: 'T cell', def: 'A white blood cell that matures in the thymus; includes killer and helper types.' },
    { term: 'Memory cell', def: 'A long-lived B or T cell that "remembers" a pathogen for fast future responses.' },
    { term: 'Innate immunity', def: 'The fast, non-specific defences present from birth, including phagocytes and inflammation.' },
    { term: 'Adaptive immunity', def: 'The slower, highly specific immune response that creates lasting memory.' },
    { term: 'Vaccine', def: 'A preparation that trains the immune system to recognise a pathogen without causing disease.' },
    { term: 'Herd immunity', def: 'Population-level protection that occurs when enough people are immune to a disease.' },
    { term: 'Antibiotic resistance', def: 'When bacteria evolve to survive antibiotics that once killed them.' },
    { term: 'Inflammation', def: 'A defensive response that increases blood flow and immune cell activity at a site of injury or infection.' },
    { term: 'Lymph node', def: 'A small organ that filters lymph fluid and houses immune cells.' },
    { term: 'Wudu', def: 'The Islamic ritual washing performed before prayer, covering hands, mouth, nose, face, arms, and feet.' },
    { term: 'Taharah', def: 'The Arabic term for cleanliness or purification, central to Islamic practice.' },
    { term: 'Hadith', def: "A recorded saying or action of the Prophet Muhammad (peace be upon him)." }
  ];

  const glossaryToggle = document.getElementById('glossary-toggle');
  const glossaryOverlay = document.getElementById('glossary-overlay');
  const glossaryClose = document.getElementById('glossary-close');
  const glossaryList = document.getElementById('glossary-list');

  function renderGlossary() {
    glossaryList.innerHTML = '';
    glossaryTerms.forEach(item => {
      const div = document.createElement('div');
      div.className = 'glossary-term';
      const h4 = document.createElement('h4'); h4.textContent = item.term;
      const p = document.createElement('p'); p.textContent = item.def;
      div.appendChild(h4); div.appendChild(p);
      glossaryList.appendChild(div);
    });
  }
  renderGlossary();

  glossaryToggle.addEventListener('click', () => openOverlay(glossaryOverlay));
  glossaryClose.addEventListener('click', () => closeOverlay(glossaryOverlay));
  glossaryOverlay.addEventListener('click', (e) => { if (e.target === glossaryOverlay) closeOverlay(glossaryOverlay); });

  /* =====================================================================
     13. THEME TOGGLE (persisted locally in the visitor's own browser)
     ===================================================================== */
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;
  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem('immuneshield-theme', theme); } catch (e) { /* storage unavailable */ }
  }
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('immuneshield-theme') || 'dark'; } catch (e) { /* storage unavailable */ }
  applyTheme(savedTheme);
  themeToggle.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    playBeep(560, 0.05);
  });

  /* =====================================================================
     14. SOUND TOGGLE — simple WebAudio beep feedback
     ===================================================================== */
  const soundToggle = document.getElementById('sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  let soundOn = false;
  try { soundOn = localStorage.getItem('immuneshield-sound') === 'on'; } catch (e) { /* storage unavailable */ }
  let audioCtx = null;

  function setSoundIcon() { soundIcon.style.opacity = soundOn ? '1' : '0.4'; }
  setSoundIcon();

  function playBeep(freq, duration) {
    if (!soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* audio unavailable */ }
  }

  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem('immuneshield-sound', soundOn ? 'on' : 'off'); } catch (e) { /* storage unavailable */ }
    setSoundIcon();
    if (soundOn) playBeep(660, 0.08);
  });

  // Expose playBeep to functions defined earlier in this scope via closure (already in scope, no-op).

});
