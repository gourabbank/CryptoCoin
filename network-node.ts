// network-node.ts - P2P Network Node
import { EventEmitter } from 'events';
import { Blockchain } from './blockchain';
import { Transaction } from './transaction';

interface IPeerMessage {
  type: 'blockchain_request' | 'blockchain_response' | 'new_transaction' | 'new_block' | 'peer_discovery';
  data: any;
  sender: string;
  timestamp: number;
}

interface IPeer {
  id: string;
  address: string;
  port: number;
  isConnected: boolean;
  lastSeen: number;
}

export class NetworkNode extends EventEmitter {
  public nodeId: string;
  public blockchain: Blockchain;
  public peers: Map<string, IPeer>;
  public address: string;
  public port: number;
  private messageQueue: IPeerMessage[];
  private isNetworkActive: boolean;

  constructor(address: string, port: number) {
    super();
    this.nodeId = this.generateNodeId();
    this.blockchain = new Blockchain();
    this.peers = new Map();
    this.address = address;
    this.port = port;
    this.messageQueue = [];
    this.isNetworkActive = false;
  }

  private generateNodeId(): string {
    return `node-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start network services
  startNetwork(): void {
    this.isNetworkActive = true;
    console.log(`🌐 Node ${this.nodeId} started on ${this.address}:${this.port}`);
    
    // Simulate network discovery
    this.startPeerDiscovery();
    
    // Start processing message queue
    this.processMessageQueue();
  }

  // Stop network services
  stopNetwork(): void {
    this.isNetworkActive = false;
    console.log(`🔌 Node ${this.nodeId} network stopped`);
  }

  // Connect to a peer
  connectToPeer(peerAddress: string, peerPort: number): boolean {
    const peerId = `${peerAddress}:${peerPort}`;
    
    if (this.peers.has(peerId)) {
      console.log(`⚠️  Already connected to peer ${peerId}`);
      return false;
    }

    const peer: IPeer = {
      id: peerId,
      address: peerAddress,
      port: peerPort,
      isConnected: true,
      lastSeen: Date.now()
    };

    this.peers.set(peerId, peer);
    console.log(`🤝 Connected to peer ${peerId}`);

    // Request blockchain from new peer
    this.requestBlockchain(peerId);
    
    // Send peer discovery to share network
    this.broadcastMessage({
      type: 'peer_discovery',
      data: { nodeId: this.nodeId, address: this.address, port: this.port },
      sender: this.nodeId,
      timestamp: Date.now()
    });

    return true;
  }

  // Disconnect from a peer
  disconnectFromPeer(peerId: string): void {
    if (this.peers.has(peerId)) {
      this.peers.delete(peerId);
      console.log(`👋 Disconnected from peer ${peerId}`);
    }
  }

  // Broadcast message to all connected peers
  private broadcastMessage(message: IPeerMessage): void {
    if (!this.isNetworkActive) return;

    this.peers.forEach((peer, peerId) => {
      if (peer.isConnected) {
        this.sendMessageToPeer(peerId, message);
      }
    });
  }

  // Send message to specific peer
  private sendMessageToPeer(peerId: string, message: IPeerMessage): void {
    // Simulate network latency
    setTimeout(() => {
      console.log(`📡 Sending ${message.type} to ${peerId}`);
      // In real implementation, this would use actual networking (WebSockets, HTTP, etc.)
      this.simulateMessageDelivery(peerId, message);
    }, Math.random() * 100 + 50); // 50-150ms latency
  }

  // Simulate message delivery (in real app, this would be network receive)
  private simulateMessageDelivery(fromPeerId: string, message: IPeerMessage): void {
    // Find the target node and deliver message
    // In this simulation, we'll add to message queue
    this.messageQueue.push(message);
  }

  // Process incoming messages
  private processMessageQueue(): void {
    if (!this.isNetworkActive) return;

    setInterval(() => {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!;
        this.handleIncomingMessage(message);
      }
    }, 100);
  }

  // Handle different types of messages
  private handleIncomingMessage(message: IPeerMessage): void {
    console.log(`📨 Node ${this.nodeId} received ${message.type} from ${message.sender}`);

    switch (message.type) {
      case 'blockchain_request':
        this.handleBlockchainRequest(message);
        break;
      
      case 'blockchain_response':
        this.handleBlockchainResponse(message);
        break;
      
      case 'new_transaction':
        this.handleNewTransaction(message);
        break;
      
      case 'new_block':
        this.handleNewBlock(message);
        break;
      
      case 'peer_discovery':
        this.handlePeerDiscovery(message);
        break;
    }
  }

  // Request blockchain from peer
  private requestBlockchain(peerId: string): void {
    const message: IPeerMessage = {
      type: 'blockchain_request',
      data: { requestedBy: this.nodeId },
      sender: this.nodeId,
      timestamp: Date.now()
    };
    
    this.sendMessageToPeer(peerId, message);
  }

  // Handle blockchain request
  private handleBlockchainRequest(message: IPeerMessage): void {
    const response: IPeerMessage = {
      type: 'blockchain_response',
      data: { 
        blockchain: this.blockchain.chain,
        chainLength: this.blockchain.chain.length
      },
      sender: this.nodeId,
      timestamp: Date.now()
    };

    // Send back to requester
    this.sendMessageToPeer(message.sender, response);
  }

  // Handle blockchain response
  private handleBlockchainResponse(message: IPeerMessage): void {
    const receivedChain = message.data.blockchain;
    const receivedLength = message.data.chainLength;

    console.log(`📚 Received blockchain with ${receivedLength} blocks from ${message.sender}`);
    
    // Replace chain if received chain is longer and valid
    if (receivedLength > this.blockchain.chain.length) {
      // In real implementation, would validate the entire chain
      console.log(`🔄 Updating blockchain from ${this.blockchain.chain.length} to ${receivedLength} blocks`);
      // this.blockchain.chain = receivedChain; // Simplified
      console.log(`✅ Blockchain synchronized with network`);
    } else {
      console.log(`📊 Local blockchain is up to date`);
    }
  }

  // Handle new transaction
  private handleNewTransaction(message: IPeerMessage): void {
    const txData = message.data;
    try {
      const transaction = new Transaction(txData.fromAddress, txData.toAddress, txData.amount);
      this.blockchain.createTransaction(transaction);
      console.log(`✅ Added transaction from network to pending pool`);
    } catch (error) {
      console.log(`❌ Invalid transaction from network: ${error}`);
    }
  }

  // Handle new block
  private handleNewBlock(message: IPeerMessage): void {
    const blockData = message.data;
    console.log(`🆕 Received new block #${blockData.index} from ${message.sender}`);
    
    // In real implementation, would validate and add block
    console.log(`✅ Block validated and added to chain`);
  }

