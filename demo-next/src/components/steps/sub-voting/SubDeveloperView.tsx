'use client';

import dynamic from 'next/dynamic';
import { StepSkeleton } from '@/components/shared/StepSkeleton';
import { InteractionContractBinding } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';

const SubStep0Setup = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep0Setup').then((m) => ({
      default: m.SubStep0Setup,
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

const SubStep2Records = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep2Records').then((m) => ({
      default: m.SubStep2Records,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={2} title="Records" category="config" />
    ),
    ssr: false,
  }
);

const SubStep3UserSigs = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep3UserSigs').then((m) => ({
      default: m.SubStep3UserSigs,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={3} title="User Sigs" category="action" />
    ),
    ssr: false,
  }
);

const SubStep4Domain = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep4Domain').then((m) => ({
      default: m.SubStep4Domain,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={4} title="Domain" category="config" />
    ),
    ssr: false,
  }
);

const SubStep5Struct = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep5Struct').then((m) => ({
      default: m.SubStep5Struct,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={5} title="Struct" category="config" />
    ),
    ssr: false,
  }
);

const SubStep6Digest = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep6Digest').then((m) => ({
      default: m.SubStep6Digest,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={6} title="Digest" category="action" />
    ),
    ssr: false,
  }
);

const SubStep7Submit = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep7Submit').then((m) => ({
      default: m.SubStep7Submit,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={7} title="Submit" category="action" />
    ),
    ssr: false,
  }
);

const SubStep8Query = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep8Query').then((m) => ({
      default: m.SubStep8Query,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={8} title="Query" category="result" />
    ),
    ssr: false,
  }
);

const SubStep9Events = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep9Events').then((m) => ({
      default: m.SubStep9Events,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={9} title="Events" category="result" />
    ),
    ssr: false,
  }
);

const SubStep10Verifier = dynamic(
  () =>
    import('@/components/steps/sub-voting/SubStep10Verifier').then((m) => ({
      default: m.SubStep10Verifier,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={10} title="Verifier" category="result" />
    ),
    ssr: false,
  }
);

export function SubDeveloperView() {
  const contractAddress = useAppStore((s) => s.contractAddress);
  const setContractAddress = useAppStore((s) => s.setContractAddress);

  return (
    <div className="space-y-6">
      <InteractionContractBinding
        title="SubVoting 인터랙션 대상 컨트랙트"
        description="기존 배포 SubVoting 주소를 연결한 뒤, 관리자 설정/배치 준비/서명 제출/조회 검증을 분리해 진행합니다."
        address={contractAddress}
        onChangeAddress={setContractAddress}
      />
      <Card className="bg-muted/40">
        <CardContent className="p-3 text-xs text-muted-foreground">
          인터랙션 탭에서도 질문/옵션 등록, 사용자 서명, 배치 제출, 조회/검증을 메인과 동일한 단계로 진행할 수 있습니다.
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
          <SubStep0Setup
            showDeploySection={false}
            title="배포된 컨트랙트 관리자 설정"
            helperText="Executor 변경 및 질문/옵션 등록을 배포 후에도 수행합니다."
          />
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Step1Executor />
          <SubStep2Records />
          <SubStep3UserSigs />
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <SubStep4Domain />
          <SubStep5Struct />
          <SubStep6Digest />
          <SubStep7Submit />
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <SubStep8Query />
          <SubStep9Events />
          <SubStep10Verifier />
        </TabsContent>
      </Tabs>
    </div>
  );
}
