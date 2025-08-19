import * as crypto from 'crypto';

export class CryptoUtils {
  static calculateHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  static getDifficultyTarget(difficulty: number): string {
    return '0'.repeat(difficulty);
  }

  static calculateMerkleRoot(transactionIds: string[]): string {
    if (transactionIds.length === 0) {
      return this.calculateHash('');
    }

    if (transactionIds.length === 1) {
      return transactionIds[0];
    }

    let currentLevel = [...transactionIds];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        const combined = this.calculateHash(left + right);
        nextLevel.push(combined);
      }

      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  static generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}