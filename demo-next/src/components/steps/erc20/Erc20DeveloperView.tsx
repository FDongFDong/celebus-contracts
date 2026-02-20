'use client';

import { InteractionContractBinding } from '@/components/shared';
import { useErc20Store } from '@/store/useErc20Store';
import { TokenSetupSection } from '@/components/steps/erc20/sections/TokenSetupSection';
import { CoreErc20Section } from '@/components/steps/erc20/sections/CoreErc20Section';
import { PermitExtensionSection } from '@/components/steps/erc20/sections/PermitExtensionSection';
import { AdminSection } from '@/components/steps/erc20/sections/AdminSection';
import { Erc20QuerySection } from '@/components/steps/erc20/sections/Erc20QuerySection';

export function Erc20DeveloperView() {
  const tokenAddress = useErc20Store((s) => s.tokenAddress);
  const setTokenAddress = useErc20Store((s) => s.setTokenAddress);

  return (
    <div className="space-y-6">
      <InteractionContractBinding
        title="ERC20 인터랙션 대상 토큰"
        description="배포 단계에서 설정한 토큰 주소가 자동 표시됩니다. 이미 배포된 토큰 주소를 등록해 바로 인터랙션할 수 있습니다."
        address={tokenAddress}
        onChangeAddress={setTokenAddress}
        applyLabel="기존 토큰 등록"
      />

      <TokenSetupSection showAddressInput={false} showDeployButton={false} />
      <CoreErc20Section />
      <PermitExtensionSection />
      <AdminSection />
      <Erc20QuerySection />
    </div>
  );
}
