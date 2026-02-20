'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TokenSetupSection } from '@/components/steps/erc20/sections/TokenSetupSection';

export function Erc20SimpleView() {
  return (
    <div className="space-y-6">
      <Card className="bg-muted/40">
        <CardContent className="p-3 text-xs text-muted-foreground">
          ERC20 토큰 초기값을 설정하고 새로 배포하는 단계입니다.
          기존 배포 주소 등록과 인터랙션은 다음 단계에서 진행합니다.
        </CardContent>
      </Card>
      <TokenSetupSection showAddressInput={false} showDeployButton />
    </div>
  );
}
