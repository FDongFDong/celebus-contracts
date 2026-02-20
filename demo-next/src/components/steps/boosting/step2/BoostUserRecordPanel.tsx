'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IndexedBoostRecord, RecordBucketKey } from './types';

interface BoostUserRecordPanelProps {
  title: string;
  color: 'blue' | 'green' | 'purple';
  userKey: RecordBucketKey;
  recordEntry: IndexedBoostRecord | null;
  onDelete: (index: number) => void;
}

const panelClassMap = {
  blue: {
    card: 'bg-blue-500/10 border-blue-500/30',
    title: 'text-blue-700',
  },
  green: {
    card: 'bg-green-500/10 border-green-500/30',
    title: 'text-green-700',
  },
  purple: {
    card: 'bg-purple-500/10 border-purple-500/30',
    title: 'text-purple-700',
  },
} as const;

const emptyMessages: Record<RecordBucketKey, string> = {
  user1: 'User 1 레코드가 없습니다',
  user2: 'User 2 레코드가 없습니다',
  custom: 'Custom 레코드가 없습니다',
};

export function BoostUserRecordPanel({
  title,
  color,
  userKey,
  recordEntry,
  onDelete,
}: BoostUserRecordPanelProps) {
  const styles = panelClassMap[color];

  return (
    <Card className={styles.card}>
      <CardHeader className="p-3">
        <CardTitle className={`text-sm font-semibold ${styles.title}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2 min-h-[80px]">
        {!recordEntry ? (
          <p className="text-muted-foreground text-xs opacity-60">
            {emptyMessages[userKey]}
          </p>
        ) : (
          <BoostRecordItem
            userKey={userKey}
            recordEntry={recordEntry}
            onDelete={onDelete}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface BoostRecordItemProps {
  userKey: RecordBucketKey;
  recordEntry: IndexedBoostRecord;
  onDelete: (index: number) => void;
}

function BoostRecordItem({ userKey, recordEntry, onDelete }: BoostRecordItemProps) {
  const { record, globalIndex } = recordEntry;
  const boostLabel = record.boostingWith === 0 ? 'BP' : 'CELB';
  const displayInfo =
    userKey === 'custom'
      ? `Addr: ${record.userAddress.slice(0, 8)}...`
      : `User: ${record.userId}`;

  return (
    <Card className="bg-card border-border relative group">
      <CardContent className="p-2 space-y-1">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(globalIndex)}
          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="레코드 삭제"
        >
          ×
        </Button>
        <p className="text-xs font-mono">
          M{record.missionId} B{record.boostingId} C{record.optionId}
        </p>
        <p className="text-xs font-semibold">
          {boostLabel}: {record.amt}
        </p>
        <p className="text-xs text-muted-foreground">{displayInfo}</p>
      </CardContent>
    </Card>
  );
}
