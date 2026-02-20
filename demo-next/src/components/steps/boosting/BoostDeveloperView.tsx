'use client';

import dynamic from 'next/dynamic';
import { StepSkeleton } from '@/components/shared/StepSkeleton';
import { InteractionContractBinding } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';

const BoostStep0Setup = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep0Setup').then((m) => ({
      default: m.BoostStep0Setup,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={0} title="Admin Setup" category="setup" />
    ),
    ssr: false,
  }
);

const Step1Executor = dynamic(
  () =>
    import('@/components/steps/main-voting/Step1Executor').then((m) => ({
      default: m.Step1Executor,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={1} title="Role Assignment" category="setup" />
    ),
    ssr: false,
  }
);

const BoostStep2Record = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep2Record').then((m) => ({
      default: m.BoostStep2Record,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={2} title="Record" category="config" />
    ),
    ssr: false,
  }
);

const BoostStep3UserSigs = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep3UserSigs').then((m) => ({
      default: m.BoostStep3UserSigs,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={3} title="User Sigs" category="action" />
    ),
    ssr: false,
  }
);

const BoostStep4Domain = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep4Domain').then((m) => ({
      default: m.BoostStep4Domain,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={4} title="Domain" category="config" />
    ),
    ssr: false,
  }
);

const BoostStep5Struct = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep5Struct').then((m) => ({
      default: m.BoostStep5Struct,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={5} title="Struct" category="config" />
    ),
    ssr: false,
  }
);

const BoostStep6Digest = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep6Digest').then((m) => ({
      default: m.BoostStep6Digest,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={6} title="Digest" category="action" />
    ),
    ssr: false,
  }
);

const BoostStep7Submit = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep7Submit').then((m) => ({
      default: m.BoostStep7Submit,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={7} title="Submit" category="action" />
    ),
    ssr: false,
  }
);

const BoostStep8Query = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep8Query').then((m) => ({
      default: m.BoostStep8Query,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={8} title="Query" category="result" />
    ),
    ssr: false,
  }
);

const BoostStep9Events = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep9Events').then((m) => ({
      default: m.BoostStep9Events,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={9} title="Events" category="result" />
    ),
    ssr: false,
  }
);

const BoostStep10Verifier = dynamic(
  () =>
    import('@/components/steps/boosting/BoostStep10Verifier').then((m) => ({
      default: m.BoostStep10Verifier,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={10} title="Verifier" category="result" />
    ),
    ssr: false,
  }
);

export function BoostDeveloperView() {
  const contractAddress = useAppStore((s) => s.contractAddress);
  const setContractAddress = useAppStore((s) => s.setContractAddress);

  return (
    <div className="space-y-6">
      <InteractionContractBinding
        title="Boosting 인터랙션 대상 컨트랙트"
        description="기존 배포 Boosting 주소를 연결한 뒤, 관리자 설정/배치 준비/서명 제출/조회 검증을 분리해 진행합니다."
        address={contractAddress}
        onChangeAddress={setContractAddress}
      />
      <Card className="bg-muted/40">
        <CardContent className="p-3 text-xs text-muted-foreground">
          인터랙션 탭에서도 Executor, 타입, 아티스트 설정부터 사용자 서명, 배치 제출, 조회/검증까지 메인과 동일한 단계로 처리합니다.
        </CardContent>
      </Card>

      <Tabs defaultValue="admin" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="admin">관리자 설정</TabsTrigger>
          <TabsTrigger value="records">배치 준비</TabsTrigger>
          <TabsTrigger value="submit">서명/제출</TabsTrigger>
          <TabsTrigger value="query">조회/검증</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-6">
          <BoostStep0Setup
            showDeploySection={false}
            title="배포된 컨트랙트 관리자 설정"
            description="Executor, 부스팅 타입, 아티스트 정보를 배포 후에도 변경할 수 있습니다."
          />
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Step1Executor />
          <BoostStep2Record />
          <BoostStep3UserSigs />
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <BoostStep4Domain />
          <BoostStep5Struct />
          <BoostStep6Digest />
          <BoostStep7Submit />
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <BoostStep8Query />
          <BoostStep9Events />
          <BoostStep10Verifier />
        </TabsContent>
      </Tabs>
    </div>
  );
}
