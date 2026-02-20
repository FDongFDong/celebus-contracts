export type StatusType = 'success' | 'error' | 'info';

export interface StatusMessage {
  type: StatusType;
  message: string;
}

export type MnemonicWordCount = 12 | 24;

export const getStatusColor = (type: StatusType) => {
  switch (type) {
    case 'success':
      return 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'error':
      return 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    case 'info':
      return 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
  }
};
