import { Blockchain } from './blockchain';
import { Transaction } from './transaction';
import { Block } from './block';

function main() {
  console.log('🚀 Creating NoobCoin Blockchain...\n');

  // Create blockchain
  const noobCoin = new Blockchain();

  // Create some addresses (wallets)
  const alice = 'alice-wallet-address';
  const bob = 'bob-wallet-address';
  const charlie = 'charlie-wallet-address';

  console.log('👥 Creating transactions...\n');

  // Mine first block with initial transactions
  noobCoin.createTransaction(new Transaction(null, alice, 50)); // Genesis coins to Alice
  noobCoin.createTransaction(new Transaction(null, bob, 30));   // Genesis coins to Bob
  noobCoin.minePendingTransactions(alice); // Alice mines the block

  // Create more transactions
  noobCoin.createTransaction(new Transaction(alice, bob, 10));
  noobCoin.createTransaction(new Transaction(bob, charlie, 5));
  noobCoin.minePendingTransactions(bob); // Bob mines the block

  // Try invalid transaction (should fail)
  try {
    noobCoin.createTransaction(new Transaction(charlie, alice, 100)); // Charlie doesn't have enough
    noobCoin.minePendingTransactions(charlie);
  } catch (error) {
    console.log(`❌ Transaction failed: ${(error as Error).message}\n`);  
}

  // Valid transaction
  noobCoin.createTransaction(new Transaction(alice, charlie, 15));
  noobCoin.minePendingTransactions(charlie); // Charlie mines the block

  // Display results
  noobCoin.displayChain();
  
  console.log('\n📊 BLOCKCHAIN STATS:');
  console.log(noobCoin.getStats());

  console.log('\n🔍 Validating blockchain...');
  noobCoin.isChainValid();

  // Test tampering
  console.log('\n🔓 Testing blockchain security...');
  console.log('Attempting to tamper with block data...');
  
  if (noobCoin.chain.length > 1) {
    noobCoin.chain[1].transactions[0].amount = 1000; // Tamper with transaction
    console.log('Data tampering detected:');
    noobCoin.isChainValid();
  }
}

// Run the blockchain
main();

export { Blockchain, Transaction, Block };