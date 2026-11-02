/**
 * 뜰레(TTLEE) 반응형 랜딩페이지 자바스크립트
 * - 네비게이션 스크롤 효과 & 모바일 토글
 * - 플랫폼 탭 전환 (YouTube / TikTok)
 * - 비디오 플레이어 모달 (YouTube 임베드 제어)
 * - 파트너십 문의 모달 및 자동 카테고리 매핑
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 헤더 스크롤 효과
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 2. 모바일 메뉴 토글
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', false);
      });
    });
  }

  // 2-1. 유체역학적 1단 이동 글라이더 (Liquid Step Gliding Engine)
  const stepSections = [
    { id: 'hero', el: document.getElementById('hero'), gnb: null },
    { id: 'about', el: document.getElementById('about'), gnb: 'about' },
    { id: 'business', el: document.getElementById('business'), gnb: 'business' },
    { id: 'why', el: document.getElementById('why'), gnb: 'why' },
    { id: 'channel', el: document.getElementById('channel'), gnb: 'partnership' },
    { id: 'partnership', el: document.getElementById('partnership'), gnb: 'partnership' }
  ];

  let isGliding = false;
  let glideRafId = null;
  let lastWheelTime = 0;
  const GLIDE_DURATION = 900; // 물 흐르듯 유려한 900ms 글라이딩
  const WHEEL_COOLDOWN = 800; // 연속 스크롤 시 부드러운 전환 대기 시간

  // 물 흐르듯 자연스러운 유선형 완화 곡선 (easeInOutCubic: 부드러운 출발 -> 유려한 활주 -> 깃털 같은 부드러운 착지)
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const getSectionTargetTop = (targetEl, index) => {
    if (!targetEl || index === 0) return 0;
    const headerHeight = document.querySelector('.header')?.offsetHeight || 76;
    return Math.max(0, targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight + 2);
  };

  const getActiveStepIndex = () => {
    const headerHeight = document.querySelector('.header')?.offsetHeight || 76;
    const currentScroll = window.scrollY + headerHeight + 60;
    for (let i = stepSections.length - 1; i >= 0; i--) {
      const sec = stepSections[i].el;
      if (sec && currentScroll >= sec.offsetTop) {
        return i;
      }
    }
    return 0;
  };

  // 물 흐르듯 실키하게 목표 단으로 이동하는 글라이딩 함수
  const glideToSection = (targetIndex) => {
    if (targetIndex < 0 || targetIndex >= stepSections.length) return;
    const targetItem = stepSections[targetIndex];
    if (!targetItem.el) return;

    if (glideRafId) cancelAnimationFrame(glideRafId);

    const startY = window.pageYOffset || document.documentElement.scrollTop;
    const endY = getSectionTargetTop(targetItem.el, targetIndex);
    const distance = endY - startY;

    if (Math.abs(distance) < 2) return;

    isGliding = true;
    const startTime = performance.now();

    const stepFrame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / GLIDE_DURATION, 1);
      const easedT = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * easedT);

      if (progress < 1) {
        glideRafId = requestAnimationFrame(stepFrame);
      } else {
        window.scrollTo(0, endY);
        isGliding = false;
        glideRafId = null;
        updateActiveMenu();
      }
    };

    glideRafId = requestAnimationFrame(stepFrame);
  };

  // GNB 메뉴 클릭 시 물 흐르듯 자연스러운 글라이딩 이동
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = href.replace('#', '');
        const targetIdx = stepSections.findIndex(s => s.id === id);
        if (targetIdx !== -1) {
          e.preventDefault();
          glideToSection(targetIdx);
        }
      }
    });
  });

  // 마우스 휠 스크롤: 물 흐르듯 자연스럽게 1단씩 글라이딩
  window.addEventListener('wheel', (e) => {
    // 모달창 오픈 중이거나 폼 입력 중일 때는 휠 인터랙션 제외
    if (document.body.style.overflow === 'hidden') return;
    if (e.target.closest('.modal-overlay') || e.target.closest('form') || e.target.closest('textarea') || e.target.closest('input')) return;

    // 미세 떨림 무시
    if (Math.abs(e.deltaY) < 18) return;

    const now = performance.now();

    // 글라이딩 진행 중이거나 쿨다운 중일 때 휠 충돌 방지
    if (isGliding || (now - lastWheelTime < WHEEL_COOLDOWN)) {
      e.preventDefault();
      return;
    }

    const currentIndex = getActiveStepIndex();

    if (e.deltaY > 0) {
      // 아래로 스크롤: 다음 단으로 물 흐르듯 이동
      if (currentIndex < stepSections.length - 1) {
        e.preventDefault();
        lastWheelTime = now;
        glideToSection(currentIndex + 1);
      }
    } else if (e.deltaY < 0) {
      // 위로 스크롤: 이전 단으로 물 흐르듯 이동
      if (currentIndex > 0) {
        e.preventDefault();
        lastWheelTime = now;
        glideToSection(currentIndex - 1);
      }
    }
  }, { passive: false });

  // 키보드 방향키(PageDown/PageUp/ArrowDown/ArrowUp)로도 유려한 글라이딩 지원
  window.addEventListener('keydown', (e) => {
    if (document.body.style.overflow === 'hidden') return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    const now = performance.now();
    if (isGliding || (now - lastWheelTime < 400)) return;

    const currentIndex = getActiveStepIndex();
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      if (currentIndex < stepSections.length - 1) {
        e.preventDefault();
        lastWheelTime = now;
        glideToSection(currentIndex + 1);
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      if (currentIndex > 0) {
        e.preventDefault();
        lastWheelTime = now;
        glideToSection(currentIndex - 1);
      }
    }
  });

  // GNB 메뉴 실시간 Active 표시 업데이트 (현재 보고 있는 섹션 표시)
  const setActiveNavLink = (gnbId) => {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (gnbId && href === `#${gnbId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  const updateActiveMenu = () => {
    const currentIndex = getActiveStepIndex();
    const currentSection = stepSections[currentIndex];
    setActiveNavLink(currentSection ? currentSection.gnb : null);
  };

  window.addEventListener('scroll', updateActiveMenu, { passive: true });
  updateActiveMenu();

  // 3. 채널 탭 전환 (YouTube vs TikTok)
  const tabButtons = document.querySelectorAll('.platform-tab-btn');
  const youtubePanel = document.querySelector('.youtube-panel');
  const tiktokPanel = document.querySelector('.tiktok-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.tab;
      if (target === 'youtube') {
        youtubePanel.classList.remove('hidden');
        tiktokPanel.classList.remove('active');
      } else if (target === 'tiktok') {
        youtubePanel.classList.add('hidden');
        tiktokPanel.classList.add('active');
      }
    });
  });

  // 4. 비디오 재생 모달
  const videoModal = document.getElementById('videoModal');
  const videoIframe = document.getElementById('videoIframe');
  const videoCloseBtn = document.getElementById('videoCloseBtn');
  const videoCards = document.querySelectorAll('.js-video-play');

  videoCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const videoId = card.dataset.videoId;
      if (videoId && videoIframe && videoModal) {
        videoIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeVideoModal = () => {
    if (videoModal && videoIframe) {
      videoModal.classList.remove('active');
      videoIframe.src = '';
      document.body.style.overflow = '';
    }
  };

  if (videoCloseBtn) {
    videoCloseBtn.addEventListener('click', closeVideoModal);
  }
  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) closeVideoModal();
    });
  }

  // 5. 파트너십 문의 모달
  const inquiryModal = document.getElementById('inquiryModal');
  const inquiryCloseBtn = document.getElementById('inquiryCloseBtn');
  const inquiryCategorySelect = document.getElementById('inquiryCategory');
  const inquiryTriggers = document.querySelectorAll('.js-open-inquiry');

  inquiryTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const category = btn.dataset.category || 'manufacture';
      if (inquiryCategorySelect) {
        inquiryCategorySelect.value = category;
      }
      if (inquiryModal) {
        inquiryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeInquiryModal = () => {
    if (inquiryModal) {
      inquiryModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (inquiryCloseBtn) {
    inquiryCloseBtn.addEventListener('click', closeInquiryModal);
  }
  if (inquiryModal) {
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) closeInquiryModal();
    });
  }

  // 6. 문의 폼 제출 이벤트 (토스트 피드백)
  const inquiryForm = document.getElementById('inquiryForm');
  const toastNotice = document.getElementById('toastNotice');

  const showToast = (message) => {
    if (toastNotice) {
      toastNotice.textContent = message;
      toastNotice.classList.add('show');
      setTimeout(() => {
        toastNotice.classList.remove('show');
      }, 3500);
    }
  };

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const categorySelect = document.getElementById('inquiryCategory');
      const categoryText = categorySelect ? categorySelect.options[categorySelect.selectedIndex].text : '';
      const name = document.getElementById('inquiryName')?.value || '';
      const contact = document.getElementById('inquiryContact')?.value || '';
      const message = document.getElementById('inquiryMessage')?.value || '';

      const inquiryData = {
        id: 'inq_' + Date.now(),
        date: new Date().toLocaleString('ko-KR'),
        category: categoryText,
        name,
        contact,
        message
      };

      // 브라우저 localStorage에 실시간 저장 (확인 및 테스트용)
      try {
        const existing = JSON.parse(localStorage.getItem('ttlee_inquiries') || '[]');
        existing.unshift(inquiryData);
        localStorage.setItem('ttlee_inquiries', JSON.stringify(existing));
        console.info('[TTLEE] 새로운 제휴 문의가 저장되었습니다:', inquiryData);
      } catch (err) {
        console.warn('localStorage 저장 실패:', err);
      }

      closeInquiryModal();
      inquiryForm.reset();
      showToast('성공적으로 문의가 접수되었습니다. 담당자가 빠른 시일 내에 연락드리겠습니다.');
    });
  }

  // ESC 키 누르면 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVideoModal();
      closeInquiryModal();
    }
  });
});
