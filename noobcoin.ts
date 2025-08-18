import { createHash, randomBytes } from 'crypto';

// Interfaces and Types
interface CoinSpecifications {
  // Basic Properties
  name: string;
  symbol: string;
  totalSupply: number;
  decimals: number;
  
  // Economic Model
  initialDistribution: {
    founders: number;
    community: number;
    development: number;
    marketing: number;
  };
  
  // Monetary Policy
  inflationRate: number;
  halvingInterval?: number;
  burningMechanism?: boolean;
  
  // Technical Specifications
  blockTime: number;
  blockReward: number;
  maxTransactionsPerBlock: number;
  transactionFee: number;
  
  // Governance
  votingMechanism: 'proof-of-stake' | 'token-weighted' | 'one-coin-one-vote';
  proposalThreshold: number;
  
  // Use Cases
  primaryPurpose: string;
  targetAudience: string;
  realWorldUtility: string[];
}

interface WalletAddress {
  address: string;
  publicKey: string;
  balance: number;
  nonce: number;
}

interface CoinTransaction {
  id: string;
  from: string | null;
  to: string;
  amount: number;
  fee: number;
  data?: string;
  timestamp: number;
  signature?: string;
  nonce: number;
}

interface CoinBlock {
  index: number;
  timestamp: number;
  transactions: CoinTransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
  difficulty: number;
  coinbaseReward: number;
  totalFees: number;
}

// NoobCoin Specifications
const YourCoinSpecs: CoinSpecifications = {
  // Basic Properties
  name: "NoobCoin",
  symbol: "NBC",
  totalSupply: 21_000_000,
  decimals: 8,
  
  // Economic Model (percentages)
  initialDistribution: {
    founders: 15,      // 15% to founding team
    community: 60,     // 60% through mining/airdrops
    development: 15,   // 15% for development fund
    marketing: 10      // 10% for marketing/partnerships
  },
  
  // Monetary Policy
  inflationRate: 2.5,
  halvingInterval: 210_000,
  burningMechanism: true,
  
  // Technical Specifications
  blockTime: 60,
  blockReward: 10,
  maxTransactionsPerBlock: 1000,
  transactionFee: 0.001,
  
  // Governance
  votingMechanism: 'token-weighted',
  proposalThreshold: 1000,
  
  // Use Cases
  primaryPurpose: "Educational blockchain and micropayments",
  targetAudience: "Developers, students, and small businesses",
  realWorldUtility: [
    "Learning blockchain development",
    "Micropayments for content",
    "Decentralized voting",
    "Smart contract interactions"
  ]
};

// Main NoobCoin Class
export class NoobCoin {
  public blockchain: CoinBlock[];
  public pendingTransactions: CoinTransaction[];
  public wallets: Map<string, WalletAddress>;
  public difficulty: number;
  public blockReward: number;
  public transactionFee: number;
  public totalSupply: number;
  public circulatingSupply: number;
  public specs: CoinSpecifications;

  constructor(specs: CoinSpecifications) {
    this.specs = specs;
    this.blockchain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.wallets = new Map();
    this.difficulty = 4;
    this.blockReward = specs.blockReward;
    this.transactionFee = specs.transactionFee;
    this.totalSupply = specs.totalSupply;
    this.circulatingSupply = 0;
    
    this.initializeDistribution();
  }

  private createGenesisBlock(): CoinBlock {
    const genesisTransaction: CoinTransaction = {
      id: 'genesis',
      from: null,
      to: 'genesis',
      amount: 0,
      fee: 0,
      timestamp: Date.now(),
      nonce: 0
    };

    return {
      index: 0,
      timestamp: Date.now(),
      transactions: [genesisTransaction],
      previousHash: '0',
      hash: this.calculateBlockHash({
        index: 0,
        timestamp: Date.now(),
        transactions: [genesisTransaction],
        previousHash: '0',
        nonce: 0,
        merkleRoot: 'genesis',
        difficulty: this.difficulty,
        coinbaseReward: 0,
        totalFees: 0
      } as CoinBlock),
      nonce: 0,
      merkleRoot: 'genesis',
      difficulty: this.difficulty,
      coinbaseReward: 0,
      totalFees: 0
    };
  }

