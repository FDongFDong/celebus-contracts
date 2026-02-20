import type { IndexedRecord, UIVoteRecord } from './types';

interface GroupedRecords {
  user1Records: IndexedRecord[];
  user2Records: IndexedRecord[];
  customRecords: IndexedRecord[];
}

export function groupRecordsByUser(records: UIVoteRecord[]): GroupedRecords {
  return records.reduce<GroupedRecords>(
    (acc, record, globalIndex) => {
      const indexedRecord: IndexedRecord = { record, globalIndex };

      if (record.userIndex === 0) {
        acc.user1Records.push(indexedRecord);
      } else if (record.userIndex === 1) {
        acc.user2Records.push(indexedRecord);
      } else if (record.userIndex === 99) {
        acc.customRecords.push(indexedRecord);
      }

      return acc;
    },
    { user1Records: [], user2Records: [], customRecords: [] }
  );
}
