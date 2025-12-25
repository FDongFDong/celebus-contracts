/**
 * Step 2: 투표 레코드 작성
 *
 * 사용자별로 투표 레코드를 생성하고 관리하는 컴포넌트
 */

import { BaseStep } from '../BaseStep';
import type { AppState } from '../../state/AppState';
import { VoteRecord, type VoteRecordData, type VoteType } from '../../../domain/entities/VoteRecord';
import type { WalletAdapter } from '../../../infrastructure/viem/WalletAdapter';
import * as UIHelper from '../../utils/UIHelper';
import { renderIcons } from '../shared/icons';
import { createPublicClient, http } from 'viem';
import {
  type UIVoteRecord,
  CONFIG,
  renderRecordForm,
  renderNonceCheckResult,
  renderNonceCheckError,
  updateRecordListsUI,
} from './Step2RecordsUI';

export class Step2Records extends BaseStep {
  private records: UIVoteRecord[] = [];
  private user1Nonce: string = '';
  private user2Nonce: string = '';
  private customNonce: string = '';
  private customWallet: WalletAdapter | null = null;

  constructor(state: AppState) {
    super(state);
  }

  render(): string {
    return renderRecordForm();
  }

  init(): void {
    super.init();
    this.bindEvents();
    renderIcons();
  }

  private bindEvents(): void {
    UIHelper.safeAddEventListener('selectedUser', 'change', () => this.onUserSelectionChange());
    UIHelper.safeAddEventListener('customPrivateKey', 'change', () => this.updateCustomAddress());
    UIHelper.safeAddEventListener('generateNonceBtn', 'click', () => this.generateUserNonce());
    UIHelper.safeAddEventListener('checkNonceBtn', 'click', () => this.checkUserNonce());
    UIHelper.safeAddEventListener('generateTimestampBtn', 'click', () => this.generateTimestamp());
    UIHelper.safeAddEventListener('generateVotingIdBtn', 'click', () => this.generateVotingId());
    UIHelper.safeAddEventListener('addRecordBtn', 'click', () => this.addRecord());
  }

  private onUserSelectionChange(): void {
    const selectedValue = UIHelper.getInputValue('selectedUser');
    const customSection = document.getElementById('customPrivateKeySection');

    if (selectedValue === 'custom') {
      customSection?.classList.remove('hidden');
    } else {
      customSection?.classList.add('hidden');
    }
  }

  private updateCustomAddress(): void {
    const privateKey = UIHelper.getInputValue('customPrivateKey').trim() as `0x${string}`;
    const addressSpan = document.getElementById('customUserAddress');

    if (!addressSpan) return;

    try {
      import('../../../infrastructure/viem/WalletAdapter').then(({ WalletAdapter }) => {
        const wallet = new WalletAdapter(privateKey);
        addressSpan.textContent = wallet.address;
        this.customWallet = wallet;
      }).catch(() => {
        addressSpan.textContent = 'Invalid key';
      });
    } catch {
      addressSpan.textContent = 'Invalid key';
    }
  }

  private generateTimestamp(): void {
    const timestamp = Date.now().toString();
    UIHelper.setInputValue('recordTimestamp', timestamp);
  }

  private generateVotingId(): void {
    const selectedUserValue = UIHelper.getInputValue('selectedUser');
    const selectedUserIndex = selectedUserValue === 'custom' ? 99 : parseInt(selectedUserValue);

    const timestamp = Date.now().toString();
    const timestampPart = timestamp.slice(-8);
    const votingId = timestampPart + selectedUserIndex;

    UIHelper.setInputValue('votingId', votingId);
  }

  private generateUserNonce(): void {
    const selectedUserValue = UIHelper.getInputValue('selectedUser');
    const selectedUserIndex = selectedUserValue === 'custom' ? 99 : parseInt(selectedUserValue);

    const timestamp = Date.now().toString();
    const nonce = parseInt(timestamp.slice(-9)) * 10 + selectedUserIndex;

    UIHelper.setInputValue('userNonce', nonce.toString());

    const resultDiv = document.getElementById('nonceCheckResult');
    resultDiv?.classList.add('hidden');
  }