  // Handle peer discovery
  private handlePeerDiscovery(message: IPeerMessage): void {
    const peerData = message.data;
    const peerId = `${peerData.address}:${peerData.port}`;
    
    if (!this.peers.has(peerId) && peerData.nodeId !== this.nodeId) {
      this.connectToPeer(peerData.address, peerData.port);
    }
  }

  // Create and broadcast transaction
  createAndBroadcastTransaction(fromAddress: string | null, toAddress: string, amount: number): void {
    try {
      const transaction = new Transaction(fromAddress, toAddress, amount);
      this.blockchain.createTransaction(transaction);

      // Broadcast to network
      const message: IPeerMessage = {
        type: 'new_transaction',
        data: {
          id: transaction.id,
          fromAddress: transaction.fromAddress,
          toAddress: transaction.toAddress,
          amount: transaction.amount,
          timestamp: transaction.timestamp
        },
        sender: this.nodeId,
        timestamp: Date.now()
      };

      this.broadcastMessage(message);
      console.log(`📡 Transaction broadcasted to ${this.peers.size} peers`);
    } catch (error) {
      console.log(`❌ Failed to create transaction: ${error}`);
    }
  }

  // Mine and broadcast block
  mineAndBroadcastBlock(miningRewardAddress: string): void {
    console.log(`⛏️  Node ${this.nodeId} started mining...`);
    
    this.blockchain.minePendingTransactions(miningRewardAddress);
    const newBlock = this.blockchain.getLatestBlock();

    // Broadcast new block
    const message: IPeerMessage = {
      type: 'new_block',
      data: {
        index: newBlock.index,
        hash: newBlock.hash,
        previousHash: newBlock.previousHash,
        transactions: newBlock.transactions,
        timestamp: newBlock.timestamp,
        nonce: newBlock.nonce
      },
      sender: this.nodeId,
      timestamp: Date.now()
    };

    this.broadcastMessage(message);
    console.log(`📡 New block broadcasted to ${this.peers.size} peers`);
  }

  // Start peer discovery process
  private startPeerDiscovery(): void {
    // Simulate periodic peer discovery
    setInterval(() => {
      if (this.isNetworkActive && this.peers.size < 5) { // Max 5 peers
        console.log(`🔍 Node ${this.nodeId} searching for peers...`);
      }
    }, 10000); // Every 10 seconds
  }

  // Get network status
  getNetworkStatus() {
    return {
      nodeId: this.nodeId,
      address: `${this.address}:${this.port}`,
      isActive: this.isNetworkActive,
      connectedPeers: this.peers.size,
      blockchainLength: this.blockchain.chain.length,
      pendingTransactions: this.blockchain.pendingTransactions.length,
      peers: Array.from(this.peers.values())
    };
  }

  // Display network information
  displayNetworkInfo(): void {
    console.log(`\n🌐 NETWORK NODE STATUS:`);
    console.log(`   Node ID: ${this.nodeId}`);
    console.log(`   Address: ${this.address}:${this.port}`);
    console.log(`   Status: ${this.isNetworkActive ? '🟢 Active' : '🔴 Inactive'}`);
    console.log(`   Connected Peers: ${this.peers.size}`);
    console.log(`   Blockchain Height: ${this.blockchain.chain.length}`);
    console.log(`   Pending Transactions: ${this.blockchain.pendingTransactions.length}`);
    
    if (this.peers.size > 0) {
      console.log(`\n🤝 CONNECTED PEERS:`);
      this.peers.forEach((peer, peerId) => {
        console.log(`   ${peerId} - ${peer.isConnected ? '🟢' : '🔴'}`);
      });
    }
  }
}

