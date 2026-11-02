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
