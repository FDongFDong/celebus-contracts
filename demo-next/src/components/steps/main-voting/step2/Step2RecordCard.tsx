'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import type { RecordCardColor, UIVoteRecord } from './types';

interface Step2RecordCardProps {
  record: UIVoteRecord;
  globalIndex: number;
  localIndex: number;
  color: RecordCardColor;
  onDelete: (index: number) => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-700',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-700',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-700',
  },
} as const;

export function Step2RecordCard({
  record,
  globalIndex,
  localIndex,
  color,
  onDelete,
}: Step2RecordCardProps) {
  const Icon = record.voteType === 1 ? ThumbsUp : ThumbsDown;
  const { bg, border, text } = colorClasses[color];

  return (
    <Card className={`relative group p-3 ${bg} ${border}`}>
      <button
        type="button"
        onClick={() => onDelete(globalIndex)}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4 text-red-600 hover:text-red-800" />
      </button>

      <div className="space-y-1">
        <p className={`text-xs font-mono ${text} flex items-center gap-1`}>
          <Badge variant="outline" className="text-xs">
            #{localIndex + 1}
          </Badge>
          <span>
            M{record.missionId} V{record.votingId} C{record.optionId}
          </span>
          <Icon className="w-3 h-3" />
          <span>{record.votingAmt}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {record.userIndex === 99 ? (
            <>
              Addr:{' '}
              <span className="font-mono">{record.userAddress.slice(0, 8)}...</span>
            </>
          ) : (
            <>
              User: <span className="font-mono">{record.userId}</span>
            </>
          )}
        </p>
      </div>
    </Card>
  );
}
