/**
 * 주식회사 뜰레(TTLEE) 제휴·입점 문의 관리자 시스템 스크립트 (admin.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_PASSWORD = 'ttlee2026!';
  const STORAGE_KEY_INQUIRIES = 'ttlee_inquiries';
  const STORAGE_KEY_CONFIG = 'ttlee_config';
  const STORAGE_KEY_PASSWORD = 'ttlee_admin_pwd';
  const SESSION_KEY_AUTH = 'ttlee_admin_auth';

  // 요소 참조
  const loginScreen = document.getElementById('loginScreen');
  const loginForm = document.getElementById('loginForm');
  const adminPasswordInput = document.getElementById('adminPassword');
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
  const settingEmailKey = document.getElementById('settingEmailKey');
  const settingSheetWebhook = document.getElementById('settingSheetWebhook');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const testEmailBtn = document.getElementById('testEmailBtn');
  const testSheetBtn = document.getElementById('testSheetBtn');
  const copyAppsScriptBtn = document.getElementById('copyAppsScriptBtn');
  const newAdminPassword = document.getElementById('newAdminPassword');
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  let currentSelectedId = null;
  let inquiries = [];

  // 토스트 메시지 함수
  const showToast = (message) => {
    if (!adminToast) return;
    adminToast.textContent = message;
    adminToast.classList.add('show');
    setTimeout(() => {
      adminToast.classList.remove('show');
    }, 3200);
  };

  // 1. 인증 검사
  const checkAuth = () => {
    const isAuth = sessionStorage.getItem(SESSION_KEY_AUTH);
    if (isAuth === 'true') {
      loginScreen.style.display = 'none';
      loadInquiries();
    } else {
      loginScreen.style.display = 'flex';
      adminPasswordInput.focus();
    }
  };

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = adminPasswordInput.value.trim();
    const storedPwd = localStorage.getItem(STORAGE_KEY_PASSWORD) || DEFAULT_PASSWORD;

    if (entered === storedPwd) {
      sessionStorage.setItem(SESSION_KEY_AUTH, 'true');
      loginScreen.style.display = 'none';
      showToast('성공적으로 로그인되었습니다.');
      loadInquiries();
    } else {
      alert('비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
      adminPasswordInput.value = '';
      adminPasswordInput.focus();
    }
  });

  logoutBtn.addEventListener('click', () => {
    if (confirm('관리자 계정에서 로그아웃 하시겠습니까?')) {
      sessionStorage.removeItem(SESSION_KEY_AUTH);
      loginScreen.style.display = 'flex';
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

    totalCountEl.textContent = total;
    newCountEl.textContent = newItems;
    progressCountEl.textContent = progressItems;
    doneCountEl.textContent = doneItems;
  };

  // 4. 테이블 렌더링
  const renderTable = () => {
    const catVal = categoryFilter.value;
    const statVal = statusFilter.value;
    const query = searchInput.value.trim().toLowerCase();

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

    filteredCountEl.textContent = `${filtered.length}건`;
    inquiryTableBody.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    filtered.forEach((item, index) => {
      const tr = document.createElement('tr');
      const itemStatus = item.status || '신규 접수';

      // 카테고리 배지 클래스
      let catClass = 'category-manufacture';
      if (item.category && item.category.includes('성장')) catClass = 'category-seller';
      if (item.category && item.category.includes('콘텐츠')) catClass = 'category-production';

      // 상태 배지 클래스
      let statClass = 'status-new';
      if (itemStatus === '상담 진행') statClass = 'status-progress';
      if (itemStatus === '처리 완료') statClass = 'status-done';

      // 텍스트 자르기
      const snippet = item.message ? (item.message.length > 34 ? item.message.substring(0, 34) + '...' : item.message) : '-';

      tr.innerHTML = `
        <td style="color: var(--admin-text-sub); font-size: 0.85rem;">${index + 1}</td>
        <td style="font-size: 0.85rem; color: var(--admin-text-sub);">${item.date || '-'}</td>
        <td><span class="category-badge ${catClass}">${item.category || '기타'}</span></td>
        <td><strong>${escapeHtml(item.name || '-')}</strong></td>
        <td><span style="font-family: monospace; font-size: 0.875rem;">${escapeHtml(item.contact || '-')}</span></td>
        <td style="cursor: pointer;" title="클릭 시 전체 내용 보기" onclick="openDetailModal('${item.id}')">${escapeHtml(snippet)}</td>
        <td>
          <select class="filter-select" style="padding: 4px 8px; font-size: 0.8125rem;" onchange="changeStatusInline('${item.id}', this.value)">
            <option value="신규 접수" ${itemStatus === '신규 접수' ? 'selected' : ''}>신규 접수</option>
            <option value="상담 진행" ${itemStatus === '상담 진행' ? 'selected' : ''}>상담 진행</option>
            <option value="처리 완료" ${itemStatus === '처리 완료' ? 'selected' : ''}>처리 완료</option>
          </select>
        </td>
        <td style="text-align: center;">
          <button type="button" class="table-btn" onclick="openDetailModal('${item.id}')">상세</button>
        </td>
      `;

      inquiryTableBody.appendChild(tr);
    });
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // 인라인 상태 변경
  window.changeStatusInline = (id, newStatus) => {
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
  categoryFilter.addEventListener('change', renderTable);
  statusFilter.addEventListener('change', renderTable);
  searchInput.addEventListener('input', renderTable);

  // 5. 상세 보기 모달
  window.openDetailModal = (id) => {
    const item = inquiries.find(i => i.id === id);
    if (!item) return;

    currentSelectedId = id;
    modalDetailMeta.textContent = `${item.date || '-'} | ${item.category || '-'}`;
    modalDetailName.textContent = item.name || '-';
    modalDetailContact.textContent = item.contact || '-';
    modalDetailMessage.textContent = item.message || '-';
    modalStatusSelect.value = item.status || '신규 접수';
    modalAdminMemo.value = item.memo || '';

    // 전화번호 추출 및 tel: 링크 연결
    const phoneMatch = (item.contact || '').match(/01[0-9]-?[0-9]{3,4}-?[0-9]{4}/);
    if (phoneMatch) {
      telContactLink.href = `tel:${phoneMatch[0].replace(/-/g, '')}`;
      telContactLink.style.display = 'inline-block';
    } else {
      telContactLink.style.display = 'none';
    }

    detailModal.classList.add('active');
  };

  closeDetailModalBtn.addEventListener('click', () => {
    detailModal.classList.remove('active');
  });

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.remove('active');
  });

  copyContactBtn.addEventListener('click', () => {
    const contactText = modalDetailContact.textContent;
    if (contactText && contactText !== '-') {
      navigator.clipboard.writeText(contactText).then(() => {
        showToast('신청자 연락처가 클립보드에 복사되었습니다.');
      }).catch(() => {
        showToast('복사에 실패했습니다.');
      });
    }
  });

  saveDetailBtn.addEventListener('click', () => {
    if (!currentSelectedId) return;
    const target = inquiries.find(i => i.id === currentSelectedId);
    if (target) {
      target.status = modalStatusSelect.value;
      target.memo = modalAdminMemo.value.trim();
      saveInquiries();
      updateKPI();
      renderTable();
      detailModal.classList.remove('active');
      showToast('상세 정보 및 관리 메모가 저장되었습니다.');
    }
  });

  deleteInquiryBtn.addEventListener('click', () => {
    if (!currentSelectedId) return;
    if (confirm('이 문의 건을 정말로 삭제하시겠습니까? (삭제 후 복구 불가)')) {
      inquiries = inquiries.filter(i => i.id !== currentSelectedId);
      saveInquiries();
      updateKPI();
      renderTable();
      detailModal.classList.remove('active');
      showToast('문의가 정상적으로 삭제되었습니다.');
    }
  });

  // 6. 엑셀(CSV) 다운로드 (한글 깨짐 없는 UTF-8 BOM 인코딩 적용)
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
        `"${(item.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(item.status || '신규 접수').replace(/"/g, '""')}"`,
        `"${(item.memo || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
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

  // 7. 추천 1, 2위 연동 설정 센터
  const loadConfig = () => {
    try {
      const cfg = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
      settingEmail.value = cfg.email || '';
      settingSheetWebhook.value = cfg.googleSheetWebhookUrl || '';
    } catch (err) {
      console.warn('설정 로드 실패:', err);
    }
  };

  openSettingsBtn.addEventListener('click', () => {
    loadConfig();
    settingsModal.classList.add('active');
  });

  closeSettingsModalBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('active');
  });

  // 구글 시트 URL 입력 감지 및 실시간 유효성 경고
  const sheetUrlWarning = document.getElementById('sheetUrlWarning');
  if (settingSheetWebhook && sheetUrlWarning) {
    settingSheetWebhook.addEventListener('input', () => {
      const val = settingSheetWebhook.value.trim();
      if (val.includes('docs.google.com/spreadsheets')) {
        sheetUrlWarning.style.display = 'block';
        sheetUrlWarning.innerHTML = '🚨 <b>잘못된 주소 형식:</b> 현재 주소는 [구글 시트 문서 주소]입니다. Apps Script의 [배포] &gt; [새 배포] 후 생성되는 <code>https://script.google.com/macros/s/.../exec</code> 주소를 입력하셔야 시트에 누적됩니다.';
      } else {
        sheetUrlWarning.style.display = 'none';
      }
    });
  }

  // 연동 설정 저장
  saveSettingsBtn.addEventListener('click', () => {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
    const sheetUrl = settingSheetWebhook.value.trim();

    if (sheetUrl && sheetUrl.includes('docs.google.com/spreadsheets')) {
      alert('⚠️ 주의: 구글 시트 연동 주소로 [시트 문서 주소]를 입력하셨습니다.\n\n구글 시트에 데이터가 쌓이려면 반드시 Apps Script의 [배포] > [새 배포]에서 발급받은 웹 앱 URL(https://script.google.com/macros/s/.../exec)을 입력하셔야 합니다.');
    }

    const cfg = {
      ...existing,
      email: settingEmail.value.trim(),
      googleSheetWebhookUrl: sheetUrl
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
    settingsModal.classList.remove('active');
    showToast('연동 설정이 안전하게 저장되었습니다.');
  });

  // 추천 1위: 테스트 이메일 발송 (이메일 주소만 있으면 FormSubmit으로 즉시 발송!)
  testEmailBtn.addEventListener('click', async () => {
    const email = settingEmail.value.trim();

    if (!email || !email.includes('@')) {
      alert('알림을 수신받으실 올바른 이메일 주소를 입력해주세요.\n(예: ceo@ttlee.co.kr 또는 본인 네이버/지메일)');
      settingEmail.focus();
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
          내용: '축하합니다! 주식회사 뜰레 제휴·입점 문의 알림 연동이 완료되었습니다.\n(※ 첫 1회 수신 시 메일함에서 Activate Form 링크를 클릭하시면 영구 활성화됩니다)'
        })
      });
      const data = await response.json();
      
      // 설정 자동 저장
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
      existing.email = email;
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(existing));

      alert('테스트 이메일이 발송되었습니다.');
      showToast('테스트 이메일이 발송되었습니다.');
    } catch (err) {
      alert('발송 중 통신 오류가 발생했습니다: ' + err.message);
    } finally {
      testEmailBtn.disabled = false;
      testEmailBtn.textContent = '📩 테스트 발송';
    }
  });

  // 추천 2위: 구글 시트 테스트 전송
  testSheetBtn.addEventListener('click', async () => {
    const webhookUrl = settingSheetWebhook.value.trim();
    if (!webhookUrl) {
      alert('구글 시트 웹 앱 URL을 먼저 입력해주세요.');
      settingSheetWebhook.focus();
      return;
    }

    // URL 형식 사전 검사
    if (webhookUrl.includes('docs.google.com/spreadsheets')) {
      alert('⚠️ 입력하신 주소는 [구글 시트 웹문서 링크]입니다!\n\n구글 시트에 데이터가 자동으로 한 줄씩 추가되려면 스프레드시트 주소가 아니라,\nApps Script의 [배포] > [새 배포] 후 생성되는 [웹 앱 URL]을 넣으셔야 합니다.\n\n올바른 주소 형식 예시:\nhttps://script.google.com/macros/s/AKfycb.../exec\n\n하단의 3대 필수 체크리스트를 확인해주세요.');
      settingSheetWebhook.focus();
      return;
    }

    if (!webhookUrl.includes('script.google.com') || (!webhookUrl.endsWith('/exec') && !webhookUrl.includes('/exec?'))) {
      const confirmProceed = confirm('⚠️ 주의: 입력하신 주소가 일반적인 Apps Script 웹 앱 배포 주소(/exec)와 다릅니다.\n(입력값: ' + webhookUrl + ')\n\n웹 앱 배포 주소가 아니면 데이터가 시트에 저장되지 않습니다.\n그래도 테스트 전송을 계속 진행하시겠습니까?');
      if (!confirmProceed) {
        settingSheetWebhook.focus();
        return;
      }
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
          name: '뜰레 관리자 테스트',
          contact: '010-0000-0000',
          message: '구글 스프레드시트 연동 테스트 데이터입니다.',
          문의유형: '[테스트] 입점 및 공구 제휴',
          신청자명: '뜰레 관리자 테스트',
          연락처: '010-0000-0000',
          문의내용: '구글 스프레드시트 연동 테스트 데이터입니다.'
        })
      });

      // 설정 자동 저장
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) || '{}');
      existing.googleSheetWebhookUrl = webhookUrl;
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(existing));

      showToast('구글 시트로 테스트 데이터가 전송되었습니다! 시트를 확인하세요.');
      alert('구글 시트로 테스트 데이터를 전송했습니다.\n구글 스프레드시트에 새 행이 추가되었는지 확인해보세요!\n\n※ 만약 시트에 여전히 안 들어왔다면:\n1. Apps Script [배포] 시 [액세스 권한: 모든 사용자]로 했는지\n2. 최초 1회 [액세스 승인]을 완료했는지 확인해주세요.');
    } catch (err) {
      alert('전송 중 오류가 발생했습니다: ' + err.message);
    } finally {
      testSheetBtn.disabled = false;
      testSheetBtn.textContent = '📊 시트 전송 테스트';
    }
  });

  // 구글 시트 Apps Script 코드 복사
  copyAppsScriptBtn.addEventListener('click', () => {
    const code = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(err) { data = e.parameter || {}; }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    var now = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var category = data.category || data.문의유형 || '-';
    var name = data.name || data.신청자명 || '-';
    var contact = data.contact || data.연락처 || '-';
    var message = data.message || data.문의내용 || '-';
    sheet.appendRow([now, category, name, contact, message]);
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(code).then(() => {
      showToast('강화된 구글 시트 스크립트 코드가 복사되었습니다.');
    });
  });

  // 비밀번호 변경
  changePasswordBtn.addEventListener('click', () => {
    const newPwd = newAdminPassword.value.trim();
    if (newPwd.length < 4) {
      alert('비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }
    localStorage.setItem(STORAGE_KEY_PASSWORD, newPwd);
    newAdminPassword.value = '';
    showToast('관리자 접속 비밀번호가 안전하게 변경되었습니다.');
  });

  // ESC 키 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      detailModal.classList.remove('active');
      settingsModal.classList.remove('active');
    }
  });

  // 실행 시작
  checkAuth();
});