  private initializeDistribution(): void {
    const distribution = this.specs.initialDistribution;
    
    const founderWallet = this.createWallet('founder-wallet');
    const foundersAllocation = Math.floor(this.totalSupply * distribution.founders / 100);
    this.wallets.get(founderWallet)!.balance = foundersAllocation;
    
    const devWallet = this.createWallet('development-fund');
    const devAllocation = Math.floor(this.totalSupply * distribution.development / 100);
    this.wallets.get(devWallet)!.balance = devAllocation;
    
    const marketingWallet = this.createWallet('marketing-fund');
    const marketingAllocation = Math.floor(this.totalSupply * distribution.marketing / 100);
    this.wallets.get(marketingWallet)!.balance = marketingAllocation;
    
    this.circulatingSupply = foundersAllocation + devAllocation + marketingAllocation;
    
    console.log(`🪙 ${this.specs.name} (${this.specs.symbol}) initialized!`);
    console.log(`📊 Initial Distribution:`);
    console.log(`   Founders: ${foundersAllocation.toLocaleString()} ${this.specs.symbol}`);
    console.log(`   Development: ${devAllocation.toLocaleString()} ${this.specs.symbol}`);
    console.log(`   Marketing: ${marketingAllocation.toLocaleString()} ${this.specs.symbol}`);
    console.log(`   Available for Mining: ${(this.totalSupply - this.circulatingSupply).toLocaleString()} ${this.specs.symbol}`);
  }

  createWallet(label?: string): string {
    const address = this.generateAddress();
    const wallet: WalletAddress = {
      address,
      publicKey: this.generatePublicKey(),
      balance: 0,
      nonce: 0
    };
    
    this.wallets.set(address, wallet);
    console.log(`💳 New wallet created: ${label || address}`);
    return address;
  }

  private generateAddress(): string {
    return 'NBC' + randomBytes(16).toString('hex').substring(0, 32);
  }

  private generatePublicKey(): string {
    return randomBytes(32).toString('hex');
  }

  sendCoins(from: string, to: string, amount: number, data?: string): string {
    const fromWallet = this.wallets.get(from);
    if (!fromWallet) {
      throw new Error(`Sender wallet ${from} not found`);
    }

    const totalCost = amount + this.transactionFee;
    if (fromWallet.balance < totalCost) {
      throw new Error(`Insufficient balance. Need ${totalCost} ${this.specs.symbol}, have ${fromWallet.balance}`);
    }

    const transaction: CoinTransaction = {
      id: this.generateTransactionId(),
      from,
      to,
      amount,
      fee: this.transactionFee,
      data,
      timestamp: Date.now(),
      nonce: fromWallet.nonce + 1
    };

    this.pendingTransactions.push(transaction);
    
    console.log(`💸 Transaction created: ${amount} ${this.specs.symbol} from ${from} to ${to}`);
    return transaction.id;
  }

  mineBlock(minerAddress: string): CoinBlock {
    console.log(`⛏️  Mining new block...`);
    
    const totalFees = this.pendingTransactions.reduce((sum, tx) => sum + tx.fee, 0);
    
    const coinbaseTransaction: CoinTransaction = {
      id: this.generateTransactionId(),
      from: null,
      to: minerAddress,
      amount: this.blockReward + totalFees,
      fee: 0,
      timestamp: Date.now(),
      nonce: 0
    };

    const transactions = [coinbaseTransaction, ...this.pendingTransactions];
    
    const block: CoinBlock = {
      index: this.blockchain.length,
      timestamp: Date.now(),
      transactions,
      previousHash: this.getLatestBlock().hash,
      hash: '',
      nonce: 0,
      merkleRoot: this.calculateMerkleRoot(transactions),
      difficulty: this.difficulty,
      coinbaseReward: this.blockReward,
      totalFees
    };

    block.hash = this.mineProofOfWork(block);
    
    this.blockchain.push(block);
    this.processTransactions(transactions);
    this.pendingTransactions = [];
    this.circulatingSupply += this.blockReward;
    
    console.log(`✅ Block #${block.index} mined by ${minerAddress}`);
    console.log(`   Reward: ${this.blockReward} ${this.specs.symbol}`);
    console.log(`   Fees: ${totalFees} ${this.specs.symbol}`);
    console.log(`   Hash: ${block.hash}`);
    
    return block;
  }

