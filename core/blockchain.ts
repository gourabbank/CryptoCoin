
// blockchain.ts
import { Block } from './block';
import { Transaction } from './transaction';
import { ITransaction, IBlockWithTransactions } from './types';
import { CryptoUtils } from './utils';

export class TransactionBlock extends Block {
  public transactions: Transaction[];
  public merkleRoot: string;

  constructor(index: number, transactions: Transaction[], previousHash: string) {
    super(index, '', previousHash); // Empty data for transaction blocks
    this.transactions = transactions;
    this.merkleRoot = this.calculateMerkleRoot();
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return CryptoUtils.calculateHash(
      this.index +
      this.previousHash +
      this.timestamp +
      this.merkleRoot +
      this.nonce
    );
  }

  calculateMerkleRoot(): string {
    const txIds = this.transactions.map(tx => tx.id);
    return CryptoUtils.calculateMerkleRoot(txIds);
  }

  hasValidTransactions(): boolean {
    return this.transactions.every(tx => tx.isValid());
  }
}

export class Blockchain {
  public chain: TransactionBlock[];
  public difficulty: number;
  public pendingTransactions: Transaction[];
  public miningReward: number;
  public balances: Map<string, number>;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3;
    this.pendingTransactions = [];
    this.miningReward = 10;
    this.balances = new Map();
  }

  /**
   * Create the first block in the chain
   */
  createGenesisBlock(): TransactionBlock {
    const genesisTransaction = new Transaction(null, 'genesis', 0);
    return new TransactionBlock(0, [genesisTransaction], '0');
  }

  /**
   * Get the latest block in the chain
   */
  getLatestBlock(): TransactionBlock {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a transaction to pending transactions
   */
  createTransaction(transaction: Transaction): void {
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    // Check if sender has enough balance (skip for mining rewards)
    if (transaction.fromAddress !== null) {
      const balance = this.getBalance(transaction.fromAddress);
      if (balance < transaction.amount) {
        throw new Error('Not enough balance');
      }
    }

    this.pendingTransactions.push(transaction);
    console.log(`📝 Transaction added to pending: ${transaction.amount} from ${transaction.fromAddress} to ${transaction.toAddress}`);
  }

  /**
   * Mine pending transactions
   */
  minePendingTransactions(miningRewardAddress: string): void {
    console.log('\n🚀 Starting mining process...');
    
    // Add mining reward transaction
    const rewardTransaction = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTransaction);

    // Create new block with pending transactions
    const block = new TransactionBlock(
      this.chain.length,
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    // Mine the block
    block.mineBlock(this.difficulty);

    // Add block to chain
    this.chain.push(block);

    // Update balances
    this.updateBalances(block.transactions);

    // Reset pending transactions
    this.pendingTransactions = [];
    
    console.log('💎 Block successfully mined and added to blockchain!\n');
  }

  /**
   * Update balance tracking
   */
  private updateBalances(transactions: Transaction[]): void {
    for (const transaction of transactions) {
      if (transaction.fromAddress) {
        const currentBalance = this.balances.get(transaction.fromAddress) || 0;
        this.balances.set(transaction.fromAddress, currentBalance - transaction.amount);
      }
      
      const receiverBalance = this.balances.get(transaction.toAddress) || 0;
      this.balances.set(transaction.toAddress, receiverBalance + transaction.amount);
    }
  }

  /**
   * Get balance for an address
   */
  getBalance(address: string): number {
    return this.balances.get(address) || 0;
  }

  /**
   * Validate the entire blockchain
   */
  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check if current block is valid
      if (!currentBlock.hasValidTransactions()) {
        console.log('❌ Invalid transaction found in block', i);
        return false;
      }

      // Check if hash is valid
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log('❌ Invalid hash in block', i);
        return false;
      }

      // Check if block points to previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log('❌ Invalid previous hash in block', i);
        return false;
      }

      // Check if block was properly mined
      const target = CryptoUtils.getDifficultyTarget(this.difficulty);
      if (currentBlock.hash.substring(0, this.difficulty) !== target) {
        console.log('❌ Block not properly mined', i);
        return false;
      }
    }

    console.log('✅ Blockchain is valid');
    return true;
  }

  /**
   * Get blockchain stats
   */
  getStats() {
    return {
      totalBlocks: this.chain.length,
      difficulty: this.difficulty,
      pendingTransactions: this.pendingTransactions.length,
      miningReward: this.miningReward,
      totalTransactions: this.chain.reduce((sum, block) => sum + block.transactions.length, 0)
    };
  }

  /**
   * Display blockchain in a readable format
   */
  displayChain(): void {
    console.log('\n📋 BLOCKCHAIN SUMMARY:');
    console.log('='.repeat(50));
    
    this.chain.forEach((block, index) => {
      console.log(`\nBlock #${index}:`);
      console.log(`  Hash: ${block.hash}`);
      console.log(`  Previous Hash: ${block.previousHash}`);
      console.log(`  Timestamp: ${new Date(block.timestamp).toLocaleString()}`);
      console.log(`  Nonce: ${block.nonce.toLocaleString()}`);
      console.log(`  Transactions: ${block.transactions.length}`);
      
      if (block.transactions.length > 0) {
        console.log(`  Transaction Details:`);
        block.transactions.forEach((tx, txIndex) => {
          console.log(`    ${txIndex + 1}. ${tx.amount} coins from ${tx.fromAddress || 'System'} to ${tx.toAddress}`);
        });
      }
    });
    
    console.log('\n💰 CURRENT BALANCES:');
    console.log('-'.repeat(30));
    this.balances.forEach((balance, address) => {
      console.log(`  ${address}: ${balance} coins`);
    });
  }
}
