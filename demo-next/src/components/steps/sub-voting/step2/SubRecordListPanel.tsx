'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import type { IndexedSubVoteRecord } from './types';

interface SubRecordListPanelProps {
  title: string;
  titleIcon: ReactNode;
  titleClassName: string;
  cardClassName: string;
  records: IndexedSubVoteRecord[];
  emptyMessage: string;
  color: 'blue' | 'green' | 'purple';
  onDelete: (index: number) => void;
}

const rowClassMap = {
  blue: {
    border: 'border-info/30',
    text: 'text-info',
    empty: 'text-info/40',
  },
  green: {
    border: 'border-success/30',
    text: 'text-success',
    empty: 'text-success/40',
  },
  purple: {
    border: 'border-secondary/30',
    text: 'text-secondary',
    empty: 'text-secondary/40',
  },
} as const;

export function SubRecordListPanel({
  title,
  titleIcon,
  titleClassName,
  cardClassName,
  records,
  emptyMessage,
  color,
  onDelete,
}: SubRecordListPanelProps) {
  const styles = rowClassMap[color];

  return (
    <Card className={cardClassName}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className={`text-sm ${titleClassName}`}>
          {titleIcon}
          {title} ({records.length}개)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 min-h-[80px]">
        {records.length === 0 ? (
          <p className={`text-xs ${styles.empty}`}>{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {records.map(({ record, globalIndex }, idx) => (
              <Card key={globalIndex} className={`${styles.border} p-2 relative group`}>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(globalIndex)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  aria-label="레코드 삭제"
                >
                  ✕
                </Button>
                <p className={`text-xs font-mono ${styles.text}`}>
                  #{idx + 1}: M{record.missionId} V{record.votingId} Q{record.questionId}
                  <List className="inline h-3 w-3 ml-1" /> [{record.options.join(',')}] {record.votingAmt}
                </p>
                {record.userIndex === 99 ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Addr: <span className="font-mono">{record.userAddress.slice(0, 8)}...</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    User: <span className="font-mono">{record.userId}</span>
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