  private processTransactions(transactions: CoinTransaction[]): void {
    for (const tx of transactions) {
      if (tx.from) {
        const fromWallet = this.wallets.get(tx.from)!;
        fromWallet.balance -= (tx.amount + tx.fee);
        fromWallet.nonce++;
      }

      if (!this.wallets.has(tx.to)) {
        this.createWallet(tx.to);
      }
      const toWallet = this.wallets.get(tx.to)!;
      toWallet.balance += tx.amount;
    }
  }

  private mineProofOfWork(block: CoinBlock): string {
    const target = '0'.repeat(this.difficulty);
    let hash = '';
    
    const startTime = Date.now();
    while (!hash.startsWith(target)) {
      block.nonce++;
      hash = this.calculateBlockHash(block);
    }
    
    const miningTime = Date.now() - startTime;
    console.log(`   Mining time: ${miningTime}ms, Nonce: ${block.nonce.toLocaleString()}`);
    
    return hash;
  }

  private calculateBlockHash(block: CoinBlock): string {
    return createHash('sha256').update(
      block.index +
      block.previousHash +
      block.timestamp +
      block.merkleRoot +
      block.nonce +
      block.difficulty
    ).digest('hex');
  }

  private calculateMerkleRoot(transactions: CoinTransaction[]): string {
    if (transactions.length === 0) return '';
    if (transactions.length === 1) return transactions[0].id;

    const txIds = transactions.map(tx => tx.id);
    return this.getMerkleRoot(txIds);
  }

  private getMerkleRoot(hashes: string[]): string {
    if (hashes.length === 1) return hashes[0];
    
    const newLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      const combined = createHash('sha256').update(left + right).digest('hex');
      newLevel.push(combined);
    }
    
    return this.getMerkleRoot(newLevel);
  }

  private generateTransactionId(): string {
    return createHash('sha256').update(
      Date.now() + Math.random().toString()
    ).digest('hex');
  }

  private getLatestBlock(): CoinBlock {
    return this.blockchain[this.blockchain.length - 1];
  }

  getBalance(address: string): number {
    const wallet = this.wallets.get(address);
    return wallet ? wallet.balance : 0;
  }

  getCoinStats() {
    return {
      name: this.specs.name,
      symbol: this.specs.symbol,
      totalSupply: this.totalSupply.toLocaleString(),
      circulatingSupply: this.circulatingSupply.toLocaleString(),
      remainingToMine: (this.totalSupply - this.circulatingSupply).toLocaleString(),
      totalBlocks: this.blockchain.length,
      difficulty: this.difficulty,
      blockReward: this.blockReward,
      transactionFee: this.transactionFee,
      totalWallets: this.wallets.size,
      marketCap: `${(this.circulatingSupply * 1).toLocaleString()} USD (at $1 per ${this.specs.symbol})`
    };
  }

  displayCoinInfo(): void {
    const stats = this.getCoinStats();
    
    console.log('\n🪙 CRYPTOCURRENCY INFORMATION:');
    console.log('='.repeat(50));
    console.log(`Name: ${stats.name}`);
    console.log(`Symbol: ${stats.symbol}`);
    console.log(`Total Supply: ${stats.totalSupply} ${this.specs.symbol}`);
    console.log(`Circulating Supply: ${stats.circulatingSupply} ${this.specs.symbol}`);
    console.log(`Remaining to Mine: ${stats.remainingToMine} ${this.specs.symbol}`);
    console.log(`Total Blocks: ${stats.totalBlocks}`);
    console.log(`Mining Difficulty: ${stats.difficulty}`);
    console.log(`Block Reward: ${stats.blockReward} ${this.specs.symbol}`);
    console.log(`Transaction Fee: ${stats.transactionFee} ${this.specs.symbol}`);
    console.log(`Total Wallets: ${stats.totalWallets}`);
    console.log(`Estimated Market Cap: ${stats.marketCap}`);

    console.log('\n💰 WALLET BALANCES:');
    console.log('-'.repeat(40));
    this.wallets.forEach((wallet, address) => {
      if (wallet.balance > 0) {
        const shortAddress = address.length > 20 ? 
          address.substring(0, 10) + '...' + address.substring(address.length - 6) : 
          address;
        console.log(`${shortAddress}: ${wallet.balance.toLocaleString()} ${this.specs.symbol}`);
      }
    });

    console.log('\n📊 RECENT TRANSACTIONS:');
    console.log('-'.repeat(40));
    const latestBlock = this.getLatestBlock();
    latestBlock.transactions.slice(-5).forEach((tx, index) => {
      const fromDisplay = tx.from ? 
        (tx.from.length > 15 ? tx.from.substring(0, 8) + '...' : tx.from) : 
        'Mining';
      const toDisplay = tx.to.length > 15 ? tx.to.substring(0, 8) + '...' : tx.to;
      console.log(`${index + 1}. ${tx.amount} ${this.specs.symbol} from ${fromDisplay} to ${toDisplay}`);
    });
  }
}

