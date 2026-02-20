/**
 * MainVoting Step 2: 투표 레코드 작성
 */

'use client';

import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { type VoteType } from '@/domain/entities/VoteRecord';
import { logError } from '@/lib/error-handler';
import type { SelectedUser } from '@/lib/user-step-helpers';
import { Step2RecordGroup } from './step2/Step2RecordGroup';
import { useMainStep2Records } from './step2/useMainStep2Records';

export function Step2Records() {
  const {
    form,
    selectedUser,
    setSelectedUser,
    mainVotingCustomUserAddress,
    userNonce,
    setUserNonce,
    isCheckingNonce,
    nonceCheckResult,
    voteType,
    setVoteType,
    recordsCount,
    user1Records,
    user2Records,
    customRecords,
    handleGenerateNonce,
    handleCheckNonce,
    handleGenerateTimestamp,
    handleGenerateVotingId,
    onSubmitRecord,
    handleDeleteRecord,
    handleClearAllRecords,
  } = useMainStep2Records();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const runSafe = (label: string, action: () => Promise<unknown> | unknown) => {
    Promise.resolve()
      .then(action)
      .catch((error) => logError(label, error));
  };

  return (
    <StepCard
      stepNumber={2}
      title="투표 레코드 작성"
      description="사용자별로 투표 레코드를 생성하고 관리합니다"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">사용자 선택</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="selectedUser">투표할 사용자</Label>
              <select
                id="selectedUser"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value as SelectedUser)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="0">사용자 1</option>
                <option value="1">사용자 2</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {selectedUser === 'custom' && (
              <div className="text-xs text-muted-foreground">
                Custom 주소: <span className="font-mono">{mainVotingCustomUserAddress ?? '-'}</span>
                {!mainVotingCustomUserAddress && (
                  <span className="ml-2 text-red-600">
                    (Step 1에서 Custom 계정을 할당해주세요)
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Nonce</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="userNonce">User Nonce</Label>
              <div className="flex gap-2">
                <Input
                  id="userNonce"
                  type="text"
                  value={userNonce}
                  onChange={(e) => setUserNonce(e.target.value)}
                  placeholder="Nonce"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateNonce}
                  size="sm"
                >
                  생성
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => runSafe('Step2Records.checkNonce', handleCheckNonce)}
                disabled={isCheckingNonce || !userNonce}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {isCheckingNonce ? '확인 중...' : 'Nonce 확인'}
              </Button>
            </div>

            {nonceCheckResult?.checked && (
              <div
                className={`p-3 rounded-md border text-sm ${
                  nonceCheckResult.isUsed
                    ? 'bg-red-500/10 border-red-500/30 text-red-700'
                    : 'bg-green-500/10 border-green-500/30 text-green-700'
                }`}
              >
                {nonceCheckResult.isUsed
                  ? '⚠️ 이미 사용된 Nonce입니다'
                  : '✅ 사용 가능한 Nonce입니다'}
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmitRecord)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-md">투표 레코드 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="timestamp">Timestamp</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="timestamp"
                      type="text"
                      {...register('timestamp')}
                      placeholder="Timestamp"
                      className={`font-mono transition-colors ${errors.timestamp ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                      aria-invalid={!!errors.timestamp}
                    />
                    {errors.timestamp && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.timestamp.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateTimestamp}
                    size="sm"
                  >
                    생성
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="missionId">미션 ID</Label>
                  <Input
                    id="missionId"
                    type="text"
                    {...register('missionId')}
                    className={`transition-colors ${errors.missionId ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                    aria-invalid={!!errors.missionId}
                  />
                  {errors.missionId && (
                    <p className="text-xs text-destructive">{errors.missionId.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="votingId">투표 ID</Label>
                  <div className="flex gap-1">
                    <div className="flex-1">
                      <Input
                        id="votingId"
                        type="text"
                        {...register('votingId')}
                        className={`font-mono transition-colors ${errors.votingId ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                        aria-invalid={!!errors.votingId}
                      />
                      {errors.votingId && (
                        <p className="text-xs text-destructive">{errors.votingId.message}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateVotingId}
                      size="sm"
                    >
                      생성
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="optionId">옵션 ID</Label>
                  <Input
                    id="optionId"
                    type="text"
                    {...register('optionId')}
                    className={`transition-colors ${errors.optionId ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                    aria-invalid={!!errors.optionId}
                  />
                  {errors.optionId && (
                    <p className="text-xs text-destructive">{errors.optionId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="voteType">투표 타입</Label>
                  <select
                    id="voteType"
                    value={voteType.toString()}
                    onChange={(e) => setVoteType(Number(e.target.value) as VoteType)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    <option value="0">0 (Forget)</option>
                    <option value="1">1 (Remember)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="userId">사용자 ID</Label>
                  <Input
                    id="userId"
                    type="text"
                    {...register('userId')}
                    className={`transition-colors ${errors.userId ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                    aria-invalid={!!errors.userId}
                  />
                  {errors.userId && (
                    <p className="text-xs text-destructive">{errors.userId.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="votingAmt">투표량</Label>
                  <Input
                    id="votingAmt"
                    type="text"
                    {...register('votingAmt')}
                    className={`transition-colors ${errors.votingAmt ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                    aria-invalid={!!errors.votingAmt}
                  />
                  {errors.votingAmt && (
                    <p className="text-xs text-destructive">{errors.votingAmt.message}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full">
                레코드 추가
              </Button>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-md">레코드 목록 (총 {recordsCount}개)</CardTitle>
            {recordsCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAllRecords}
              >
                전체 삭제
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Step2RecordGroup
              title="사용자 1"
              emptyMessage="사용자 1 레코드가 없습니다"
              color="blue"
              records={user1Records}
              onDelete={handleDeleteRecord}
            />

            <Step2RecordGroup
              title="사용자 2"
              emptyMessage="사용자 2 레코드가 없습니다"
              color="green"
              records={user2Records}
              onDelete={handleDeleteRecord}
            />

            {customRecords.length > 0 && (
              <Step2RecordGroup
                title="직접입력"
                emptyMessage="직접입력 레코드가 없습니다"
                color="purple"
                records={customRecords}
                onDelete={handleDeleteRecord}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </StepCard>
  );
}
