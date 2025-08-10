# Base DeFi Aggregator Integration Guide

## Overview

This guide provides comprehensive instructions for integrating with the Base DeFi Aggregator protocol. The aggregator enables developers to access optimal rates across multiple DeFi protocols on the Base network through a single, unified interface.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Protocol Architecture](#protocol-architecture)
3. [Smart Contract Integration](#smart-contract-integration)
4. [Frontend Integration](#frontend-integration)
5. [API Reference](#api-reference)
6. [Security Considerations](#security-considerations)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Support](#support)

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Hardhat development environment
- Base network RPC endpoint
- Wallet with Base ETH for gas fees

### Installation

```bash
npm install @wearedood/base-defi-aggregator
# or
yarn add @wearedood/base-defi-aggregator
```

### Basic Usage

```javascript
import { BaseDefiAggregator } from '@wearedood/base-defi-aggregator';

const aggregator = new BaseDefiAggregator({
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY
});

// Get best rate for token swap
const rate = await aggregator.getBestRate(
  '0xTokenA', // Token A address
  '0xTokenB', // Token B address
  ethers.parseEther('100') // Amount
);

// Execute swap
const tx = await aggregator.executeSwap({
  tokenA: '0xTokenA',
  tokenB: '0xTokenB',
  amount: ethers.parseEther('100'),
  minOutput: ethers.parseEther('95'),
  deadline: Math.floor(Date.now() / 1000) + 3600
});
```

## Protocol Architecture

### Core Components

#### 1. ProtocolAdapter
The main contract that interfaces with multiple DeFi protocols:

- **Uniswap V3**: Concentrated liquidity AMM
- **Aave**: Lending and borrowing protocol
- **Compound**: Money market protocol
- **Curve**: Stablecoin-focused AMM
- **Balancer**: Multi-token AMM
- **SushiSwap**: Community-driven AMM

#### 2. Rate Aggregation Engine
Compares rates across protocols in real-time:

```solidity
function getBestRate(
    address tokenA,
    address tokenB,
    uint256 amount
) external view returns (
    ProtocolType bestProtocol,
    uint256 bestRate,
    uint256 gasEstimate
);
```

#### 3. Execution Layer
Handles secure token transfers and protocol interactions:

```solidity
function executeSwap(
    address tokenA,
    address tokenB,
    uint256 amount,
    uint256 minOutput,
    uint256 deadline
) external nonReentrant whenNotPaused returns (uint256 outputAmount);
```

### Protocol Flow

1. **Rate Query**: User requests best rate for token pair
2. **Protocol Comparison**: System queries all active protocols
3. **Best Rate Selection**: Optimal protocol identified
4. **Execution**: Swap executed through selected protocol
5. **Settlement**: Tokens transferred to user

## Smart Contract Integration

### Direct Contract Interaction

```solidity
pragma solidity ^0.8.19;

import "@wearedood/base-defi-aggregator/contracts/interfaces/IProtocolAdapter.sol";

contract MyDeFiApp {
    IProtocolAdapter public immutable aggregator;
    
    constructor(address _aggregator) {
        aggregator = IProtocolAdapter(_aggregator);
    }
    
    function swapTokens(
        address tokenA,
        address tokenB,
        uint256 amount,
        uint256 minOutput
    ) external {
        // Approve tokens
        IERC20(tokenA).approve(address(aggregator), amount);
        
        // Execute swap
        uint256 output = aggregator.executeSwap(
            tokenA,
            tokenB,
            amount,
            minOutput,
            block.timestamp + 300
        );
        
        // Handle output tokens
        IERC20(tokenB).transfer(msg.sender, output);
    }
}
```

### Event Monitoring

```javascript
const contract = new ethers.Contract(address, abi, provider);

// Listen for swap events
contract.on('SwapExecuted', (user, tokenIn, tokenOut, amountIn, amountOut) => {
  console.log(`Swap: ${amountIn} ${tokenIn} -> ${amountOut} ${tokenOut}`);
});

// Listen for protocol configuration changes
contract.on('ProtocolConfigured', (protocol, protocolAddress) => {
  console.log(`Protocol ${protocol} configured: ${protocolAddress}`);
});
```

## Frontend Integration

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { useContract, useProvider } from 'wagmi';

export function useAggregator() {
  const provider = useProvider();
  const contract = useContract({
    address: AGGREGATOR_ADDRESS,
    abi: AGGREGATOR_ABI,
    signerOrProvider: provider
  });

  const [rates, setRates] = useState<RateInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const getBestRate = async (tokenA: string, tokenB: string, amount: string) => {
    setLoading(true);
    try {
      const result = await contract.getBestRate(tokenA, tokenB, amount);
      return {
        protocol: result.bestProtocol,
        rate: result.bestRate,
        gasEstimate: result.gasEstimate
      };
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async (params: SwapParams) => {
    const tx = await contract.executeSwap(
      params.tokenA,
      params.tokenB,
      params.amount,
      params.minOutput,
      params.deadline
    );
    return tx.wait();
  };

  return { getBestRate, executeSwap, loading };
}
```

### Vue.js Integration

```vue
<template>
  <div class="aggregator-widget">
    <div class="token-input">
      <input v-model="amount" placeholder="Amount" />
      <select v-model="tokenA">
        <option v-for="token in tokens" :key="token.address" :value="token.address">
          {{ token.symbol }}
        </option>
      </select>
    </div>
    
    <div class="swap-arrow"># Base DeFi Aggregator Integration Guide

## Overview

This guide provides comprehensive instructions for integrating with the Base DeFi Aggregator protocol. The aggregator enables developers to access optimal rates across multiple DeFi protocols on the Base network through a single, unified interface.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Protocol Architecture](#protocol-architecture)
3. [Smart Contract Integration](#smart-contract-integration)
4. [Frontend Integration](#frontend-integration)
5. [API Reference](#api-reference)
6. [Security Considerations](#security-considerations)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Support](#support)

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Hardhat development environment
- Base network RPC endpoint
- Wallet with Base ETH for gas fees

### Installation

```bash
npm install @wearedood/base-defi-aggregator
# or
yarn add @wearedood/base-defi-aggregator
```

### Basic Usage

```javascript
import { BaseDefiAggregator } from '@wearedood/base-defi-aggregator';

const aggregator = new BaseDefiAggregator({
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.PRIVATE_KEY
});

// Get best rate for token swap
const rate = await aggregator.getBestRate(
  '0xTokenA', // Token A address
  '0xTokenB', // Token B address
  ethers.parseEther('100') // Amount
);

// Execute swap
const tx = await aggregator.executeSwap({
  tokenA: '0xTokenA',
  tokenB: '0xTokenB',
  amount: ethers.parseEther('100'),
  minOutput: ethers.parseEther('95'),
  deadline: Math.floor(Date.now() / 1000) + 3600
});
```

## Protocol Architecture

### Core Components

#### 1. ProtocolAdapter
The main contract that interfaces with multiple DeFi protocols:

- **Uniswap V3**: Concentrated liquidity AMM
- **Aave**: Lending and borrowing protocol
- **Compound**: Money market protocol
- **Curve**: Stablecoin-focused AMM
- **Balancer**: Multi-token AMM
- **SushiSwap**: Community-driven AMM

#### 2. Rate Aggregation Engine
Compares rates across protocols in real-time.

#### 3. Execution Layer
Handles secure token transfers and protocol interactions.

## Smart Contract Integration

### Direct Contract Interaction

```solidity
pragma solidity ^0.8.19;

import "@wearedood/base-defi-aggregator/contracts/interfaces/IProtocolAdapter.sol";

contract MyDeFiApp {
    IProtocolAdapter public immutable aggregator;
    
    constructor(address _aggregator) {
        aggregator = IProtocolAdapter(_aggregator);
    }
    
    function swapTokens(
        address tokenA,
        address tokenB,
        uint256 amount,
        uint256 minOutput
    ) external {
        // Approve tokens
        IERC20(tokenA).approve(address(aggregator), amount);
        
        // Execute swap
        uint256 output = aggregator.executeSwap(
            tokenA,
            tokenB,
            amount,
            minOutput,
            block.timestamp + 300
        );
        
        // Handle output tokens
        IERC20(tokenB).transfer(msg.sender, output);
    }
}
```

## Frontend Integration

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { useContract, useProvider } from 'wagmi';

export function useAggregator() {
  const provider = useProvider();
  const contract = useContract({
    address: AGGREGATOR_ADDRESS,
    abi: AGGREGATOR_ABI,
    signerOrProvider: provider
  });

  const [rates, setRates] = useState<RateInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const getBestRate = async (tokenA: string, tokenB: string, amount: string) => {
    setLoading(true);
    try {
      const result = await contract.getBestRate(tokenA, tokenB, amount);
      return {
        protocol: result.bestProtocol,
        rate: result.bestRate,
        gasEstimate: result.gasEstimate
      };
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async (params: SwapParams) => {
    const tx = await contract.executeSwap(
      params.tokenA,
      params.tokenB,
      params.amount,
      params.minOutput,
      params.deadline
    );
    return tx.wait();
  };

  return { getBestRate, executeSwap, loading };
}
```

## API Reference

### Core Functions

#### `getBestRate(tokenA, tokenB, amount)`

Returns the best available rate across all protocols.

**Parameters:**
- `tokenA` (address): Input token address
- `tokenB` (address): Output token address
- `amount` (uint256): Input amount in wei

**Returns:**
- `bestProtocol` (ProtocolType): Optimal protocol identifier
- `bestRate` (uint256): Expected output amount
- `gasEstimate` (uint256): Estimated gas cost

#### `executeSwap(tokenA, tokenB, amount, minOutput, deadline)`

Executes a token swap through the optimal protocol.

### Protocol Types

```solidity
enum ProtocolType {
    UNISWAP_V3,    // 0
    AAVE,          // 1
    COMPOUND,      // 2
    CURVE,         // 3
    BALANCER,      // 4
    SUSHISWAP,     // 5
    VELODROME,     // 6
    AERODROME      // 7
}
```

## Security Considerations

### Smart Contract Security

1. **Reentrancy Protection**: All external calls protected
2. **Access Control**: Owner-only administrative functions
3. **Pause Mechanism**: Emergency stop functionality
4. **Slippage Protection**: Configurable maximum slippage
5. **Deadline Enforcement**: Transaction expiration checks

### Frontend Security

1. **Input Validation**: Sanitize all user inputs
2. **Rate Verification**: Confirm rates before execution
3. **Transaction Monitoring**: Track transaction status
4. **Error Handling**: Graceful failure management

## Testing

### Unit Tests

```javascript
describe('ProtocolAdapter Integration', () => {
  it('should return best rate across protocols', async () => {
    const rate = await aggregator.getBestRate(tokenA, tokenB, amount);
    expect(rate.bestRate).to.be.gt(0);
    expect(rate.gasEstimate).to.be.gt(0);
  });

  it('should execute swap successfully', async () => {
    const initialBalance = await tokenB.balanceOf(user.address);
    await aggregator.executeSwap(tokenA, tokenB, amount, minOutput, deadline);
    const finalBalance = await tokenB.balanceOf(user.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });
});
```

## Deployment

### Mainnet Deployment

```bash
# Deploy to Base mainnet
npx hardhat deploy --network base

# Verify contracts
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

## Troubleshooting

### Common Issues

#### 1. Transaction Reverts

**Problem**: Swap transactions failing
**Solutions**:
- Check token approvals
- Verify slippage tolerance
- Ensure sufficient gas limit
- Confirm deadline is future timestamp

#### 2. Rate Discrepancies

**Problem**: Frontend rates differ from contract rates
**Solutions**:
- Implement rate caching with TTL
- Add rate staleness checks
- Use consistent block numbers

## Support

### Documentation
- [API Documentation](./API.md)
- [Smart Contract Reference](./contracts/)
- [Example Applications](./examples/)

### Community
- [Discord](https://discord.gg/wearedood)
- [Telegram](https://t.me/wearedood)
- [GitHub Issues](https://github.com/wearedood/base-defi-aggregator/issues)

### Professional Support
- Email: support@wearedood.com
- Enterprise: enterprise@wearedood.com

---

*This integration guide is maintained by the WeAreDood team. For the latest updates, please refer to our [GitHub repository](https://github.com/wearedood/base-defi-aggregator).*
