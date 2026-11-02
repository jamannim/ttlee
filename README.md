# 뜰레 (TTLEE) 미디어 커머스 공식 랜딩페이지

주식회사 뜰레(TTLEE)의 브랜드 신뢰도 제고 및 공동구매·파트너십 전환을 위한 공식 반응형 랜딩페이지입니다.

---

## 1. 프로젝트 개요

- **브랜드명:** 뜰레 (TTLEE)
- **법인명:** 주식회사 뜰레 (TTLEE)
- **대표이사:** 박세연
- **포지션:** 미디어 커머스 기업
- **슬로건:** 좋은 상품을 발견하고, 진짜 경험을 나누다.
- **대표 채널:** 박대장이 쏜다! (YouTube: [@parkboss1](https://www.youtube.com/@parkboss1), TikTok: [@parkboss_1](https://www.tiktok.com/@parkboss_1))

---

## 2. 디자인 시스템 (Warm Lifestyle Commerce)

스타벅스 매장 인테리어의 따뜻하고 편안한 감성을 바탕으로, 상품과 스토리가 돋보이도록 설계되었습니다.

| 색상명 | Hex Code | 비중 | 주요 적용처 |
|---|---|---:|---|
| **Warm Ivory** | `#F5F1E8` | 45% | 메인(Hero) 및 주요 섹션 기본 배경 |
| **Pure White** | `#FFFFFF` | 30% | 카드, 모달 팝업, 텍스트 가독성 영역 |
| **Starbucks Green** | `#00704A` | 10% | 메인 CTA 버튼, 로고 포인트, 핵심 강조 |
| **Deep Green** | `#1E3932` | 5% | 박대장이 쏜다! 오리지널 채널 섹션 배경 |
| **Natural Beige** | `#B69B7D` | 5% | 보조 포인트, 우드톤 테두리 |
| **Charcoal** | `#333A35` | 5% | 본문 텍스트 및 헤드라인 |

- **서체:** Pretendard (웹폰트 CDN 기본 탑재)

---

## 3. 폴더 구조

```text
홈페이지md기획/
├── index.html               # 랜딩페이지 메인 HTML (시맨틱 마크업)
├── css/
│   └── style.css           # Warm Lifestyle 디자인 시스템 및 반응형 CSS
├── js/
│   └── main.js             # 탭 전환, 비디오/문의 모달, 부드러운 스크롤 인터랙션
├── MD_RULES.md             # UI 텍스트 중복 방지 및 콘텐츠 작성 규칙
├── TTLEE_md_기획파일.md     # 원본 기획안 문서
├── vercel.json             # Vercel 배포 및 Cloudflare 프록시 최적화 설정
└── README.md               # 프로젝트 안내 및 활용 매뉴얼
```

---

## 4. 주요 기능 및 구현 특징

1. **7개 핵심 섹션 완벽 구현**:
   - `SECTION 01. MAIN VISUAL`: 핵심 슬로건, 전환 유도 CTA, 신뢰 지표 배지
   - `SECTION 02. ABOUT TTLE`: 발견 → 검증 → 제작 → 판매 연결의 4단계 비즈니스 플로우
   - `SECTION 03. OUR BUSINESS`: 4대 핵심 사업(상품 발굴·검증, 콘텐츠 제작, 라이브커머스, 셀러 육성)
   - `SECTION 04. WHY TTLE`: 뜰레만의 4대 차별적 경쟁력
   - `SECTION 05. TTLEE OFFICIAL CHANNEL (박대장이 쏜다!)`:
     - 정규 편성 안내 (매주 수 17:00 라이브 / 매주 목 롱폼)
     - 유튜브 공식 채널([@parkboss1](https://www.youtube.com/@parkboss1)) 및 틱톡 공식 채널([@parkboss_1](https://www.tiktok.com/@parkboss_1)) 연동
     - 모바일 화면 대응: 카드형 가로 스냅 스크롤(Snap Scroll) 적용
   - `SECTION 06. PARTNERSHIP`: 고객 유형별(제조사/셀러/기업) 3대 맞춤 CTA 및 문의 모달 폼
   - `SECTION 07. FOOTER`: 기업 정보 및 카피라이트 표기

2. **반응형 웹 지원 (Responsive Web)**:
   - 데스크톱(PC), 태블릿, 모바일 모든 해상도 지원
   - 모바일 햄버거 메뉴 및 터치 친화적 버튼 규격

3. **즉시 실행 & 무설치 환경**:
   - 별도의 빌드 도구나 Node.js 환경 없이도 브라우저에서 `index.html` 파일을 더블클릭하여 즉시 확인 가능
   - GitHub Pages, Vercel, Netlify, 아임웹, 카페24, AWS S3 등 정적 호스팅에 그대로 업로드하여 배포 가능

---

## 5. 실행 방법

1. 본 폴더 내 `index.html` 파일을 Chrome, Edge 등 웹 브라우저로 엽니다.
2. 각 섹션별 인터랙션(스크롤, 탭 전환, 모달 팝업, 문의 폼)을 확인합니다.
