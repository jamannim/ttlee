/**
 * 주식회사 뜰레(TTLEE) 제휴·입점 문의 관리자 시스템 스크립트 (admin.js)
 * - 보안 강화: SHA-256 단방향 암호화 해시 인증, 무차별 대입(Brute-force) 잠금 방어
 * - XSS 방지: 이벤트 위임(Event Delegation) 기반 DOM 렌더링 및 철저한 이스케이프
 * - 실시간 데이터 동기화 및 엑셀(CSV UTF-8 BOM) 다운로드
 */

document.addEventListener('DOMContentLoaded', () => {
  // 기본 초기 비밀번호 해시: SHA-256("ttlee2026!")
  const DEFAULT_PASSWORD_HASH = '9851fbcbe126d4de9bb695cea052ea992f01f856be9730c562573f528fd7e701';
  const STORAGE_KEY_INQUIRIES = 'ttlee_inquiries';
  const STORAGE_KEY_CONFIG = 'ttlee_config';
  const STORAGE_KEY_PASSWORD_HASH = 'ttlee_admin_pwd_hash';
  const STORAGE_KEY_LEGACY_PWD = 'ttlee_admin_pwd';
  const SESSION_KEY_AUTH = 'ttlee_admin_auth';

  // 요소 참조
  const loginScreen = document.getElementById('loginScreen');
  const loginForm = document.getElementById('loginForm');
  const adminPasswordInput = document.getElementById('adminPassword');
  const loginLockoutMsg = document.getElementById('loginLockoutMsg');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminToast = document.getElementById('adminToast');

  // KPI 요소
  const totalCountEl = document.getElementById('totalCount');
  const newCountEl = document.getElementById('newCount');
  const progressCountEl = document.getElementById('progressCount');
  const doneCountEl = document.getElementById('doneCount');
  const filteredCountEl = document.getElementById('filteredCount');

  // 필터 및 테이블 요소
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');
  const inquiryTableBody = document.getElementById('inquiryTableBody');
  const emptyState = document.getElementById('emptyState');
  const exportExcelBtn = document.getElementById('exportExcelBtn');

  // 상세 모달 요소
  const detailModal = document.getElementById('detailModal');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const modalDetailMeta = document.getElementById('modalDetailMeta');
  const modalDetailName = document.getElementById('modalDetailName');
  const modalDetailContact = document.getElementById('modalDetailContact');
  const modalDetailMessage = document.getElementById('modalDetailMessage');
  const modalStatusSelect = document.getElementById('modalStatusSelect');
  const modalAdminMemo = document.getElementById('modalAdminMemo');
  const copyContactBtn = document.getElementById('copyContactBtn');
  const telContactLink = document.getElementById('telContactLink');
  const saveDetailBtn = document.getElementById('saveDetailBtn');
  const deleteInquiryBtn = document.getElementById('deleteInquiryBtn');

  // 설정 모달 요소
  const settingsModal = document.getElementById('settingsModal');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  const settingEmail = document.getElementById('settingEmail');
  const settingSheetWebhook = document.getElementById('settingSheetWebhook');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const testEmailBtn = document.getElementById('testEmailBtn');
  const testSheetBtn = document.getElementById('testSheetBtn');
  const copyAppsScriptBtn = document.getElementById('copyAppsScriptBtn');
  const currentAdminPassword = document.getElementById('currentAdminPassword');
  const newAdminPassword = document.getElementById('newAdminPassword');
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  let currentSelectedId = null;
  let inquiries = [];

  // 무차별 대입 방어 상태 관리
  let failedAttempts = 0;
  let lockoutTimer = null;
  let lockoutRemaining = 0;

  // SHA-256 해시 함수 (Native Web Crypto API)
  const hashPassword = async (text) => {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.warn('Web Crypto API 미지원 대체 해시 동작:', err);
      // 단순 폴백 해시 (비상용)
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
      }
      return 'hash_' + hash;
    }
  };

  // 현재 유효한 비밀번호 해시 가져오기 (레거시 평문 마이그레이션 포함)
  const getStoredPasswordHash = async () => {
    // 1. 이미 SHA-256 해시가 저장된 경우
    const storedHash = localStorage.getItem(STORAGE_KEY_PASSWORD_HASH);
    if (storedHash) return storedHash;

    // 2. 레거시 평문 비밀번호가 있는 경우 해시로 즉시 자동 변환 마이그레이션
    const legacyPwd = localStorage.getItem(STORAGE_KEY_LEGACY_PWD);
    if (legacyPwd) {
      const convertedHash = await hashPassword(legacyPwd);
      localStorage.setItem(STORAGE_KEY_PASSWORD_HASH, convertedHash);
      localStorage.removeItem(STORAGE_KEY_LEGACY_PWD);
      return convertedHash;
    }

    // 3. 최초 접속 시 기본 비밀번호 해시
    return DEFAULT_PASSWORD_HASH;
  };

  // 토스트 메시지 함수
  const showToast = (message) => {
    if (!adminToast) return;
    adminToast.textContent = message;
    adminToast.classList.add('show');
    setTimeout(() => {
      adminToast.classList.remove('show');
    }, 3200);
  };

  // HTML 이스케이프 함수 (XSS 방지)
  const escapeHtml = (text) => {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  };

  // 1. 인증 검사
  const checkAuth = () => {
    const isAuth = sessionStorage.getItem(SESSION_KEY_AUTH);
    if (isAuth === 'true') {
      if (loginScreen) loginScreen.style.display = 'none';
      loadInquiries();
    } else {
      if (loginScreen) loginScreen.style.display = 'flex';
      if (adminPasswordInput) adminPasswordInput.focus();
    }
  };

  // 로그인 폼 제출 처리 (SHA-256 검증 + 무차별 대입 방어)
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (lockoutRemaining > 0) {
      alert(`보안 잠금 상태입니다. ${lockoutRemaining}초 후에 다시 시도해주세요.`);
      return;
    }

    const entered = adminPasswordInput.value.trim();
    if (!entered) return;

    const enteredHash = await hashPassword(entered);
    const validHash = await getStoredPasswordHash();

    if (enteredHash === validHash) {
      failedAttempts = 0;
      sessionStorage.setItem(SESSION_KEY_AUTH, 'true');
      if (loginScreen) loginScreen.style.display = 'none';
      adminPasswordInput.value = '';
      if (loginLockoutMsg) loginLockoutMsg.style.display = 'none';
      showToast('보안 인증 완료: 대시보드에 접속했습니다.');
      loadInquiries();
    } else {
      failedAttempts += 1;
      adminPasswordInput.value = '';
      adminPasswordInput.focus();

      if (failedAttempts >= 5) {
        // 5회 실패 시 30초 잠금
        lockoutRemaining = 30;
        if (loginLockoutMsg) {
          loginLockoutMsg.style.display = 'block';
          loginLockoutMsg.textContent = `🚨 비밀번호 5회 연속 불일치로 보안상 30초간 접속이 제한됩니다.`;
        }
        adminPasswordInput.disabled = true;

        lockoutTimer = setInterval(() => {
          lockoutRemaining -= 1;
          if (lockoutRemaining <= 0) {
            clearInterval(lockoutTimer);
            failedAttempts = 0;
            adminPasswordInput.disabled = false;
            if (loginLockoutMsg) loginLockoutMsg.style.display = 'none';
            adminPasswordInput.focus();
          } else if (loginLockoutMsg) {
            loginLockoutMsg.textContent = `🚨 보안 잠금 진행 중: ${lockoutRemaining}초 후 다시 시도하실 수 있습니다.`;
          }
        }, 1000);
      } else {
        alert(`비밀번호가 일치하지 않습니다. (오류 ${failedAttempts}/5회)`);
      }
    }
  });

  logoutBtn.addEventListener('click', () => {
    if (confirm('관리자 계정에서 안전하게 로그아웃 하시겠습니까?')) {
      sessionStorage.removeItem(SESSION_KEY_AUTH);
      if (loginScreen) loginScreen.style.display = 'flex';
      adminPasswordInput.value = '';
      showToast('로그아웃되었습니다.');
    }
  });

  // 2. 데이터 로드 및 초기화
  const loadInquiries = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_INQUIRIES);
      if (raw) {
        inquiries = JSON.parse(raw);
      } else {
        // 데이터가 아예 없을 때 둘러보기용 초기 안내 샘플 데이터 생성
        inquiries = [
          {
            id: 'inq_sample_1',
            date: new Date(Date.now() - 3600000 * 2).toLocaleString('ko-KR'),
            category: '입점 및 공구 제휴',
            name: '(주)담양대나무푸드 / 이영희 팀장',
            contact: '010-9876-5432 / bamboo@example.com',
            message: '전남 담양에서 직접 재배한 프리미엄 수제 전통차 및 가공식품을 제조하고 있습니다. 박대장이 쏜다 채널을 통해 생산 현장 라이브 방송 및 공동구매 제휴를 제안드립니다.',
            status: '신규 접수',
            memo: '원산지 답사 일정 조율 필요'
          },
          {
            id: 'inq_sample_2',
            date: new Date(Date.now() - 3600000 * 24).toLocaleString('ko-KR'),
            category: '성장 프로그램',
            name: '스마트커머스 연구소 / 김민준 대표',
            contact: '010-1234-5678',
            message: '초기 쇼핑몰 셀러 15명과 함께 스터디를 운영하고 있습니다. 뜰레의 상품 발굴 및 공동구매 유통망 공급 프로그램에 참여하고 싶어 신청합니다.',
            status: '상담 진행',
            memo: '1차 유선 안내 완료, 다음 주 화요일 온라인 줌 미팅 예정'
          }
        ];
        saveInquiries();
      }
    } catch (err) {
      console.error('문의 데이터 파싱 실패:', err);
      inquiries = [];
    }

    renderTable();
    updateKPI();
  };

  const saveInquiries = () => {
    try {
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(inquiries));
    } catch (err) {
      console.warn('저장 실패:', err);
    }
  };

  // 3. KPI 수치 계산
  const updateKPI = () => {
    const total = inquiries.length;
    const newItems = inquiries.filter(i => (i.status || '신규 접수') === '신규 접수').length;
    const progressItems = inquiries.filter(i => i.status === '상담 진행').length;
    const doneItems = inquiries.filter(i => i.status === '처리 완료').length;

    if (totalCountEl) totalCountEl.textContent = total;
    if (newCountEl) newCountEl.textContent = newItems;
    if (progressCountEl) progressCountEl.textContent = progressItems;
    if (doneCountEl) doneCountEl.textContent = doneItems;
  };

  // 4. 테이블 렌더링 (XSS 원천 차단: 이벤트 위임 방식)
  const renderTable = () => {
    const catVal = categoryFilter ? categoryFilter.value : 'all';
    const statVal = statusFilter ? statusFilter.value : 'all';
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const filtered = inquiries.filter(item => {
      const matchCat = (catVal === 'all') || (item.category === catVal);
      const itemStatus = item.status || '신규 접수';
      const matchStat = (statVal === 'all') || (itemStatus === statVal);
      const matchQuery = !query || 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.contact && item.contact.toLowerCase().includes(query)) ||
        (item.message && item.message.toLowerCase().includes(query));

      return matchCat && matchStat && matchQuery;
    });

    if (filteredCountEl) filteredCountEl.textContent = `${filtered.length}건`;
    if (!inquiryTableBody) return;
    inquiryTableBody.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((item, index) => {
      const tr = document.createElement('tr');
      const itemStatus = item.status || '신규 접수';

      // 카테고리 배지 클래스
      let catClass = 'category-manufacture';
      if (item.category && item.category.includes('성장')) catClass = 'category-seller';
      if (item.category && item.category.includes('콘텐츠')) catClass = 'category-production';

      // 텍스트 자르기
      const snippet = item.message ? (item.message.length > 34 ? item.message.substring(0, 34) + '...' : item.message) : '-';

      const safeId = escapeHtml(item.id || '');
      const safeDate = escapeHtml(item.date || '-');
      const safeCategory = escapeHtml(item.category || '기타');
      const safeName = escapeHtml(item.name || '-');
      const safeContact = escapeHtml(item.contact || '-');
      const safeSnippet = escapeHtml(snippet);

      tr.innerHTML = `
        <td style="color: var(--admin-text-sub); font-size: 0.85rem;">${index + 1}</td>
        <td style="font-size: 0.85rem; color: var(--admin-text-sub);">${safeDate}</td>
        <td><span class="category-badge ${catClass}">${safeCategory}</span></td>
        <td><strong>${safeName}</strong></td>
        <td><span style="font-family: monospace; font-size: 0.875rem;">${safeContact}</span></td>
        <td style="cursor: pointer;" title="클릭 시 전체 내용 보기" class="js-detail-trigger" data-id="${safeId}">${safeSnippet}</td>
        <td>
          <select class="filter-select js-status-change" style="padding: 4px 8px; font-size: 0.8125rem;" data-id="${safeId}">
            <option value="신규 접수" ${itemStatus === '신규 접수' ? 'selected' : ''}>신규 접수</option>
            <option value="상담 진행" ${itemStatus === '상담 진행' ? 'selected' : ''}>상담 진행</option>
            <option value="처리 완료" ${itemStatus === '처리 완료' ? 'selected' : ''}>처리 완료</option>
          </select>
        </td>
        <td style="text-align: center;">
          <button type="button" class="table-btn js-detail-btn" data-id="${safeId}">상세</button>
        </td>
      `;

      inquiryTableBody.appendChild(tr);
    });
  };

  // 인라인 이벤트 제거 후 안전한 이벤트 위임 리스너 등록
  if (inquiryTableBody) {
    inquiryTableBody.addEventListener('click', (e) => {
      const trigger = e.target.closest('.js-detail-trigger, .js-detail-btn');
      if (trigger) {
        const id = trigger.getAttribute('data-id');
        if (id) openDetailModal(id);
      }
    });

    inquiryTableBody.addEventListener('change', (e) => {
      if (e.target.classList.contains('js-status-change')) {
        const id = e.target.getAttribute('data-id');
        const newStatus = e.target.value;
        if (id && newStatus) changeStatusInline(id, newStatus);
      }
    });
  }

  // 상태 변경 처리
  const changeStatusInline = (id, newStatus) => {
    const target = inquiries.find(i => i.id === id);
    if (target) {
      target.status = newStatus;
      saveInquiries();
      updateKPI();
      renderTable();
      showToast(`'${target.name}' 님의 상태가 [${newStatus}]로 변경되었습니다.`);
    }
  };

  // 필터 및 검색 이벤트 바인딩
  if (categoryFilter) categoryFilter.addEventListener('change', renderTable);
  if (statusFilter) statusFilter.addEventListener('change', renderTable);
  if (searchInput) searchInput.addEventListener('input', renderTable);

  // 5. 상세 보기 모달
  const openDetailModal = (id) => {
    const item = inquiries.find(i => i.id === id);
    if (!item) return;

    currentSelectedId = id;
    if (modalDetailMeta) modalDetailMeta.textContent = `${item.date || '-'} | ${item.category || '-'}`;
    if (modalDetailName) modalDetailName.textContent = item.name || '-';
    if (modalDetailContact) modalDetailContact.textContent = item.contact || '-';
    if (modalDetailMessage) modalDetailMessage.textContent = item.message || '-';
    if (modalStatusSelect) modalStatusSelect.value = item.status || '신규 접수';
    if (modalAdminMemo) modalAdminMemo.value = item.memo || '';

    // 전화번호 추출 및 tel: 링크 연결
    if (telContactLink) {
      const phoneMatch = (item.contact || '').match(/01[0-9]-?[0-9]{3,4}-?[0-9]{4}/);
      if (phoneMatch) {
        telContactLink.href = `tel:${phoneMatch[0].replace(/-/g, '')}`;
        telContactLink.style.display = 'inline-block';
      } else {
        telContactLink.style.display = 'none';
      }
    }

    if (detailModal) detailModal.classList.add('active');
  };

  if (closeDetailModalBtn) {
    closeDetailModalBtn.addEventListener('click', () => {
      if (detailModal) detailModal.classList.remove('active');
    });
  }

  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) detailModal.classList.remove('active');
    });
  }

  if (copyContactBtn) {
    copyContactBtn.addEventListener('click', () => {
      const contactText = modalDetailContact ? modalDetailContact.textContent : '';
      if (contactText && contactText !== '-') {
        navigator.clipboard.writeText(contactText).then(() => {
          showToast('신청자 연락처가 클립보드에 복사되었습니다.');
        }).catch(() => {
          showToast('복사에 실패했습니다.');
        });
      }
    });
  }

  if (saveDetailBtn) {
    saveDetailBtn.addEventListener('click', () => {
      if (!currentSelectedId) return;
      const target = inquiries.find(i => i.id === currentSelectedId);
      if (target) {
        target.status = modalStatusSelect ? modalStatusSelect.value : target.status;
        target.memo = modalAdminMemo ? modalAdminMemo.value.trim() : '';
        saveInquiries();
        updateKPI();
        renderTable();
        if (detailModal) detailModal.classList.remove('active');
        showToast('상세 정보 및 관리 메모가 저장되었습니다.');
      }
    });
  }

  if (deleteInquiryBtn) {
    deleteInquiryBtn.addEventListener('click', () => {
      if (!currentSelectedId) return;
      if (confirm('이 문의 건을 정말로 삭제하시겠습니까? (삭제 후 복구 불가)')) {
        inquiries = inquiries.filter(i => i.id !== currentSelectedId);
        saveInquiries();
        updateKPI();
        renderTable();
        if (detailModal) detailModal.classList.remove('active');
        showToast('문의가 정상적으로 삭제되었습니다.');
      }
    });
  }

  // 6. 엑셀(CSV) 다운로드 (한글 깨짐 없는 UTF-8 BOM 인코딩 적용)
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      if (inquiries.length === 0) {
        alert('다운로드할 문의 내역이 없습니다.');
        return;
      }

      let csvContent = '\uFEFF'; // 한글 엑셀 깨짐 방지용 UTF-8 BOM
      csvContent += '번호,접수일시,문의유형,회사명/신청자,연락처,문의내용,진행상태,관리자메모\n';

      inquiries.forEach((item, idx) => {
        const row = [
          idx + 1,
          `"${(item.date || '').replace(/"/g, '""')}"`,
          `"${(item.category || '').replace(/"/g, '""')}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.contact || '').replace(/"/g, '""')}"`,
          `"${(item.message || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`,
          `"${(item.status || '신규 접수').replace(/"/g, '""')}"`,
          `"${(item.memo || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.href = url;
      link.setAttribute('download', `주식회사뜰레_제휴문의내역_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('엑셀(CSV) 파일이 정상적으로 다운로드되었습니다.');
    });
  }

  // 7. 추천 1, 2위 연동 설정 센터
  const DEFAULT_CONFIG = {
    email: 'jamannim@gmail.com',
    googleSheetWebhookUrl: 'https://script.google.com/macros/s/AKfycbyKK4tk5G8qa8Va8WJHXE_KUfEITCk8O-dsVwgtXVnd1jrwskoxpdATzh6uhz447FTWjw/exec'
  };

  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      let cfg = stored ? JSON.parse(stored) : {};

      const effectiveEmail = (cfg.email && cfg.email.trim() !== '') ? cfg.email : DEFAULT_CONFIG.email;
      const effectiveSheet = (cfg.googleSheetWebhookUrl && cfg.googleSheetWebhookUrl.trim() !== '') ? cfg.googleSheetWebhookUrl : DEFAULT_CONFIG.googleSheetWebhookUrl;

      if (settingEmail) settingEmail.value = effectiveEmail;
      if (settingSheetWebhook) settingSheetWebhook.value = effectiveSheet;

      // 브라우저 저장소에 동기화
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
        ...cfg,
        email: effectiveEmail,
        googleSheetWebhookUrl: effectiveSheet
      }));
    } catch (err) {
      console.warn('설정 로드 실패:', err);
    }
  };

  loadConfig();

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      loadConfig();
      if (currentAdminPassword) currentAdminPassword.value = '';
      if (newAdminPassword) newAdminPassword.value = '';
      if (settingsModal) settingsModal.classList.add('active');
    });
  }

  if (closeSettingsModalBtn) {
    closeSettingsModalBtn.addEventListener('click', () => {
      if (settingsModal) settingsModal.classList.remove('active');
    });
  }

  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) settingsModal.classList.remove('active');
    });
  }

  if (settingEmail) {
    settingEmail.addEventListener('input', () => {
      const cfg = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
      cfg.email = settingEmail.value.trim();
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
    });
  }

  // 구글 시트 URL 입력 감지 및 실시간 유효성 경고 + 자동 저장
  const sheetUrlWarning = document.getElementById('sheetUrlWarning');
  if (settingSheetWebhook) {
    settingSheetWebhook.addEventListener('input', () => {
      const val = settingSheetWebhook.value.trim();
      if (sheetUrlWarning) {
        if (val.includes('docs.google.com/spreadsheets')) {
          sheetUrlWarning.style.display = 'block';
          sheetUrlWarning.textContent = '🚨 잘못된 주소 형식: 현재 주소는 [구글 시트 문서 주소]입니다. Apps Script의 [배포] > [새 배포] 후 생성되는 https://script.google.com/macros/s/.../exec 주소를 입력하셔야 시트에 누적됩니다.';
        } else {
          sheetUrlWarning.style.display = 'none';
        }
      }
      const cfg = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
      cfg.googleSheetWebhookUrl = val;
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
    });
  }

  // 연동 설정 저장 버튼
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
      const emailVal = (settingEmail ? settingEmail.value.trim() : '') || DEFAULT_CONFIG.email;
      const sheetUrl = (settingSheetWebhook ? settingSheetWebhook.value.trim() : '') || DEFAULT_CONFIG.googleSheetWebhookUrl;

      if (sheetUrl && sheetUrl.includes('docs.google.com/spreadsheets')) {
        alert('⚠️ 주의: 구글 시트 연동 주소로 [시트 문서 주소]를 입력하셨습니다.\n\n구글 시트에 데이터가 쌓이려면 반드시 Apps Script의 [배포] > [새 배포]에서 발급받은 웹 앱 URL(https://script.google.com/macros/s/.../exec)을 입력하셔야 합니다.');
      }

      const cfg = {
        ...existing,
        email: emailVal,
        googleSheetWebhookUrl: sheetUrl
      };
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
      if (settingsModal) settingsModal.classList.remove('active');
      showToast('연동 설정이 안전하게 저장되었습니다.');
    });
  }

  // 추천 1위: 테스트 이메일 발송
  if (testEmailBtn) {
    testEmailBtn.addEventListener('click', async () => {
      const email = settingEmail ? settingEmail.value.trim() : '';

      if (!email || !email.includes('@')) {
        alert('알림을 수신받으실 올바른 이메일 주소를 입력해주세요.\n(예: ceo@ttlee.co.kr 또는 본인 네이버/지메일)');
        if (settingEmail) settingEmail.focus();
        return;
      }

      testEmailBtn.disabled = true;
      testEmailBtn.textContent = '발송 중...';

      try {
        const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: '[TTLEE 테스트] 뜰레 제휴문의 알림 연동 테스트 메일',
            보낸곳: '주식회사 뜰레(TTLEE) 고객문의 시스템',
            수신자: email,
            내용: '축하합니다! 주식회사 뜰레 제휴·입점 문의 알림 연동이 정상 작동합니다.'
          })
        });
        await response.json();
        
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
        existing.email = email;
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(existing));

        alert('테스트 이메일이 발송되었습니다. 메일함을 확인해주세요.');
        showToast('테스트 이메일이 발송되었습니다.');
      } catch (err) {
        alert('발송 중 통신 오류가 발생했습니다: ' + err.message);
      } finally {
        testEmailBtn.disabled = false;
        testEmailBtn.textContent = '📩 테스트 발송';
      }
    });
  }

  // 추천 2위: 구글 시트 테스트 전송
  if (testSheetBtn) {
    testSheetBtn.addEventListener('click', async () => {
      const webhookUrl = settingSheetWebhook ? settingSheetWebhook.value.trim() : '';
      if (!webhookUrl) {
        alert('구글 시트 웹 앱 URL을 먼저 입력해주세요.');
        if (settingSheetWebhook) settingSheetWebhook.focus();
        return;
      }

      if (webhookUrl.includes('docs.google.com/spreadsheets')) {
        alert('⚠️ 입력하신 주소는 [구글 시트 웹문서 링크]입니다!\n\n구글 시트에 데이터가 자동으로 한 줄씩 추가되려면 스프레드시트 주소가 아니라,\nApps Script의 [배포] > [새 배포] 후 생성되는 [웹 앱 URL]을 넣으셔야 합니다.');
        if (settingSheetWebhook) settingSheetWebhook.focus();
        return;
      }

      testSheetBtn.disabled = true;
      testSheetBtn.textContent = '전송 중...';

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            category: '[테스트] 입점 및 공구 제휴',
            name: '주식회사 뜰레 / 테스트 담당자',
            contact: '010-0000-0000',
            message: '관리자 표 셀 항목 8개 100% 매칭 테스트입니다.',
            status: '신규 접수',
            memo: '테스트',
            date: new Date().toLocaleString('ko-KR'),
            접수일시: new Date().toLocaleString('ko-KR'),
            문의유형: '[테스트] 입점 및 공구 제휴',
            회사명신청자: '주식회사 뜰레 / 테스트 담당자',
            신청자명: '주식회사 뜰레 / 테스트 담당자',
            연락처: '010-0000-0000',
            문의내용: '관리자 표 셀 항목 8개 100% 매칭 테스트입니다.',
            진행상태: '신규 접수',
            관리: '테스트'
          })
        });

        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
        existing.googleSheetWebhookUrl = webhookUrl;
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(existing));

        showToast('구글 시트로 테스트 데이터가 전송되었습니다.');
        alert('구글 시트로 8개 항목 테스트 데이터를 전송했습니다.\n스프레드시트에 새 행이 추가되었는지 확인해보세요!');
      } catch (err) {
        alert('전송 중 오류가 발생했습니다: ' + err.message);
      } finally {
        testSheetBtn.disabled = false;
        testSheetBtn.textContent = '📊 시트 전송 테스트';
      }
    });
  }

  // 구글 시트 Apps Script 코드 복사
  if (copyAppsScriptBtn) {
    copyAppsScriptBtn.addEventListener('click', () => {
      const code = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 1행이 비어있는 경우 관리자 테이블과 100% 동일한 8개 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["번호", "접수일시", "문의 유형", "회사명 / 신청자", "연락처", "문의 및 제안 내용 요약", "진행 상태", "관리"]);
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(err) { data = e.parameter || {}; }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    var num = sheet.getLastRow(); // 1행이 헤더이므로 누적 번호 자동 계산
    var now = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var date = data.date || data.접수일시 || now;
    var category = data.category || data.문의유형 || '-';
    var name = data.name || data.회사명신청자 || data.신청자명 || '-';
    var contact = data.contact || data.연락처 || '-';
    var message = data.message || data.문의내용 || '-';
    var status = data.status || data.진행상태 || '신규 접수';
    var memo = data.memo || data.관리 || '-';
    
    // [번호 | 접수일시 | 문의 유형 | 회사명 / 신청자 | 연락처 | 문의 및 제안 내용 요약 | 진행 상태 | 관리]
    sheet.appendRow([num, date, category, name, contact, message, status, memo]);
    return ContentService.createTextOutput(JSON.stringify({result: "success", rowNumber: num})).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;
      navigator.clipboard.writeText(code).then(() => {
        showToast('8개 셀 항목 100% 일치 구글 시트 스크립트 코드가 복사되었습니다.');
      });
    });
  }

  // 관리자 비밀번호 변경 (현재 비밀번호 확인 + SHA-256 해시 저장)
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', async () => {
      const currentPwd = currentAdminPassword ? currentAdminPassword.value.trim() : '';
      const newPwd = newAdminPassword ? newAdminPassword.value.trim() : '';

      if (!currentPwd) {
        alert('현재 사용 중인 비밀번호를 먼저 입력해주세요.');
        if (currentAdminPassword) currentAdminPassword.focus();
        return;
      }

      const currentHash = await hashPassword(currentPwd);
      const storedHash = await getStoredPasswordHash();

      if (currentHash !== storedHash) {
        alert('현재 비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
        if (currentAdminPassword) {
          currentAdminPassword.value = '';
          currentAdminPassword.focus();
        }
        return;
      }

      if (newPwd.length < 8) {
        alert('보안 강화를 위해 새 비밀번호는 최소 8자리 이상으로 설정해주세요.');
        if (newAdminPassword) newAdminPassword.focus();
        return;
      }

      if (newPwd === currentPwd) {
        alert('현재 비밀번호와 동일한 비밀번호로는 변경할 수 없습니다.');
        return;
      }

      const newHash = await hashPassword(newPwd);
      localStorage.setItem(STORAGE_KEY_PASSWORD_HASH, newHash);
      localStorage.removeItem(STORAGE_KEY_LEGACY_PWD); // 레거시 평문 삭제

      if (currentAdminPassword) currentAdminPassword.value = '';
      if (newAdminPassword) newAdminPassword.value = '';
      showToast('관리자 접속 비밀번호가 SHA-256 암호화되어 안전하게 변경되었습니다.');
      alert('비밀번호가 성공적으로 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
    });
  }

  // ESC 키 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (detailModal) detailModal.classList.remove('active');
      if (settingsModal) settingsModal.classList.remove('active');
    }
  });

  // 실행 시작
  checkAuth();
});
