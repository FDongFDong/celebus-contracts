'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BoostStep0Setup } from '@/components/steps/boosting/BoostStep0Setup';

export function BoostSimpleView() {
  return (
    <div className="space-y-6">
      <Card className="bg-muted/40">
        <CardContent className="p-3 text-xs text-muted-foreground">
          배포 단계에서는 컨트랙트 배포/Executor/부스팅 타입/아티스트 등록까지 진행합니다.
          레코드 작성과 제출/조회는 인터랙션 단계에서 진행하세요.
        </CardContent>
      </Card>
      <BoostStep0Setup />
    </div>
  );
}