// Demo: Create and use your cryptocurrency
function createYourCryptocurrency() {
  console.log('🚀 Creating Your Cryptocurrency...\n');

  const noobCoin = new NoobCoin(YourCoinSpecs);

  const alice = noobCoin.createWallet('Alice');
  const bob = noobCoin.createWallet('Bob');
  const charlie = noobCoin.createWallet('Charlie');
  const miner1 = noobCoin.createWallet('Miner-1');

  console.log('\n💎 Initial airdrop to users...');
  const founderWallet = Array.from(noobCoin.wallets.keys()).find(addr => 
    noobCoin.wallets.get(addr)!.balance > 1000000
  )!;
  
  noobCoin.sendCoins(founderWallet, alice, 1000, 'Airdrop to Alice');
  noobCoin.sendCoins(founderWallet, bob, 800, 'Airdrop to Bob');
  noobCoin.sendCoins(founderWallet, charlie, 600, 'Airdrop to Charlie');

  console.log('\n⛏️  Mining airdrop transactions...');
  noobCoin.mineBlock(miner1);

  console.log('\n💸 Users making transactions...');
  noobCoin.sendCoins(alice, bob, 150, 'Payment for services');
  noobCoin.sendCoins(bob, charlie, 75, 'Dinner payment');
  noobCoin.sendCoins(charlie, alice, 50, 'Gift');

  console.log('\n⛏️  Mining user transactions...');
  noobCoin.mineBlock(miner1);

  console.log('\n💸 More transactions...');
  noobCoin.sendCoins(alice, miner1, 100, 'Tip for mining');
  noobCoin.sendCoins(bob, alice, 200, 'Loan repayment');

  console.log('\n⛏️  Mining final transactions...');
  noobCoin.mineBlock(alice);

  noobCoin.displayCoinInfo();

  console.log('\n🎉 CONGRATULATIONS!');
  console.log(`You've created ${YourCoinSpecs.name} (${YourCoinSpecs.symbol})!`);
  console.log('Your cryptocurrency is now fully functional with:');
  console.log('✅ Token economics and distribution');
  console.log('✅ Mining rewards and transaction fees');
  console.log('✅ Wallet system and balance tracking');
  console.log('✅ Proof of work consensus');
  console.log('✅ Complete transaction history');
  
  console.log('\n🚀 NEXT STEPS TO LAUNCH:');
  console.log('1. 📱 Build wallet app (mobile/desktop)');
  console.log('2. 🌐 Create block explorer website');
  console.log('3. 👥 Build community (Discord/Telegram)');
  console.log('4. 🔒 Security audit & legal review');
  console.log('5. 📈 List on exchanges (DEX first)');
  console.log('6. 🎯 Develop real-world use cases');
}

// Run the cryptocurrency demo
createYourCryptocurrency();