/**
 * Daniyal Atta — AI Portfolio
 * Interactive Background Image Sequence with GSAP & ScrollTrigger
 */

(function () {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 201;
  const FRAME_PREFIX = 'dani/ezgif-frame-';
  const FRAME_EXT = '.jpg';

  // --- DOM Elements ---
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const contentWrapper = document.getElementById('content-wrapper');
  const bgOverlay = document.getElementById('bg-overlay');
  const toastContainer = document.getElementById('toast-container');

  // Image caching state
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  const sequence = { frame: 0 };

  // Format frame number to 3-digit string: 1 -> "001", 201 -> "201"
  function getFrameSrc(index) {
    const num = (index + 1).toString().padStart(3, '0');
    return `${FRAME_PREFIX}${num}${FRAME_EXT}`;
  }

  // --- Canvas Sizing & High DPI Handling ---
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    renderCanvas();
  }

  // Find nearest loaded frame if current frame is still buffering
  function getBestAvailableImage(targetIndex) {
    if (images[targetIndex] && images[targetIndex].complete && images[targetIndex].naturalWidth > 0) {
      return images[targetIndex];
    }
    // Search backward
    for (let i = targetIndex - 1; i >= 0; i--) {
      if (images[i] && images[i].complete && images[i].naturalWidth > 0) {
        return images[i];
      }
    }
    // Search forward
    for (let i = targetIndex + 1; i < TOTAL_FRAMES; i++) {
      if (images[i] && images[i].complete && images[i].naturalWidth > 0) {
        return images[i];
      }
    }
    return null;
  }

  // Draw current frame to canvas using "object-fit: cover" calculation
  function renderCanvas() {
    if (!canvas || !ctx) return;

    const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(sequence.frame)));
    const img = getBestAvailableImage(frameIdx);

    if (!img) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Aspect ratio math for Cover
    const hRatio = canvasWidth / img.width;
    const vRatio = canvasHeight / img.height;
    const ratio = Math.max(hRatio, vRatio);

    const renderWidth = img.width * ratio;
    const renderHeight = img.height * ratio;
    const offsetX = (canvasWidth - renderWidth) / 2;
    const offsetY = (canvasHeight - renderHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, renderWidth, renderHeight);
  }

  // --- Progressive Image Preloader ---
  function initPreloader() {
    // 1. Immediately load frame 1 for instant first paint
    const firstImg = new Image();
    firstImg.src = getFrameSrc(0);
    firstImg.onload = () => {
      images[0] = firstImg;
      loadedCount++;
      resizeCanvas();
      renderCanvas();
      loadRemainingFrames();
    };
    firstImg.onerror = () => {
      console.warn('First frame failed to load:', firstImg.src);
      loadRemainingFrames();
    };
  }

  function loadRemainingFrames() {
    // Load remaining frames in batches to maintain high responsiveness
    const concurrency = 8;
    let nextIndex = 1;

    function loadNext() {
      if (nextIndex >= TOTAL_FRAMES) return;
      const idx = nextIndex++;
      const img = new Image();
      img.src = getFrameSrc(idx);

      img.onload = () => {
        images[idx] = img;
        loadedCount++;
        loadNext();
      };

      img.onerror = () => {
        loadedCount++;
        loadNext();
      };
    }

    for (let c = 0; c < concurrency; c++) {
      loadNext();
    }
  }

  // --- GSAP ScrollTrigger Sequence Setup ---
  function setupScrollSequence() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.error('GSAP or ScrollTrigger not found');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Pin & scrub image sequence across entire page scroll from top to bottom
    gsap.to(sequence, {
      frame: TOTAL_FRAMES - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: contentWrapper || document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2, // Buttery smooth scrubbing
        onUpdate: renderCanvas
      }
    });

    // Content reveal animations
    gsap.utils.toArray('.reveal-up').forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
    });

    gsap.utils.toArray('.reveal-card').forEach((el, index) => {
      gsap.from(el, {
        y: 45,
        opacity: 0,
        duration: 0.8,
        delay: (index % 3) * 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        }
      });
    });

    // Header scroll background change
    const navbar = document.getElementById('navbar');
    if (navbar) {
      ScrollTrigger.create({
        start: 'top -50',
        end: 99999,
        toggleClass: { className: 'nav-scrolled', targets: navbar }
      });
    }
  }

  // --- Interactive UI Controls ---
  function initControls() {
    // Resize Listener
    window.addEventListener('resize', resizeCanvas);

    // Mobile Navigation Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
      document.querySelectorAll('.mobile-nav-link').forEach((link) => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
        });
      });
    }

    // Skills Filter Tabs
    const skillTabs = document.querySelectorAll('.skill-filter-btn');
    const skillCards = document.querySelectorAll('.skill-item');
    skillTabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        skillTabs.forEach((b) => {
          b.classList.remove('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/50');
          b.classList.add('bg-slate-800/60', 'text-slate-400', 'border-slate-700/40');
        });
        btn.classList.remove('bg-slate-800/60', 'text-slate-400', 'border-slate-700/40');
        btn.classList.add('bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/50');

        const category = btn.getAttribute('data-category');
        skillCards.forEach((card) => {
          if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // Copy to clipboard helper
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(() => {
          showToast(`Copied to clipboard: ${text}`);
        });
      });
    });

    // Contact Form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('form-name')?.value || '';
        const email = document.getElementById('form-email')?.value || '';
        const subject = document.getElementById('form-subject')?.value || 'AI Research Inquiry';
        const message = document.getElementById('form-message')?.value || '';

        const mailtoUrl = `mailto:daniyal60480@gmail.com?subject=${encodeURIComponent(
          `[Portfolio Contact] ${subject} from ${name}`
        )}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;

        window.open(mailtoUrl, '_blank');
        showToast('Opening your mail client to send message to Daniyal Atta...');
        contactForm.reset();
      });
    }
  }

  // --- Toast Notification Helper ---
  function showToast(msg) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className =
      'glass-card px-4 py-2.5 rounded-xl text-sm text-slate-100 flex items-center gap-2 border border-cyan-500/30 shadow-2xl transition-all duration-300 transform translate-y-2 opacity-0';
    toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span><span>${msg}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Project Modal Viewer ---
  window.openProjectModal = function (projectId) {
    const modal = document.getElementById('project-modal');
    const content = document.getElementById('project-modal-content');
    if (!modal || !content) return;

    const data = projectDetails[projectId];
    if (!data) return;

    content.innerHTML = `
      <div class="flex items-start justify-between border-b border-slate-700/60 pb-4 mb-5">
        <div>
          <span class="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold">${data.subtitle}</span>
          <h3 class="text-2xl font-bold text-white mt-1">${data.title}</h3>
          <p class="text-sm text-slate-400 mt-0.5">${data.period} · ${data.role}</p>
        </div>
        <button onclick="closeProjectModal()" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>
      </div>

      <div class="space-y-4 text-slate-300 text-sm leading-relaxed">
        <p class="text-base text-slate-200">${data.description}</p>
        
        <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-mono mb-2">Key Research & Technical Highlights:</h4>
          <ul class="list-disc list-inside space-y-2 text-slate-300">
            ${data.highlights.map((h) => `<li>${h}</li>`).join('')}
          </ul>
        </div>

        <div>
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-mono mb-2">Technology Stack:</h4>
          <div class="flex flex-wrap gap-2">
            ${data.tech.map((t) => `<span class="px-2.5 py-1 text-xs font-mono rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">${t}</span>`).join('')}
          </div>
        </div>

        <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-mono">${data.repoName}</span>
          <a href="${data.github}" target="_blank" rel="noopener noreferrer" 
             class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition">
            <span>View Source on GitHub</span>
            <i data-lucide="external-link" class="w-4 h-4"></i>
          </a>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeProjectModal = function () {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  // Detailed data for projects
  const projectDetails = {
    fakeguard: {
      title: 'FakeGuard AI — Real-Time Fake Review Detection & Multilingual Sentiment Analysis',
      subtitle: 'Undergraduate Thesis / Final Year Project',
      period: 'Jun 2025 – Dec 2025',
      role: 'Lead AI Researcher & Developer',
      description:
        'A comprehensive undergraduate thesis project engineered to detect deceptive reviews and synthesize multilingual sentiments in real time using an ensemble of state-of-the-art Natural Language Processing architectures.',
      highlights: [
        'Engineered a hybrid pipeline harmonizing classical Machine Learning (SVM, Random Forests), Bidirectional LSTMs, and fine-tuned BERT transformers.',
        'Extracted aspect-based sentiment features and computed real-time confidence scores with calibrated probability distribution.',
        'Attained 95%+ classification accuracy on benchmark datasets, surpassing baseline models.',
        'Integrated Explainable AI (XAI) feature attribution maps for transparent prediction interpretability.',
        'Constructed a production-grade Streamlit web interface for interactive batch analysis and live review auditing.'
      ],
      tech: ['Python', 'TensorFlow', 'BERT', 'Scikit-Learn', 'LSTM', 'SVM', 'Streamlit', 'Explainable AI', 'NLP'],
      repoName: 'DaniyalJutt/FakeGuard-AI',
      github: 'https://github.com/DaniyalJutt/FakeGuard-AI'
    },
    multiagent: {
      title: 'Autonomous Multi-Agent Agentic AI Research System',
      subtitle: 'Agentic AI & LLM Systems',
      period: 'Apr 2026 – Jun 2026',
      role: 'AI Systems Architect',
      description:
        'An autonomous research workspace composed of specialized intelligent agents working synchronously to conduct in-depth scientific and market research, critique intermediate reasoning, and synthesize verified reports.',
      highlights: [
        'Designed four discrete agent roles: Web Searcher, Contextual Reader, Synthesis Writer, and Adversarial Critic.',
        'Orchestrated multi-agent task execution and state graph transitions utilizing LangChain LCEL (LangChain Expression Language).',
        'Implemented an RLHF-style iterative critique loop where the Critic agent challenges unverified assertions against Tavily live web retrieval.',
        'Reduced hallucination rates drastically compared to naive zero-shot LLM prompts while generating fully cited Markdown dossiers.'
      ],
      tech: ['LangChain (LCEL)', 'OpenAI GPT-4', 'Tavily API', 'Agentic Workflows', 'RLHF Critic Loops', 'Python'],
      repoName: 'DaniyalJutt/Autonomous-Multi-Agent-Agentic-AI-Research-System',
      github: 'https://github.com/DaniyalJutt/Autonomous-Multi-Agent-Agentic-AI-Research-System'
    },
    aitwin: {
      title: 'AI-Twin-X — Personalized AI Digital Twin Platform',
      subtitle: 'Generative AI & Multimodal Platform',
      period: 'Jan 2026 – Jun 2026',
      role: 'Full-Stack AI Engineer',
      description:
        'A unified multimodal digital twin engine that acts as Daniyal’s personalized conversational avatar across Instagram, WhatsApp, and Threads, equipped with authentic voice synthesis and vector-backed memory.',
      highlights: [
        'Orchestrated ultra-low latency conversational responses using Groq API and open-weight models.',
        'Integrated ChromaDB vector store paired with sentence-transformers for RAG-driven retrieval of personal history, knowledge, and style.',
        'Enabled high-fidelity voice cloning via Coqui TTS to produce audio notes that accurately mirror authentic voice timbre and cadence.',
        'Constructed a centralized React administration dashboard with real-time websocket monitoring of active chats and system metrics.'
      ],
      tech: ['Django', 'Django REST Framework', 'Groq API', 'ChromaDB', 'Sentence-Transformers', 'Coqui TTS', 'React', 'Twilio'],
      repoName: 'DaniyalJutt/AI-Twin-X',
      github: 'https://github.com/DaniyalJutt/AI-Twin-X'
    },
    kaggle: {
      title: 'Competitive AI/ML Kaggle Repository',
      subtitle: 'Global Kaggle Expert · 10 Competition Medals',
      period: '2022 – 2026',
      role: 'Kaggle Competitor & ML Researcher',
      description:
        'A comprehensive repository containing 20+ competitive and applied machine learning solutions spanning NLP, computer vision, time-series forecasting, and tabular tabular data modeling.',
      highlights: [
        'Attained the prestigious global "Kaggle Expert" tier with 10 medals awarded across NLP, reasoning benchmarks, and computer vision.',
        'Built advanced NLP classification models for AI-generated text detection, fine-grained sentiment analysis, and adversarial evasion.',
        'Engineered regression models for cryptocurrency price prediction, heart BPM estimation, and sleep disorder risk using XGBoost and LightGBM.',
        'Formulated big-data analytical dashboards (Uber Rides, English Premier League analytics, Global GDP) with Google BigQuery SQL.'
      ],
      tech: ['PyTorch', 'TensorFlow', 'XGBoost', 'LightGBM', 'BERT', 'BigQuery', 'Scikit-Learn', 'Pandas', 'NumPy'],
      repoName: 'DaniyalJutt/AI-ML-Kaggle-Projects',
      github: 'https://github.com/DaniyalJutt/AI-ML-Kaggle-Projects'
    },
    pdfbrain: {
      title: 'PDF-Brain: Intelligent Document Q&A Engine',
      subtitle: 'Low-Latency Neural RAG Pipeline',
      period: 'Sep 2024 – Dec 2024',
      role: 'AI/NLP Developer',
      description:
        'An enterprise-grade document intelligence assistant that parses arbitrarily structured PDF documents, vectorizes textual knowledge, and generates source-grounded answers with precise citations.',
      highlights: [
        'Engineered an optimized document chunking, overlap, and dense vector indexing pipeline using FAISS.',
        'Harnessed Groq LPUs alongside Google Gemma models to attain sub-second response latency.',
        'Enforced strict hallucination mitigations by ensuring each synthesized sentence provides direct chunk-level citations to source pages.',
        'Built an intuitive Streamlit interface enabling drag-and-drop document uploads and conversational interrogation.'
      ],
      tech: ['Python', 'LangChain', 'FAISS', 'Groq API', 'Gemma', 'Streamlit', 'RAG'],
      repoName: 'DaniyalJutt/PDF-Brain-Intelligent-Q-A-with-Gemma-Groq-API',
      github: 'https://github.com/DaniyalJutt/PDF-Brain-Intelligent-Q-A-with-Gemma-Groq-API'
    }
  };

  // --- Initialize on DOM Loaded ---
  window.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    setupScrollSequence();
    initControls();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
})();
