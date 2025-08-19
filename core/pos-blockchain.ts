// pos-blockchain.ts - Complete Proof of Stake Implementation
import { createHash, randomBytes } from 'crypto';

// Interfaces
interface ITransaction {
  id: string;
  fromAddress: string | null;
  toAddress: string;
  amount: number;
  timestamp: number;
}

interface IValidator {
  address: string;
  stake: number;
  isActive: boolean;
  joinedAt: number;
}

// Utility functions
class CryptoUtils {
  static calculateHash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  static generateId(): string {
    return randomBytes(16).toString('hex');
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
}

// Transaction class
class Transaction implements ITransaction {
  public id: string;
  public fromAddress: string | null;
  public toAddress: string;
  public amount: number;
  public timestamp: number;

  constructor(fromAddress: string | null, toAddress: string, amount: number) {
    this.id = CryptoUtils.generateId();
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
  }

  isValid(): boolean {
    if (this.fromAddress === null) return true;

    if (this.amount <= 0) {
      console.log('❌ Transaction amount must be positive');
      return false;
    }

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

// PoS Block class
class PosBlock {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public hash: string;
  public validator: string;
  public validatorBalance: number;
  public merkleRoot: string;

  constructor(
    index: number,
    transactions: Transaction[],
    previousHash: string,
    validator: string,
    validatorBalance: number
  ) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.validator = validator;
    this.validatorBalance = validatorBalance;
    this.merkleRoot = this.calculateMerkleRoot();
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return CryptoUtils.calculateHash(
      this.index +
      this.previousHash +
      this.timestamp +
      this.merkleRoot +
      this.validator +
      this.validatorBalance
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

// Proof of Stake Blockchain
export class ProofOfStakeBlockchain {
  public chain: PosBlock[];
  public pendingTransactions: Transaction[];
  public validators: Map<string, IValidator>;
  public balances: Map<string, number>;
  public minimumStake: number;
  public blockReward: number;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.validators = new Map();
    this.balances = new Map();
    this.minimumStake = 32;
    this.blockReward = 5;
  }

  createGenesisBlock(): PosBlock {
    const genesisTransaction = new Transaction(null, 'genesis', 0);
    return new PosBlock(0, [genesisTransaction], '0', 'genesis', 0);
  }

  getLatestBlock(): PosBlock {
    return this.chain[this.chain.length - 1];
  }

  // Stake tokens to become a validator
  stakeTokens(address: string, amount: number): boolean {
    const balance = this.getBalance(address);
    
    if (balance < amount) {
      console.log(`❌ ${address} doesn't have enough tokens to stake`);
      return false;
    }

    if (amount < this.minimumStake) {
      console.log(`❌ Minimum stake required: ${this.minimumStake} tokens`);
      return false;
    }

    // Deduct from balance
    this.balances.set(address, balance - amount);

    // Add or update validator
    const existingValidator = this.validators.get(address);
    if (existingValidator) {
      existingValidator.stake += amount;
    } else {
      this.validators.set(address, {
        address,
        stake: amount,
        isActive: true,
        joinedAt: Date.now()
      });
    }

    console.log(`✅ ${address} staked ${amount} tokens. Total stake: ${this.validators.get(address)?.stake}`);
    return true;
  }

  // Unstake tokens
  unstakeTokens(address: string, amount: number): boolean {
    const validator = this.validators.get(address);
    
    if (!validator) {
      console.log(`❌ ${address} is not a validator`);
      return false;
    }

    if (validator.stake < amount) {
      console.log(`❌ ${address} doesn't have enough staked tokens`);
      return false;
    }

    validator.stake -= amount;
    
    if (validator.stake < this.minimumStake) {
      this.validators.delete(address);
      console.log(`🚫 ${address} removed from validators (below minimum stake)`);
    }

    const currentBalance = this.getBalance(address);
    this.balances.set(address, currentBalance + amount);

    console.log(`✅ ${address} unstaked ${amount} tokens`);
    return true;
  }

  // Select validator using weighted random selection
  selectValidator(): string | null {
    const activeValidators = Array.from(this.validators.values()).filter(v => v.isActive);
    
    if (activeValidators.length === 0) {
      console.log('❌ No active validators available');
      return null;
    }

    const totalStake = activeValidators.reduce((sum, validator) => sum + validator.stake, 0);
    const randomTarget = Math.random() * totalStake;
    let currentSum = 0;

    for (const validator of activeValidators) {
      currentSum += validator.stake;
      if (randomTarget <= currentSum) {
        return validator.address;
      }
    }

    return activeValidators[0].address;
  }

  // Create transaction
  createTransaction(transaction: Transaction): void {
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    if (transaction.fromAddress !== null) {
      const balance = this.getBalance(transaction.fromAddress);
      if (balance < transaction.amount) {
        throw new Error('Not enough balance');
      }
    }

    this.pendingTransactions.push(transaction);
    console.log(`📝 Transaction added: ${transaction.amount} from ${transaction.fromAddress} to ${transaction.toAddress}`);
  }

  // Forge new block (PoS equivalent of mining)
  forgeBlock(): boolean {
    console.log('\n🔱 Starting block forging process...');
    
    const selectedValidator = this.selectValidator();
    if (!selectedValidator) {
      console.log('❌ Cannot forge block: No validators available');
      return false;
    }

    const validator = this.validators.get(selectedValidator)!;
    
    // Add block reward transaction
    const rewardTransaction = new Transaction(null, selectedValidator, this.blockReward);
    this.pendingTransactions.push(rewardTransaction);

    // Create new block
    const block = new PosBlock(
      this.chain.length,
      this.pendingTransactions,
      this.getLatestBlock().hash,
      selectedValidator,
      validator.stake
    );

    this.chain.push(block);
    this.updateBalances(block.transactions);
    this.pendingTransactions = [];

    console.log(`✅ Block forged by validator ${selectedValidator}`);
    console.log(`   Validator stake: ${validator.stake} tokens`);
    console.log(`   Block hash: ${block.hash}`);
    console.log('💎 Block successfully added to blockchain!\n');

    return true;
  }

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

  getBalance(address: string): number {
    return this.balances.get(address) || 0;
  }

  getTotalStake(): number {
    return Array.from(this.validators.values()).reduce((sum, validator) => sum + validator.stake, 0);
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!currentBlock.hasValidTransactions()) {
        console.log('❌ Invalid transaction found in block', i);
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log('❌ Invalid hash in block', i);
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log('❌ Invalid previous hash in block', i);
        return false;
      }
    }

    console.log('✅ Proof of Stake blockchain is valid');
    return true;
  }

  displayChain(): void {
    console.log('\n📋 PROOF OF STAKE BLOCKCHAIN SUMMARY:');
    console.log('='.repeat(60));
    
    this.chain.forEach((block, index) => {
      console.log(`\nBlock #${index}:`);
      console.log(`  Hash: ${block.hash}`);
      console.log(`  Previous Hash: ${block.previousHash}`);
      console.log(`  Forged by: ${block.validator}`);
      console.log(`  Validator Stake: ${block.validatorBalance} tokens`);
      console.log(`  Timestamp: ${new Date(block.timestamp).toLocaleString()}`);
      console.log(`  Transactions: ${block.transactions.length}`);
      
      if (block.transactions.length > 0) {
        console.log(`  Transaction Details:`);
        block.transactions.forEach((tx, txIndex) => {
          console.log(`    ${txIndex + 1}. ${tx.amount} tokens from ${tx.fromAddress || 'System'} to ${tx.toAddress}`);
        });
      }
    });
    
    console.log('\n💰 CURRENT BALANCES:');
    console.log('-'.repeat(40));
    this.balances.forEach((balance, address) => {
      console.log(`  ${address}: ${balance} tokens`);
    });

    console.log('\n🔱 ACTIVE VALIDATORS:');
    console.log('-'.repeat(40));
    this.validators.forEach((validator, address) => {
      console.log(`  ${address}: ${validator.stake} tokens staked`);
    });

    console.log(`\n📊 NETWORK STATS:`);
    console.log(`  Total Validators: ${this.validators.size}`);
    console.log(`  Total Staked: ${this.getTotalStake()} tokens`);
    console.log(`  Block Reward: ${this.blockReward} tokens`);
    console.log(`  Minimum Stake: ${this.minimumStake} tokens`);
  }
}

// Demo function
function proofOfStakeDemo() {
  console.log('🔱 Creating Proof of Stake Blockchain...\n');

  const posBlockchain = new ProofOfStakeBlockchain();

  // Create addresses
  const alice = 'alice-validator';
  const bob = 'bob-validator';
  const charlie = 'charlie-user';
  const david = 'david-validator';

  // Give initial tokens for staking
  posBlockchain.balances.set(alice, 100);
  posBlockchain.balances.set(bob, 80);
  posBlockchain.balances.set(charlie, 50);
  posBlockchain.balances.set(david, 120);

  console.log('💰 Initial token distribution:');
  console.log(`  Alice: 100 tokens`);
  console.log(`  Bob: 80 tokens`);
  console.log(`  Charlie: 50 tokens`);
  console.log(`  David: 120 tokens\n`);

  // Validators stake tokens
  console.log('🔱 Validators staking tokens...');
  posBlockchain.stakeTokens(alice, 50);
  posBlockchain.stakeTokens(bob, 32);
  posBlockchain.stakeTokens(david, 80);
  
  console.log('\n🚫 Charlie tries to stake 60 tokens (but only has 50):');
  posBlockchain.stakeTokens(charlie, 60);

  // Create and forge blocks
  console.log('\n📦 Creating transactions and forging blocks...');
  
  // Block 1
  posBlockchain.createTransaction(new Transaction(alice, charlie, 10));
  posBlockchain.createTransaction(new Transaction(bob, charlie, 5));
  posBlockchain.forgeBlock();

  // Block 2
  posBlockchain.createTransaction(new Transaction(david, alice, 15));
  posBlockchain.createTransaction(new Transaction(charlie, bob, 8));
  posBlockchain.forgeBlock();

  // Block 3
  posBlockchain.createTransaction(new Transaction(alice, david, 12));
  posBlockchain.forgeBlock();

  // Charlie stakes after receiving tokens
  console.log('💰 Charlie now has enough tokens to become a validator:');
  posBlockchain.stakeTokens(charlie, 32);

  // Block 4 - Now Charlie can be selected as validator
  posBlockchain.createTransaction(new Transaction(david, bob, 20));
  posBlockchain.forgeBlock();

  // David unstakes some tokens
  console.log('\n🔓 David unstakes 30 tokens:');
  posBlockchain.unstakeTokens(david, 30);

  // Final block
  posBlockchain.createTransaction(new Transaction(bob, alice, 7));
  posBlockchain.forgeBlock();

  // Display results
  posBlockchain.displayChain();

  console.log('\n🔍 Validating Proof of Stake blockchain...');
  posBlockchain.isChainValid();

  // Show energy comparison
  console.log('\n🌱 ENVIRONMENTAL IMPACT COMPARISON:');
  console.log('='.repeat(50));
  console.log('   Proof of Work: ⚡ High energy consumption');
  console.log('     • Requires massive computational power');
  console.log('     • Mining farms consume electricity');
  console.log('     • Carbon footprint concerns');
  console.log('   Proof of Stake: 🌿 ~99% less energy consumption');
  console.log('     • No computational puzzles needed');
  console.log('     • Validators chosen by stake weight');
  console.log('     • Environmentally sustainable');
}

// Run the demo
proofOfStakeDemo();