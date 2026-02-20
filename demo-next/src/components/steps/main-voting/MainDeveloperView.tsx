'use client';

import dynamic from 'next/dynamic';
import { StepSkeleton } from '@/components/shared/StepSkeleton';
import { InteractionContractBinding } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';

const Step0Setup = dynamic(
  () =>
    import('@/components/steps/main-voting/Step0Setup').then((m) => ({
      default: m.Step0Setup,
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
      <StepSkeleton stepNumber={1} title="Executor" category="setup" />
    ),
    ssr: false,
  }
);

const Step2Records = dynamic(
  () =>
    import('@/components/steps/main-voting/Step2Records').then((m) => ({
      default: m.Step2Records,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={2} title="Records" category="config" />
    ),
    ssr: false,
  }
);

const Step3UserSigs = dynamic(
  () =>
    import('@/components/steps/main-voting/Step3UserSigs').then((m) => ({
      default: m.Step3UserSigs,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={3} title="User Sigs" category="action" />
    ),
    ssr: false,
  }
);

const Step4Domain = dynamic(
  () =>
    import('@/components/steps/main-voting/Step4Domain').then((m) => ({
      default: m.Step4Domain,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={4} title="Domain" category="config" />
    ),
    ssr: false,
  }
);

const Step5Struct = dynamic(
  () =>
    import('@/components/steps/main-voting/Step5Struct').then((m) => ({
      default: m.Step5Struct,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={5} title="Struct" category="config" />
    ),
    ssr: false,
  }
);

const Step6Digest = dynamic(
  () =>
    import('@/components/steps/main-voting/Step6Digest').then((m) => ({
      default: m.Step6Digest,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={6} title="Digest" category="action" />
    ),
    ssr: false,
  }
);

const Step7Submit = dynamic(
  () =>
    import('@/components/steps/main-voting/Step7Submit').then((m) => ({
      default: m.Step7Submit,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={7} title="Submit" category="action" />
    ),
    ssr: false,
  }
);

const Step8Query = dynamic(
  () =>
    import('@/components/steps/main-voting/Step8Query').then((m) => ({
      default: m.Step8Query,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={8} title="Query" category="result" />
    ),
    ssr: false,
  }
);

const Step9Events = dynamic(
  () =>
    import('@/components/steps/main-voting/Step9Events').then((m) => ({
      default: m.Step9Events,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={9} title="Events" category="result" />
    ),
    ssr: false,
  }
);

const Step10Verifier = dynamic(
  () =>
    import('@/components/steps/main-voting/Step10Verifier').then((m) => ({
      default: m.Step10Verifier,
    })),
  {
    loading: () => (
      <StepSkeleton stepNumber={10} title="Verifier" category="result" />
    ),
    ssr: false,
  }
);

export function MainDeveloperView() {
  const contractAddress = useAppStore((s) => s.contractAddress);
  const setContractAddress = useAppStore((s) => s.setContractAddress);

  return (
    <div className="space-y-6">
      <InteractionContractBinding
        title="MainVoting 인터랙션 대상 컨트랙트"
        description="기존 배포 MainVoting 주소를 연결한 뒤, 관리자 설정(Executor/타입/아티스트)과 배치 서명/제출/조회 흐름을 탭별로 진행합니다."
        address={contractAddress}
        onChangeAddress={setContractAddress}
      />
      <Card className="bg-muted/40">
        <CardContent className="p-3 text-xs text-muted-foreground">
          배포가 끝난 뒤에도 이 화면에서 Executor, 투표 타입, 아티스트를 다시 설정할 수 있습니다.
          아래 탭으로 구간을 나눠 스크롤 길이를 줄였습니다.
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
          <Step0Setup
            showDeploySection={false}
            title="배포된 컨트랙트 관리자 설정"
            description="Executor, 투표 타입 이름, 아티스트를 배포 후에도 변경할 수 있습니다."
          />
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Step1Executor />
          <Step2Records />
          <Step3UserSigs />
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Step4Domain />
          <Step5Struct />
          <Step6Digest />
          <Step7Submit />
        </TabsContent>

        <TabsContent value="query" className="space-y-6">
          <Step8Query />
          <Step9Events />
          <Step10Verifier />
        </TabsContent>
      </Tabs>
    </div>
  );
}
