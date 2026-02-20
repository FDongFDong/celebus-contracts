'use client';

import { Card, CardContent } from '@/components/ui/card';
import { SubStep0Setup } from '@/components/steps/sub-voting/SubStep0Setup';

export function SubSimpleView() {
  return (
    <div className="space-y-6">
      <Card className="bg-muted/40">
        <CardContent className="p-3 text-xs text-muted-foreground">
          배포 단계에서는 컨트랙트 배포/Executor/질문/옵션 등록까지 완료합니다.
          레코드 작성과 결과 확인은 인터랙션 단계에서 진행하세요.
        </CardContent>
      </Card>
      <SubStep0Setup />
    </div>
  );
}
