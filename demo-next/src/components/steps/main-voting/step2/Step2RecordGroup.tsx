'use client';

import { Step2RecordCard } from './Step2RecordCard';
import type { IndexedRecord, RecordCardColor } from './types';

interface Step2RecordGroupProps {
  title: string;
  emptyMessage: string;
  color: RecordCardColor;
  records: IndexedRecord[];
  onDelete: (index: number) => void;
}

const titleColorClasses: Record<RecordCardColor, string> = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  purple: 'text-purple-700',
};

export function Step2RecordGroup({
  title,
  emptyMessage,
  color,
  records,
  onDelete,
}: Step2RecordGroupProps) {
  return (
    <div>
      <h4 className={`text-sm font-semibold mb-2 ${titleColorClasses[color]}`}>
        {title} ({records.length}개)
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {records.length === 0 ? (
          <p className="text-xs text-muted-foreground col-span-2">{emptyMessage}</p>
        ) : (
          records.map(({ record, globalIndex }, localIndex) => (
            <Step2RecordCard
              key={globalIndex}
              record={record}
              globalIndex={globalIndex}
              localIndex={localIndex}
              color={color}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
