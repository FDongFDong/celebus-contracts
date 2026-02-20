'use client';

import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Hash, Key, Lightbulb, User, XCircle } from 'lucide-react';
import { logError } from '@/lib/error-handler';
import type { SelectedUser } from '@/lib/user-step-helpers';
import { SubRecordListPanel } from './step2/SubRecordListPanel';
import { useSubStep2Records } from './step2/useSubStep2Records';

export function SubStep2Records() {
  const {
    selectedUser,
    setSelectedUser,
    customPrivateKey,
    customWalletAddress,
    handleCustomPrivateKeyChange,
    userNonce,
    setUserNonce,
    isCheckingNonce,
    nonceCheckResult,
    timestamp,
    setTimestamp,
    missionId,
    setMissionId,
    votingId,
    setVotingId,
    questionId,
    setQuestionId,
    options,
    setOptions,
    votingAmt,
    setVotingAmt,
    optionsError,
    clearOptionsError,
    recordsCount,
    maxRecordsPerBatch,
    maxOptionsPerRecord,
    user1Records,
    user2Records,
    customRecords,
    handleGenerateNonce,
    handleCheckNonce,
    handleGenerateTimestamp,
    handleGenerateVotingId,
    handleAddRecord,
    handleDeleteRecord,
  } = useSubStep2Records();

  const runSafe = (label: string, action: () => Promise<unknown> | unknown) => {
    Promise.resolve()
      .then(action)
      .catch((error) => logError(label, error));
  };

  return (
    <StepCard stepNumber={2} title="SubVoting 투표 레코드 생성(Frontend)" badgeColor="default">
      <p className="text-sm text-muted-foreground mb-4">각 사용자가 투표할 데이터를 입력합니다</p>

      <Alert className="mb-4">
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm font-semibold mb-1">백엔드 시뮬레이션:</p>
          <ul className="text-xs space-y-1 list-disc ml-4">
            <li>
              <strong>User Nonce:</strong> 사용자 입력 또는 자동 생성 후 중복 확인 (재사용 방지)
            </li>
            <li>
              <strong>Voting ID:</strong> 프론트엔드에서 타임스탬프 기반 자동 생성 (사용자별 유니크)
            </li>
            <li>
              <strong>userId:</strong> 백엔드가 지갑 주소를 기반으로 DB에서 자동 설정
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {selectedUser === 'custom' && (
        <Card className="bg-secondary/10 border-secondary/30 mb-4">
          <CardContent className="p-3 space-y-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sub-custom-private-key">
                <Key className="inline h-4 w-4 mr-1" />
                Custom Private Key
              </Label>
              <Input
                id="sub-custom-private-key"
                type="password"
                autoComplete="off"
                value={customPrivateKey}
                onChange={(e) => handleCustomPrivateKeyChange(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Address: <span className="font-mono break-all">{customWalletAddress ?? '-'}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-user-select">
            <User className="inline h-4 w-4 mr-1" />
            사용자 선택
          </Label>
          <Select value={selectedUser} onValueChange={(value) => setSelectedUser(value as SelectedUser)}>
            <SelectTrigger id="sub-user-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">사용자 1 (STEP 1)</SelectItem>
              <SelectItem value="1">사용자 2 (STEP 1)</SelectItem>
              <SelectItem value="custom">직접 입력 (Private Key)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-user-nonce">
            <Hash className="inline h-4 w-4 mr-1" />
            User Nonce
          </Label>
          <Input
            id="sub-user-nonce"
            type="text"
            value={userNonce}
            onChange={(e) => setUserNonce(e.target.value)}
            placeholder="직접 입력 또는 자동 생성"
          />
          <div className="flex gap-1 mt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleGenerateNonce} className="flex-1 text-xs">
              생성
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => runSafe('SubStep2Records.checkNonce', handleCheckNonce)}
              disabled={isCheckingNonce}
              className="flex-1 text-xs"
            >
              {isCheckingNonce ? '확인 중...' : '중복확인'}
            </Button>
          </div>
          {nonceCheckResult && (
            <Badge variant={nonceCheckResult.isUsed ? 'destructive' : 'default'} className="mt-1">
              {nonceCheckResult.isUsed ? (
                <XCircle className="h-3 w-3 mr-1" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {nonceCheckResult.message}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-timestamp">Timestamp</Label>
          <Input
            id="sub-timestamp"
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="직접 입력 또는 자동 생성"
            className="font-mono text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleGenerateTimestamp} className="w-full mt-1 text-xs">
            현재 시간 생성
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-mission-id">Mission ID</Label>
          <Input id="sub-mission-id" type="text" value={missionId} onChange={(e) => setMissionId(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-voting-id">Voting ID</Label>
          <Input
            id="sub-voting-id"
            type="text"
            value={votingId}
            onChange={(e) => setVotingId(e.target.value)}
            placeholder="직접 입력 또는 자동 생성"
            className="font-mono text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleGenerateVotingId} className="w-full mt-1 text-xs">
            자동 생성
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-question-id">Question ID</Label>
          <Input id="sub-question-id" type="text" value={questionId} onChange={(e) => setQuestionId(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-options">Options (쉼표로 구분)</Label>
          <Input
            id="sub-options"
            type="text"
            value={options}
            onChange={(e) => {
              setOptions(e.target.value);
              clearOptionsError();
            }}
            placeholder="예: 1,2,3"
            className={optionsError ? 'border-destructive' : ''}
            aria-describedby={optionsError ? 'sub-options-error' : undefined}
          />
          {optionsError ? (
            <p id="sub-options-error" className="text-xs text-destructive mt-1">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              {optionsError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">최대 {maxOptionsPerRecord}개</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sub-voting-amt">Voting Amount</Label>
          <Input id="sub-voting-amt" type="text" value={votingAmt} onChange={(e) => setVotingAmt(e.target.value)} />
        </div>
      </div>

      <Button type="button" onClick={handleAddRecord} className="w-full" aria-label="레코드 추가">
        + 레코드 추가
      </Button>

      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          작성된 레코드 ({recordsCount}/{maxRecordsPerBatch})
        </p>

        <div className="grid grid-cols-3 gap-4">
          <SubRecordListPanel
            title="사용자 1 레코드"
            titleIcon={<User className="inline h-4 w-4 mr-1" />}
            titleClassName="text-info-foreground"
            cardClassName="bg-info/10 border-info/30"
            records={user1Records}
            emptyMessage="사용자 1 레코드가 없습니다"
            color="blue"
            onDelete={handleDeleteRecord}
          />
          <SubRecordListPanel
            title="사용자 2 레코드"
            titleIcon={<User className="inline h-4 w-4 mr-1" />}
            titleClassName="text-success-foreground"
            cardClassName="bg-success/10 border-success/30"
            records={user2Records}
            emptyMessage="사용자 2 레코드가 없습니다"
            color="green"
            onDelete={handleDeleteRecord}
          />
          <SubRecordListPanel
            title="직접입력 레코드"
            titleIcon={<Key className="inline h-4 w-4 mr-1" />}
            titleClassName="text-secondary-foreground"
            cardClassName="bg-secondary/10 border-secondary/30"
            records={customRecords}
            emptyMessage="직접입력 레코드가 없습니다"
            color="purple"
            onDelete={handleDeleteRecord}
          />
        </div>
      </div>
    </StepCard>
  );
}