  private async checkUserNonce(): Promise<void> {
    const resultDiv = document.getElementById('nonceCheckResult');
    if (!resultDiv) return;

    try {
      const selectedUserValue = UIHelper.getInputValue('selectedUser');
      const selectedUserIndex = selectedUserValue === 'custom' ? 99 : parseInt(selectedUserValue);

      const currentState = this.state.getState();
      const userWallets = currentState.userWallets;
      let wallet: WalletAdapter | null = null;

      if (selectedUserIndex === 0) {
        wallet = userWallets[0] ?? null;
      } else if (selectedUserIndex === 1) {
        wallet = userWallets[1] ?? null;
      } else {
        wallet = this.customWallet;
      }

      if (!wallet) {
        const msg = selectedUserIndex === 99
          ? 'Custom 지갑이 설정되지 않았습니다. Private Key를 입력해주세요!'
          : '먼저 Step 1에서 지갑을 초기화해주세요!';
        alert(msg);
        return;
      }

      const nonceValue = UIHelper.getInputValue('userNonce');
      if (!nonceValue || nonceValue === '') {
        alert('먼저 Nonce 값을 입력하거나 생성해주세요!');
        return;
      }

      if (!/^\d+$/.test(nonceValue)) {
        alert('유효하지 않은 Nonce 값입니다. 숫자만 입력해주세요.');
        return;
      }

      const nonceBigInt = BigInt(nonceValue);
      const contractAddress = currentState.contractAddress;

      if (!contractAddress) {
        alert('컨트랙트 주소가 설정되지 않았습니다!');
        return;
      }

      const publicClient = createPublicClient({
        chain: {
          id: 5611,
          name: 'BNB Opbnb Testnet',
          nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
          rpcUrls: {
            default: { http: ['https://opbnb-testnet-rpc.bnbchain.org'] },
            public: { http: ['https://opbnb-testnet-rpc.bnbchain.org'] },
          },
        },
        transport: http(),
      });

      const isUsed = await publicClient.readContract({
        address: contractAddress,
        abi: [{
          name: 'usedUserNonces',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'user', type: 'address' },
            { name: 'nonce', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        }],
        functionName: 'usedUserNonces',
        args: [wallet.address, nonceBigInt],
      });

      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = renderNonceCheckResult(isUsed as boolean);
      renderIcons();

      if (!isUsed) {
        if (selectedUserIndex === 0) this.user1Nonce = nonceValue;
        else if (selectedUserIndex === 1) this.user2Nonce = nonceValue;
        else this.customNonce = nonceValue;
      }
    } catch (error) {
      console.error('[ERROR] Failed to check user nonce:', error);
      resultDiv.classList.remove('hidden');
      resultDiv.innerHTML = renderNonceCheckError(
        error instanceof Error ? error.message : 'Unknown error'
      );
      renderIcons();
    }
  }

