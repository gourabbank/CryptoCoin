export interface IBlock {
  index: number;
  timestamp: number;
  data: string;
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface ITransaction {
  id: string;
  fromAddress: string | null;
  toAddress: string;
  amount: number;
  timestamp: number;
  signature?: string;
}

export interface IBlockWithTransactions {
  index: number;
  timestamp: number;
  transactions: ITransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
}