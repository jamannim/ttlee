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

  // 2-1. GNB 메뉴 스크롤스파이 & 1단 이동 모션 (현재 메뉴 실시간 강조 및 단별 이동)
  const gnbSections = [
    { id: 'about', el: document.getElementById('about') },
    { id: 'business', el: document.getElementById('business') },
    { id: 'why', el: document.getElementById('why') },
    { id: 'partnership', el: document.getElementById('partnership') }
  ];
  const stepIds = ['about', 'business', 'why', 'partnership'];
  const stepDotLinks = document.querySelectorAll('.js-step-dot');

  // 섹션 ID로 부드럽게 1단 이동하는 모션 함수
  const scrollToSectionById = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const headerHeight = document.querySelector('.header')?.offsetHeight || 76;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 2;
    window.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    });
  };

  // GNB 메뉴 클릭 시 부드러운 1단 이동 모션
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = href.replace('#', '');
        if (document.getElementById(id)) {
          e.preventDefault();
          scrollToSectionById(id);
        }
      }
    });
  });

  // 우측 도트 네비게이션 클릭 시 해당 단으로 1단 이동
  stepDotLinks.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const stepId = dot.dataset.step;
      if (stepId) scrollToSectionById(stepId);
    });
  });

  // 우측 이전 단 / 다음 단 화살표 컨트롤러
  const prevStepBtn = document.querySelector('.js-step-prev');
  const nextStepBtn = document.querySelector('.js-step-next');

  const getCurrentStepIndex = () => {
    const scrollPosition = window.scrollY + 160;
    for (let i = stepIds.length - 1; i >= 0; i--) {
      const el = document.getElementById(stepIds[i]);
      if (el && scrollPosition >= el.offsetTop) {
        return i;
      }
    }
    return 0;
  };

  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', () => {
      const currentIndex = getCurrentStepIndex();
      if (currentIndex > 0) {
        scrollToSectionById(stepIds[currentIndex - 1]);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', () => {
      const currentIndex = getCurrentStepIndex();
      if (currentIndex < stepIds.length - 1) {
        scrollToSectionById(stepIds[currentIndex + 1]);
      } else {
        scrollToSectionById('partnership');
      }
    });
  }

  const setActiveNavLink = (sectionId) => {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (sectionId && href === `#${sectionId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    stepDotLinks.forEach(dot => {
      if (dot.dataset.step === sectionId) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  };

  const updateActiveMenu = () => {
    const scrollPosition = window.scrollY + 140; // 헤더 높이(76px) + 뷰포트 버퍼
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 페이지 최하단(푸터 영역) 도달 시 마지막 '파트너쉽' 메뉴 활성화
    if (window.scrollY + windowHeight >= documentHeight - 60) {
      setActiveNavLink('partnership');
      return;
    }

    let activeId = '';

    // 섹션별 상단 도달 검사
    for (let i = 0; i < gnbSections.length; i++) {
      const section = gnbSections[i];
      if (section.el) {
        const top = section.el.offsetTop;
        const height = section.el.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
          activeId = section.id;
          break;
        }
      }
    }

    // Section 05 (채널 영역) 통과 시 파트너쉽과 자연스럽게 연계
    if (!activeId) {
      const channelSec = document.getElementById('channel');
      if (channelSec) {
        const cTop = channelSec.offsetTop;
        const cHeight = channelSec.offsetHeight;
        if (scrollPosition >= cTop && scrollPosition < cTop + cHeight) {
          activeId = 'partnership';
        }
      }
    }

    setActiveNavLink(activeId);
  };

  window.addEventListener('scroll', updateActiveMenu, { passive: true });
  updateActiveMenu(); // 초기 실행

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
