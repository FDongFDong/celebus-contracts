/**
 * 공통 에러 핸들링 유틸리티
 *
 * 일관된 에러 메시지 추출 및 처리를 제공합니다.
 */

/**
 * unknown 타입의 에러에서 메시지를 추출
 *
 * @param error - 캐치된 에러 (unknown 타입)
 * @param fallbackMessage - Error 객체가 아닐 경우 사용할 기본 메시지
 * @returns 에러 메시지 문자열
 */
export function getErrorMessage(error: unknown, fallbackMessage = '알 수 없는 오류가 발생했습니다'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallbackMessage;
}

function hasNestedRejectionSignal(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const record = error as Record<string, unknown>;
  if (record.code === 4001) return true;
  if (record.cause && hasNestedRejectionSignal(record.cause)) return true;
  if (record.details && typeof record.details === 'string') {
    const details = record.details.toLowerCase();
    if (details.includes('user rejected') || details.includes('user denied')) return true;
  }
  return false;
}

function isNoDataReadContractErrorMessage(lowerMessage: string): boolean {
  return (
    lowerMessage.includes('returned no data ("0x")') ||
    lowerMessage.includes('address is not a contract')
  );
}

/**
 * readContract 호출에서 "no data(0x)" 계열 오류인지 판별
 */
export function isNoDataReadContractError(error: unknown): boolean {
  const lowerMessage = getErrorMessage(error).toLowerCase();
  return isNoDataReadContractErrorMessage(lowerMessage);
}

function isInternalRpcErrorMessage(lowerMessage: string): boolean {
  return (
    lowerMessage.includes('an internal error was received') ||
    lowerMessage.includes('internal json-rpc error') ||
    lowerMessage.includes('transactionexecutionerror')
  );
}

/**
 * 블록체인 관련 에러 메시지를 사용자 친화적으로 변환
 *
 * @param error - 원본 에러
 * @returns 사용자 친화적 에러 메시지
 */
export function getBlockchainErrorMessage(error: unknown): string {
  const message = getErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  // 일반적인 블록체인 에러 패턴 매칭
  if (isUserRejectionError(error)) {
    return '사용자가 요청을 취소했습니다';
  }
  if (lowerMessage.includes('insufficient funds')) {
    return '잔액이 부족합니다';
  }
  if (lowerMessage.includes('nonce too low')) {
    return 'Nonce가 너무 낮습니다. 이전 트랜잭션이 완료되지 않았을 수 있습니다';
  }
  if (lowerMessage.includes('gas')) {
    return '가스 추정에 실패했습니다. 트랜잭션이 실패할 수 있습니다';
  }
  if (lowerMessage.includes('deadline')) {
    return 'Deadline이 만료되었습니다';
  }
  if (lowerMessage.includes('signature') || lowerMessage.includes('invalid sig')) {
    return '서명이 유효하지 않습니다';
  }
  if (lowerMessage.includes('execution reverted')) {
    return '컨트랙트 실행이 실패했습니다';
  }
  if (isInternalRpcErrorMessage(lowerMessage)) {
    return 'RPC 노드 내부 오류가 발생했습니다. 네트워크 상태/잔액을 확인하고 잠시 후 다시 시도해주세요';
  }
  if (isNoDataReadContractErrorMessage(lowerMessage)) {
    if (
      lowerMessage.includes('function: name()') ||
      lowerMessage.includes('function: symbol()') ||
      lowerMessage.includes('function: decimals()') ||
      lowerMessage.includes('function: totalsupply()') ||
      lowerMessage.includes('function "name"') ||
      lowerMessage.includes('function "symbol"') ||
      lowerMessage.includes('function "decimals"') ||
      lowerMessage.includes('function "totalsupply"')
    ) {
      return '해당 주소는 ERC20 토큰 컨트랙트가 아니거나 아직 배포되지 않았습니다';
    }
    return '해당 주소에서 컨트랙트 데이터를 읽을 수 없습니다. 올바른 컨트랙트 주소인지 확인해주세요';
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요';
  }

  return message;
}

/**
 * 사용자가 MetaMask에서 트랜잭션/서명을 거부했는지 판별
 *
 * viem의 UserRejectedRequestError를 포함한 다양한 지갑 거부 패턴을 감지합니다.
 */
export function isUserRejectionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  if (message.includes('user rejected') || message.includes('user denied')) {
    return true;
  }
  return hasNestedRejectionSignal(error);
}

/**
 * 에러를 안전하게 로깅 (개발 환경에서만)
 *
 * @param context - 로깅 컨텍스트 (함수명 등)
 * @param error - 에러 객체
 */
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    if (isUserRejectionError(error)) {
      return;
    }
    console.warn(`[${context}]`, error);
  }
}
