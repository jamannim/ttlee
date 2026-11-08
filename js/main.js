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
      mobileToggle.classList.toggle('active');
      const isOpen = navMenu.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', false);
      });
    });
  }

  // 2-1. 고성능 무결점 1단 이동 글라이더 (High-Performance Smooth Gliding Engine)
  const stepSections = [
    { id: 'hero', el: document.getElementById('hero'), gnb: null },
    { id: 'about', el: document.getElementById('about'), gnb: 'about' },
    { id: 'business', el: document.getElementById('business'), gnb: 'business' },
    { id: 'why', el: document.getElementById('why'), gnb: 'why' },
    { id: 'channel', el: document.getElementById('channel'), gnb: 'partnership' },
    { id: 'partnership', el: document.getElementById('partnership'), gnb: 'partnership' },
    { id: 'footer', el: document.getElementById('footer'), gnb: 'partnership' }
  ];

  let isGliding = false;
  let glideRafId = null;
  let safetyTimer = null;
  let lastWheelTime = 0;
  let currentSectionIndex = 0;
  const GLIDE_DURATION = 500; // 즉각적이고 매끄러운 500ms (지연 체감 완전 제거)
  const WHEEL_COOLDOWN = 450; // 연속 휠 입력 간 최적 쿨다운

  // 레이아웃 스래싱(강제 리플로우) 방지용 헤더 높이 캐싱
  let cachedHeaderHeight = document.querySelector('.header')?.offsetHeight || 76;
  window.addEventListener('resize', () => {
    cachedHeaderHeight = document.querySelector('.header')?.offsetHeight || 76;
  }, { passive: true });

  // easeOutCubic: 즉각적인 반응성 + 부드러운 감속으로 끊김 없는 착지 보장
  const easeOutCubic = (t) => {
    return 1 - Math.pow(1 - t, 3);
  };

  const getSectionTargetTop = (targetEl, index) => {
    if (!targetEl || index === 0) return 0;
    if (targetEl.id === 'footer') {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    const rect = targetEl.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return Math.max(0, Math.round(rect.top + scrollTop - cachedHeaderHeight + 2));
  };

  const getActiveStepIndex = () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const scrollBottom = currentScroll + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    // 문서 최하단(푸터 영역) 도달 시
    if (docHeight - scrollBottom < 40) {
      return stepSections.length - 1;
    }

    for (let i = stepSections.length - 2; i >= 0; i--) {
      const sec = stepSections[i].el;
      if (sec) {
        const top = getSectionTargetTop(sec, i);
        if (currentScroll >= top - 70) {
          return i;
        }
      }
    }
    return 0;
  };

  // 끊김 없는 유체 글라이딩 함수
  const glideToSection = (targetIndex) => {
    if (targetIndex < 0 || targetIndex >= stepSections.length) return;
    const targetItem = stepSections[targetIndex];
    if (!targetItem.el) return;

    if (glideRafId) {
      cancelAnimationFrame(glideRafId);
      glideRafId = null;
    }
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }

    const startY = window.pageYOffset || document.documentElement.scrollTop;
    const endY = getSectionTargetTop(targetItem.el, targetIndex);
    const distance = endY - startY;

    currentSectionIndex = targetIndex;

    // 미세 이동(2px 이하) 시 즉시 위치 보정 및 잠금 해제
    if (Math.abs(distance) < 2) {
      isGliding = false;
      updateActiveMenu();
      return;
    }

    isGliding = true;
    const startTime = performance.now();

    const stepFrame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / GLIDE_DURATION, 1);
      const easedT = easeOutCubic(progress);

      window.scrollTo(0, Math.round(startY + distance * easedT));

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

    // 탭 전환 등 백그라운드 환경에서도 휠이 영구 잠기지 않도록 보호하는 안전 타이머
    safetyTimer = setTimeout(() => {
      if (isGliding) {
        window.scrollTo(0, endY);
        isGliding = false;
        glideRafId = null;
        updateActiveMenu();
      }
    }, GLIDE_DURATION + 150);
  };

  // GNB 메뉴 클릭 시 글라이딩 이동
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

  // 마우스 휠 스크롤: 1단씩 즉각적이고 부드러운 글라이딩
  window.addEventListener('wheel', (e) => {
    // 모바일/태블릿에서는 휠 가로채기 방지 (자연스러운 네이티브 터치 스크롤 보장)
    if (window.innerWidth <= 1024) return;

    // 모달창 오픈 중이거나 폼 입력 중일 때는 휠 인터랙션 제외
    if (document.body.style.overflow === 'hidden') return;
    if (e.target.closest('.modal-overlay') || e.target.closest('form') || e.target.closest('textarea') || e.target.closest('input')) return;

    // 트랙패드 및 미세 진동 노이즈 무시
    if (Math.abs(e.deltaY) < 14) return;

    const now = performance.now();

    // 글라이딩 진행 중이거나 쿨다운 중일 때 휠 충돌 및 이중 스크롤 원천 차단
    if (isGliding || (now - lastWheelTime < WHEEL_COOLDOWN)) {
      e.preventDefault();
      return;
    }

    const currentIndex = (currentSectionIndex >= 0 && currentSectionIndex < stepSections.length) 
      ? currentSectionIndex 
      : getActiveStepIndex();

    if (e.deltaY > 0) {
      // 아래로 스크롤: 다음 단 이동
      if (currentIndex < stepSections.length - 1) {
        e.preventDefault();
        lastWheelTime = now;
        glideToSection(currentIndex + 1);
      }
    } else if (e.deltaY < 0) {
      // 위로 스크롤: 이전 단 이동
      if (currentIndex > 0) {
        e.preventDefault();
        lastWheelTime = now;
        glideToSection(currentIndex - 1);
      }
    }
  }, { passive: false });

  // 키보드 방향키(PageDown/PageUp/ArrowDown/ArrowUp) 연동
  window.addEventListener('keydown', (e) => {
    if (document.body.style.overflow === 'hidden') return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    const now = performance.now();
    if (isGliding || (now - lastWheelTime < 350)) return;

    const currentIndex = (currentSectionIndex >= 0 && currentSectionIndex < stepSections.length)
      ? currentSectionIndex
      : getActiveStepIndex();

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
    if (isGliding) return; // 글라이딩 애니메이션 진행 중에는 강제 리플로우(스래싱) 방지
    currentSectionIndex = getActiveStepIndex();
    const currentSection = stepSections[currentSectionIndex];
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

  // 입력값 위변조 및 악성 스크립트 방어용 정제 함수
  const sanitizeText = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  };

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = inquiryForm.querySelector('button[type="submit"]');
      const categorySelect = document.getElementById('inquiryCategory');
      const categoryText = categorySelect ? categorySelect.options[categorySelect.selectedIndex].text : '';
      const rawName = document.getElementById('inquiryName')?.value || '';
      const rawContact = document.getElementById('inquiryContact')?.value || '';
      const rawMessage = document.getElementById('inquiryMessage')?.value || '';

      const name = sanitizeText(rawName).slice(0, 50);
      const contact = sanitizeText(rawContact).slice(0, 50);
      const message = sanitizeText(rawMessage).slice(0, 2000);

      // 필수 유효성 검증
      if (!name || name.length < 2) {
        showToast('회사명 또는 신청자명을 2자 이상 입력해주세요.');
        document.getElementById('inquiryName')?.focus();
        return;
      }
      if (!contact || contact.length < 4) {
        showToast('정확한 연락처(전화번호 또는 이메일)를 입력해주세요.');
        document.getElementById('inquiryContact')?.focus();
        return;
      }
      if (!message || message.length < 5) {
        showToast('문의 및 제안 내용을 5자 이상 상세히 입력해주세요.');
        document.getElementById('inquiryMessage')?.focus();
        return;
      }

      // 중복 제출 방지 (버튼 비활성화)
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '문의 접수 처리 중...';
      }

      const inquiryData = {
        id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        date: new Date().toLocaleString('ko-KR'),
        category: categoryText,
        name,
        contact,
        message,
        status: '신규 접수'
      };

      // 1. 관리자 시스템용 브라우저 저장소에 실시간 저장
      try {
        const existing = JSON.parse(localStorage.getItem('ttlee_inquiries') || '[]');
        existing.unshift(inquiryData);
        localStorage.setItem('ttlee_inquiries', JSON.stringify(existing));
        console.info('[TTLEE] 새로운 제휴 문의가 안전하게 저장되었습니다:', inquiryData.id);
      } catch (err) {
        console.warn('localStorage 저장 실패:', err);
      }

      // 2. [추천 1위 & 2위] 설정된 이메일 및 구글 시트로 비동기 실시간 발송
      try {
        const cfg = JSON.parse(localStorage.getItem('ttlee_config') || '{}');
        const targetEmail = cfg.email || 'jamannim@gmail.com';
        const targetSheetWebhookUrl = cfg.googleSheetWebhookUrl || 'https://script.google.com/macros/s/AKfycbyKK4tk5G8qa8Va8WJHXE_KUfEITCk8O-dsVwgtXVnd1jrwskoxpdATzh6uhz447FTWjw/exec';

        // [추천 1위] 대표님 이메일 즉시 수신 (스팸 봇 방지 허니팟 포함)
        if (targetEmail) {
          const emailEndpoint = cfg.emailAccessKey 
            ? 'https://api.web3forms.com/submit'
            : `https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`;

          const emailPayload = cfg.emailAccessKey ? {
            access_key: cfg.emailAccessKey,
            subject: `[TTLEE 제휴문의] ${inquiryData.category} - ${inquiryData.name}`,
            from_name: '주식회사 뜰레(TTLEE) 고객문의 시스템',
            recipient_email: targetEmail,
            inquiry_category: inquiryData.category,
            applicant_name: inquiryData.name,
            applicant_contact: inquiryData.contact,
            message: inquiryData.message,
            submitted_at: inquiryData.date
          } : {
            _subject: `[TTLEE 제휴문의] ${inquiryData.category} - ${inquiryData.name}`,
            _honey: '',
            문의유형: inquiryData.category,
            신청자명: inquiryData.name,
            연락처: inquiryData.contact,
            문의내용: inquiryData.message,
            접수일시: inquiryData.date
          };

          fetch(emailEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(emailPayload)
          }).then(res => res.json()).then(resData => {
            console.log('[TTLEE] 이메일 알림 발송 결과:', resData);
          }).catch(err => console.warn('이메일 발송 비동기 통신:', err));
        }

        // [추천 2위] 구글 스프레드시트 Webhook 실시간 추가
        if (targetSheetWebhookUrl && (targetSheetWebhookUrl.includes('script.google.com') || targetSheetWebhookUrl.includes('/exec'))) {
          const sheetPayload = {
            category: inquiryData.category,
            name: inquiryData.name,
            contact: inquiryData.contact,
            message: inquiryData.message,
            date: inquiryData.date,
            status: inquiryData.status || '신규 접수',
            memo: '-',
            접수일시: inquiryData.date,
            문의유형: inquiryData.category,
            회사명신청자: inquiryData.name,
            신청자명: inquiryData.name,
            연락처: inquiryData.contact,
            문의내용: inquiryData.message,
            진행상태: inquiryData.status || '신규 접수',
            관리: '-'
          };

          fetch(targetSheetWebhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(sheetPayload)
          }).then(() => {
            console.log('[TTLEE] 구글 시트 데이터 전송 요청 완료');
          }).catch(err => console.warn('구글 시트 전송 통신:', err));
        }
      } catch (cfgErr) {
        console.warn('연동 설정 발송 중 예외:', cfgErr);
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '문의 신청하기';
      }

      closeInquiryModal();
      inquiryForm.reset();
      showToast('성공적으로 문의가 접수되었습니다. 담당자가 빠른 시일 내에 연락드리겠습니다.');
    });
  }

  // 7. 이용약관 및 개인정보처리방침 모달 제어
  const policyModal = document.getElementById('policyModal');
  const policyCloseBtn = document.getElementById('policyCloseBtn');
  const policyConfirmBtn = document.getElementById('policyConfirmBtn');
  const openTermsBtn = document.getElementById('openTermsBtn');
  const openPrivacyBtn = document.getElementById('openPrivacyBtn');
  const tabTermsBtn = document.getElementById('tabTermsBtn');
  const tabPrivacyBtn = document.getElementById('tabPrivacyBtn');
  const termsPanel = document.getElementById('termsPanel');
  const privacyPanel = document.getElementById('privacyPanel');

  const switchPolicyTab = (targetTab) => {
    if (targetTab === 'terms') {
      if (tabTermsBtn) tabTermsBtn.classList.add('active');
      if (tabPrivacyBtn) tabPrivacyBtn.classList.remove('active');
      if (termsPanel) termsPanel.classList.add('active');
      if (privacyPanel) privacyPanel.classList.remove('active');
    } else if (targetTab === 'privacy') {
      if (tabTermsBtn) tabTermsBtn.classList.remove('active');
      if (tabPrivacyBtn) tabPrivacyBtn.classList.add('active');
      if (termsPanel) termsPanel.classList.remove('active');
      if (privacyPanel) privacyPanel.classList.add('active');
    }
  };

  const openPolicyModal = (initialTab = 'terms') => {
    switchPolicyTab(initialTab);
    if (policyModal) {
      policyModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closePolicyModal = () => {
    if (policyModal) {
      policyModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (openTermsBtn) {
    openTermsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPolicyModal('terms');
    });
  }

  if (openPrivacyBtn) {
    openPrivacyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPolicyModal('privacy');
    });
  }

  if (tabTermsBtn) {
    tabTermsBtn.addEventListener('click', () => switchPolicyTab('terms'));
  }

  if (tabPrivacyBtn) {
    tabPrivacyBtn.addEventListener('click', () => switchPolicyTab('privacy'));
  }

  if (policyCloseBtn) {
    policyCloseBtn.addEventListener('click', closePolicyModal);
  }

  if (policyConfirmBtn) {
    policyConfirmBtn.addEventListener('click', closePolicyModal);
  }

  if (policyModal) {
    policyModal.addEventListener('click', (e) => {
      if (e.target === policyModal) closePolicyModal();
    });
  }

  // ESC 키 누르면 모든 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVideoModal();
      closeInquiryModal();
      closePolicyModal();
    }
  });
});
