'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Step0Setup } from '@/components/steps/main-voting/Step0Setup';

export function MainSimpleView() {
  return (
    <div className="space-y-6">
      <Card className="bg-muted/40">
        <CardContent className="p-3 text-xs text-muted-foreground">
          배포 단계에서는 컨트랙트 배포/Executor 등록/투표 타입/아티스트 설정까지 진행합니다.
          역할 할당, 레코드 작성, 서명/제출/검증은 인터랙션 단계에서 진행하세요.
        </CardContent>
      </Card>
      <Step0Setup />
    </div>
  );
}
