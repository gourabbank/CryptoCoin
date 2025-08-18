import { ITransaction } from './types';
import { CryptoUtils } from './utils';

export class Transaction implements ITransaction {
  public id: string;
  public fromAddress: string | null;
  public toAddress: string;
  public amount: number;
  public timestamp: number;
  public signature?: string;

  constructor(fromAddress: string | null, toAddress: string, amount: number) {
    this.id = CryptoUtils.generateId();
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
  }

  /**
   * Calculate hash of transaction for signing
   */
  calculateHash(): string {
    return CryptoUtils.calculateHash(
      (this.fromAddress || '') + this.toAddress + this.amount + this.timestamp
    );
  }

  /**
   * Check if transaction is valid
   */
  isValid(): boolean {
    // Genesis transaction (mining reward) doesn't need fromAddress
    if (this.fromAddress === null) return true;

    // Check if amount is positive
    if (this.amount <= 0) {
      console.log('❌ Transaction amount must be positive');
      return false;
    }

    // Check if addresses are valid (basic check)
    if (!this.fromAddress || !this.toAddress) {
      console.log('❌ Transaction must include from and to address');
      return false;
    }

    if (this.fromAddress === this.toAddress) {
      console.log('❌ Cannot send to yourself');
      return false;
    }

    return true;
  }
}
