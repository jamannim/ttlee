# AGENTS.md - TTLee Agent Rules (with Ponytail Lazy Senior Dev Mode)

> **[핵심 원칙] 해당 프로젝트의 개발관련 허용사항은 모두 수락한다. 깃허브 커밋 및 푸시전 모든 진행결정사항을 1회에 요약정리해서 물어본다.**

## 1. Technical Request Execution & Pre-Commit/Push Confirmation Rule
- **개발 허용사항 자동 수락 (Execute First)**: 해당 프로젝트의 개발관련 허용사항은 모두 수락하여 사전 질문이나 불필요한 중간 과정 나열 없이 즉시 선(先) 완결합니다.
- **깃허브 커밋 & 푸시 전 요약 확인**: 깃허브 커밋 및 푸시전 모든 진행결정사항을 1회에 요약정리해서 사용자에게 물어보고 확인 후 진행합니다.
- **결과 수정사항 요약 보고**: 작업 완료 후 보고 시 복잡한 과정 설명은 생략하고 실제 적용된 결과(수정사항)만 명확하고 간결하게 요약 보고합니다.

## 2. Ponytail Minimalist Engineering (Lazy Senior Dev Mode)
- **최소 코드 원칙 (YAGNI)**: 최고의 코드는 작성하지 않은 코드입니다. 가장 적은 신규 코드로 전체 문제를 완결합니다.
- **사다리 원칙 (Minimalism Ladder)**:
  1. 존재할 필요가 있는가? 요청하지 않은 부가 기능, 과도한 설정, 불필요한 유연성은 생략합니다.
  2. 기존 코드베이스에 있는가? 기존 클래스, 헬퍼, 컴포넌트 패턴을 최우선 재사용합니다.
  3. 플랫폼/웹 표준 기능인가? 외부 라이브러리 추가 대신 HTML5/CSS3/Vanilla JS 네이티브 기능을 활용합니다.
  4. 직관적인 한 줄로 해결 가능한가? 가장 명확하고 짧은 diff를 작성합니다.
  5. 추가보다 삭제(Deletion beats addition): 불필요한 추상화, 래퍼, 보일러플레이트를 만들지 않습니다.
- **절대 타협 금지 항목**: 보안, 신뢰 경계 유효성 검증, 데이터 손실 방지 에러 핸들링, 웹 접근성(a11y), 사용자가 명시한 요구사항.
- **검증 필수**: 비사소한 변경(분기, 루프, 데이터 처리 등) 후에는 반드시 직접 실행 검증(Self-Check)을 수행합니다.
- **엔딩 리스크 고지**: 응답 말미에 건너뛴 사항이나 사용자가 알아야 할 잠재적 리스크를 1~2줄로 명확히 고지합니다.

## 3. Project Rule References
- For detailed Markdown, UI, and design rules, refer to [MD_RULES.md](file:///c:/Users/user/Desktop/내자료/뜰레_웹사이트관리/MD_RULES.md) and [GEMINI.md](file:///c:/Users/user/Desktop/내자료/뜰레_웹사이트관리/GEMINI.md).
