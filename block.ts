import { IBlock } from './types';
import { CryptoUtils } from './utils';

export class Block implements IBlock {
  public index: number;
  public timestamp: number;
  public data: string;
  public previousHash: string;
  public hash: string;
  public nonce: number;

  constructor(index: number, data: string, previousHash: string) {
    this.index = index;
    this.timestamp = Date.now();
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  /**
   * Calculate hash based on block properties
   */
  calculateHash(): string {
    return CryptoUtils.calculateHash(
      this.index +
      this.previousHash +
      this.timestamp +
      this.data +
      this.nonce
    );
  }

  /**
   * Mine block with proof of work
   */
  mineBlock(difficulty: number): void {
    const target = CryptoUtils.getDifficultyTarget(difficulty);
    
    console.log(`⛏️  Mining block ${this.index}...`);
    const startTime = Date.now();

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    const endTime = Date.now();
    console.log(`✅ Block ${this.index} mined in ${endTime - startTime}ms`);
    console.log(`   Hash: ${this.hash}`);
    console.log(`   Nonce: ${this.nonce.toLocaleString()}`);
  }
}
