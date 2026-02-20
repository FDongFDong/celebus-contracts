/**
 * Boosting Step 2: 부스팅 레코드 생성
 */

'use client';

import { useId } from 'react';
import { StepCard } from '@/components/shared/StepCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { logError } from '@/lib/error-handler';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SelectedUser } from '@/lib/user-step-helpers';
import { BoostUserRecordPanel } from './step2/BoostUserRecordPanel';
import { useBoostStep2Record } from './step2/useBoostStep2Record';

export function BoostStep2Record() {
  const selectedUserId = useId();
  const customPrivateKeyId = useId();
  const userNonceId = useId();
  const timestampId = useId();
  const boostingIdId = useId();
  const missionIdId = useId();
  const optionIdId = useId();
  const boostingWithId = useId();
  const amtId = useId();

  const {
    selectedUser,
    setSelectedUser,
    customPrivateKey,
    setCustomPrivateKey,
    customAddress,
    userNonce,
    setUserNonce,
    timestamp,
    setTimestamp,
    boostingId,
    setBoostingId,
    missionId,
    setMissionId,
    optionId,
    setOptionId,
    boostingWith,
    setBoostingWith,
    amt,
    setAmt,
    recordsCount,
    user1Record,
    user2Record,
    customRecord,
    nonceCheckStatus,
    handleGenerateTimestamp,
    handleGenerateBoostingId,
    handleGenerateNonce,
    handleCheckNonce,
    handleAddRecord,
    handleDeleteRecord,
  } = useBoostStep2Record();

  const runSafe = (label: string, action: () => Promise<unknown> | unknown) => {
    Promise.resolve()
      .then(action)
      .catch((error) => logError(label, error));
  };

  return (
    <StepCard
      stepNumber={2}
      title="부스팅 레코드 생성"
      description="각 사용자가 부스팅할 데이터를 입력합니다"
    >
      <div className="space-y-6">
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2">Boosting 레코드 특징:</p>
            <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
              <li>
                <strong>단일 레코드:</strong> 각 사용자당 1개의 레코드만 배치에
                포함
              </li>
              <li>
                <strong>amt 필드:</strong> 부스팅 포인트/토큰 수량 (0보다 커야 함)
              </li>
              <li>
                <strong>boostingWith:</strong> 0=BP(Boosting Point), 1=CELB
              </li>
              <li>
                <strong>User Nonce:</strong> 사용자 입력 또는 자동 생성 후 중복 확인
              </li>
              <li>
                <strong>Boosting ID:</strong> 타임스탬프 기반 자동 생성
              </li>
            </ul>
          </CardContent>
        </Card>

        {selectedUser === 'custom' && (
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardContent className="p-3 space-y-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={customPrivateKeyId}>Custom Private Key</Label>
                <Input
                  id={customPrivateKeyId}
                  type="password"
                  value={customPrivateKey}
                  onChange={(e) => setCustomPrivateKey(e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  주소: <span className="font-mono break-all">{customAddress ?? '-'}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={selectedUserId}>사용자 선택</Label>
            <Select
              value={selectedUser}
              onValueChange={(value) => setSelectedUser(value as SelectedUser)}
            >
              <SelectTrigger id={selectedUserId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">User 1 (STEP 1)</SelectItem>
                <SelectItem value="1">User 2 (STEP 1)</SelectItem>
                <SelectItem value="custom">직접 입력 (Private Key)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={userNonceId}>User Nonce</Label>
            <Input
              id={userNonceId}
              type="text"
              value={userNonce}
              onChange={(e) => setUserNonce(e.target.value)}
              placeholder="직접 입력 또는 자동 생성"
              className="mb-1"
              autoComplete="off"
            />
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateNonce}
                className="flex-1 text-xs"
                title="타임스탬프 기반 유니크 Nonce 생성"
              >
                생성
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runSafe('BoostStep2Record.checkNonce', handleCheckNonce)}
                className="flex-1 text-xs"
                title="해당 Nonce가 이미 사용되었는지 확인"
              >
                중복확인
              </Button>
            </div>
            {nonceCheckStatus.type && (
              <p
                className={`text-xs mt-1 ${
                  nonceCheckStatus.type === 'success'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
                role="status"
                aria-live="polite"
              >
                {nonceCheckStatus.type === 'success' ? '✅' : '❌'}{' '}
                {nonceCheckStatus.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={timestampId}>Timestamp</Label>
            <Input
              id={timestampId}
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="직접 입력 또는 자동 생성"
              className="font-mono text-sm mb-1"
              autoComplete="off"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateTimestamp}
              className="w-full text-xs"
              title="현재 시간 기준 타임스탬프 생성"
            >
              현재 시간 생성
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={missionIdId}>Mission ID</Label>
            <Input
              id={missionIdId}
              type="text"
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={boostingIdId}>Boosting ID</Label>
            <Input
              id={boostingIdId}
              type="text"
              value={boostingId}
              onChange={(e) => setBoostingId(e.target.value)}
              placeholder="직접 입력 또는 자동 생성"
              className="font-mono text-sm mb-1"
              autoComplete="off"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateBoostingId}
              className="w-full text-xs"
              title="타임스탬프 + 사용자 인덱스 기반 유니크 ID 생성"
            >
              자동 생성
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={optionIdId}>Artist ID (optionId)</Label>
            <Input
              id={optionIdId}
              type="text"
              value={optionId}
              onChange={(e) => setOptionId(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={boostingWithId}>Boosting With</Label>
            <Select
              value={boostingWith}
              onValueChange={(value) => setBoostingWith(value as '0' | '1')}
            >
              <SelectTrigger id={boostingWithId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">BP (0)</SelectItem>
                <SelectItem value="1">CELB (1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={amtId}>Amount</Label>
            <Input
              id={amtId}
              type="text"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <Button onClick={handleAddRecord} className="w-full" aria-label="레코드 추가">
          + 레코드 추가
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            작성된 레코드 ({recordsCount}/20)
            <span className="text-muted-foreground text-xs ml-2">
              ※ 각 사용자당 1개의 레코드만 추가 가능
            </span>
          </p>

          <div className="grid grid-cols-3 gap-4">
            <BoostUserRecordPanel
              title="User 1 레코드"
              color="blue"
              userKey="user1"
              recordEntry={user1Record}
              onDelete={handleDeleteRecord}
            />
            <BoostUserRecordPanel
              title="User 2 레코드"
              color="green"
              userKey="user2"
              recordEntry={user2Record}
              onDelete={handleDeleteRecord}
            />
            <BoostUserRecordPanel
              title="Custom 레코드"
              color="purple"
              userKey="custom"
              recordEntry={customRecord}
              onDelete={handleDeleteRecord}
            />
          </div>
        </div>
      </div>
    </StepCard>
  );
}