  private addRecord(): void {
    if (this.records.length >= CONFIG.MAX_RECORDS_PER_BATCH) {
      alert(`최대 ${CONFIG.MAX_RECORDS_PER_BATCH}개까지만 추가할 수 있습니다.`);
      return;
    }

    const selectedUserValue = UIHelper.getInputValue('selectedUser');
    let wallet: WalletAdapter | null = null;
    let selectedUserIndex: number;

    if (selectedUserValue === 'custom') {
      const customPrivateKey = UIHelper.getInputValue('customPrivateKey').trim();
      if (!customPrivateKey) {
        alert('Private Key를 입력해주세요!');
        return;
      }

      selectedUserIndex = 99;
      wallet = this.customWallet;

      if (!wallet) {
        alert('유효하지 않은 Private Key입니다.');
        return;
      }
    } else {
      selectedUserIndex = parseInt(selectedUserValue);
      const currentState = this.state.getState();
      const userWallets = currentState.userWallets;

      wallet = selectedUserIndex === 0 ? (userWallets[0] ?? null) : (userWallets[1] ?? null);

      if (!wallet) {
        alert('먼저 Step 1에서 지갑을 초기화해주세요!');
        return;
      }
    }

    const userNonceValue = UIHelper.getInputValue('userNonce').trim();
    if (!userNonceValue || !/^\d+$/.test(userNonceValue)) {
      alert('User Nonce를 입력하거나 생성 버튼을 눌러주세요!');
      return;
    }

    if (selectedUserIndex === 0) this.user1Nonce = userNonceValue;
    else if (selectedUserIndex === 1) this.user2Nonce = userNonceValue;
    else this.customNonce = userNonceValue;

    const votingIdValue = UIHelper.getInputValue('votingId');
    if (!votingIdValue || !/^\d+$/.test(votingIdValue.trim())) {
      alert('먼저 자동 생성 버튼을 눌러 Voting ID를 생성해주세요!');
      return;
    }

    const parsedVotingId = votingIdValue.trim();

    const existing = this.records.find((r) => r.userIndex === selectedUserIndex);
    if (existing && existing.votingId !== parsedVotingId) {
      alert(
        `같은 유저의 레코드는 모두 같은 votingId여야 합니다.\n` +
        `기존 votingId: ${existing.votingId}\n` +
        `입력 votingId: ${parsedVotingId}\n\n` +
        `기존 votingId로 자동 맞춥니다.`
      );
      UIHelper.setInputValue('votingId', existing.votingId);
    }

    const timestampInput = UIHelper.getInputValue('recordTimestamp').trim();
    const timestamp = timestampInput || Date.now().toString();

    const voteTypeValue = parseInt(UIHelper.getInputValue('voteType'));
    const voteType: VoteType = (voteTypeValue === 0 || voteTypeValue === 1) ? voteTypeValue : 1;

    const record: UIVoteRecord = {
      userIndex: selectedUserIndex,
      userAddress: wallet.address,
      timestamp: timestamp,
      missionId: UIHelper.getInputValue('missionId'),
      votingId: existing ? existing.votingId : parsedVotingId,
      optionId: UIHelper.getInputValue('optionId'),
      voteType: voteType,
      userId: UIHelper.getInputValue('userId'),
      votingAmt: UIHelper.getInputValue('votingAmt'),
    };

    this.records.push(record);
    this.updateState();
    this.updateUI();
  }

  deleteRecord(index: number): void {
    if (index < 0 || index >= this.records.length) {
      alert('잘못된 레코드 인덱스입니다.');
      return;
    }

    const record = this.records[index];
    const userName = record.userIndex === 0 ? 'User 1' : (record.userIndex === 1 ? 'User 2' : 'Custom');

    if (confirm(`${userName}의 레코드를 삭제하시겠습니까?`)) {
      this.records.splice(index, 1);
      this.updateState();
      this.updateUI();
    }
  }

  private updateState(): void {
    const voteRecords: VoteRecord[] = this.records.map((r, idx) => {
      const data: VoteRecordData = {
        recordId: BigInt(idx),
        timestamp: BigInt(r.timestamp),
        missionId: BigInt(r.missionId),
        votingId: BigInt(r.votingId),
        optionId: BigInt(r.optionId),
        voteType: r.voteType,
        userId: r.userId,
        votingAmt: BigInt(r.votingAmt),
      };
      return new VoteRecord(data);
    });

    this.state.setState({ records: voteRecords });
  }

  private updateUI(): void {
    updateRecordListsUI(this.records, 'window.step2?.deleteRecord');
  }

  getUserNonces(): { user1: string; user2: string; custom: string } {
    return {
      user1: this.user1Nonce,
      user2: this.user2Nonce,
      custom: this.customNonce,
    };
  }

  getCustomWallet(): WalletAdapter | null {
    return this.customWallet;
  }
}

declare global {
  interface Window {
    step2?: Step2Records;
  }
}
