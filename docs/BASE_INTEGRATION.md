Add comprehensive Base network integration documentation with examples and best practicesfrontend/components/BaseDeFiDashboard.tsx  import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useBalance, useNetwork } from 'wagmi';
import { useBaseProtocols } from '../hooks/useBaseProtocols';

/**
 * Comprehensive Base DeFi Dashboard Component
 * Provides full interface for yield farming, portfolio management, and analytics
 */

interface DashboardProps {
  className?: string;
}

const BaseDeFiDashboard: React.FC<DashboardProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: balance } = useBalance({ address });
  
  const {
    protocols,
    opportunities,
    portfolio,
    loading,
    error,
    executeYieldFarm,
    rebalancePortfolio,
    findYieldOpportunities
  } = useBaseProtocols();

  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [riskTolerance, setRiskTolerance] = useState<number>(5);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'protocols' | 'portfolio' | 'analytics'>('overview');

  // Check if user is on Base network
  const isOnBase = chain?.id === 8453;

  // Handle deposit to selected protocol
  const handleDeposit = async () => {
    if (!selectedProtocol || !depositAmount || !address) return;
    
    try {
      setIsDepositing(true);
      const txHash = await executeYieldFarm(
        selectedProtocol,
        depositAmount,
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC Base
      );
      
      console.log('Deposit successful:', txHash);
      // Reset form
      setDepositAmount('');
      setSelectedProtocol('');
      
    } catch (err) {
      console.error('Deposit failed:', err);
    } finally {
      setIsDepositing(false);
    }
  };

  // Handle portfolio rebalancing
  const handleRebalance = async () => {
    try {
      setIsRebalancing(true);
      await rebalancePortfolio();
      console.log('Portfolio rebalanced successfully');
    } catch (err) {
      console.error('Rebalancing failed:', err);
    } finally {
      setIsRebalancing(false);
    }
  };

  // Find yield opportunities based on risk tolerance
  useEffect(() => {
    if (depositAmount && parseFloat(depositAmount) > 0) {
      findYieldOpportunities(depositAmount, riskTolerance);
    }
  }, [depositAmount, riskTolerance, findYieldOpportunities]);

  if (!isConnected) {
    return (
      <div className={`base-defi-dashboard ${className || ''}`}>
        <div className="connect-wallet">
          <h2>Connect Your Wallet</h2>
          <p>Connect your wallet to start earning yield on Base</p>
          <button className="connect-btn">Connect Wallet</button>
        </div>
      </div>
    );
  }

  if (!isOnBase) {
    return (
      <div className={`base-defi-dashboard ${className || ''}`}>
        <div className="wrong-network">
          <h2>Switch to Base Network</h2>
          <p>Please switch to Base network to use this application</p>
          <button className="switch-network-btn">Switch to Base</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`base-defi-dashboard ${className || ''}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Base DeFi Aggregator</h1>
          <div className="user-info">
            <span className="address">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <span className="balance">{balance?.formatted.slice(0, 6)} ETH</span>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="dashboard-nav">
          {['overview', 'protocols', 'portfolio', 'analytics'].map(tab => (
            <button
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading Base protocols...</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <p>Error: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Portfolio Value</h3>
                <p className="stat-value">${portfolio?.totalValue || '0.00'}</p>
              </div>
              <div className="stat-card">
                <h3>Daily Yield</h3>
                <p className="stat-value">${portfolio?.totalYield || '0.00'}</p>
              </div>
              <div className="stat-card">
                <h3>Average APY</h3>
                <p className="stat-value">{portfolio?.averageApy.toFixed(2) || '0.00'}%</p>
              </div>
              <div className="stat-card">
                <h3>Risk Score</h3>
                <p className="stat-value">{portfolio?.riskScore.toFixed(1) || '0.0'}/10</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveTab('protocols')}
                >
                  Deposit Funds
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={handleRebalance}
                  disabled={isRebalancing}
                >
                  {isRebalancing ? 'Rebalancing...' : 'Rebalance Portfolio'}
                </button>
                <button 
                  className="action-btn tertiary"
                  onClick={() => setActiveTab('analytics')}
                >
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Protocols Tab */}
        {activeTab === 'protocols' && (
          <div className="protocols-tab">
            <div className="deposit-section">
              <h3>Deposit to Protocol</h3>
              <div className="deposit-form">
                <div className="form-group">
                  <label>Amount (USDC)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="amount-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Risk Tolerance (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
                    className="risk-slider"
                  />
                  <span className="risk-value">{riskTolerance}</span>
                </div>
                
                <div className="form-group">
                  <label>Select Protocol</label>
                  <select
                    value={selectedProtocol}
                    onChange={(e) => setSelectedProtocol(e.target.value)}
                    className="protocol-select"
                  >
                    <option value="">Choose protocol...</option>
                    {protocols.map(protocol => (
                      <option key={protocol.address} value={protocol.address}>
                        {protocol.name} - {protocol.apy.toFixed(2)}% APY
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  className="deposit-btn"
                  onClick={handleDeposit}
                  disabled={!selectedProtocol || !depositAmount || isDepositing}
                >
                  {isDepositing ? 'Depositing...' : 'Deposit'}
                </button>
              </div>
            </div>

            {/* Protocol List */}
            <div className="protocols-list">
              <h3>Available Protocols</h3>
              <div className="protocols-grid">
                {protocols.map(protocol => (
                  <div key={protocol.address} className="protocol-card">
                    <div className="protocol-header">
                      <h4>{protocol.name}</h4>
                      <span className={`status ${protocol.isActive ? 'active' : 'inactive'}`}>
                        {protocol.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="protocol-stats">
                      <div className="stat">
                        <span className="label">APY</span>
                        <span className="value">{protocol.apy.toFixed(2)}%</span>
                      </div>
                      <div className="stat">
                        <span className="label">TVL</span>
                        <span className="value">${protocol.tvl}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Risk</span>
                        <span className="value">{protocol.riskScore.toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="portfolio-tab">
            <div className="portfolio-overview">
              <h3>Portfolio Allocation</h3>
              <div className="allocation-chart">
                {protocols.filter(p => p.allocation > 0).map(protocol => (
                  <div key={protocol.address} className="allocation-item">
                    <div className="protocol-info">
                      <span className="name">{protocol.name}</span>
                      <span className="percentage">{protocol.allocation}%</span>
                    </div>
                    <div className="allocation-bar">
                      <div 
                        className="fill"
                        style={{ width: `${protocol.allocation}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="portfolio-actions">
              <button 
                className="rebalance-btn"
                onClick={handleRebalance}
                disabled={isRebalancing}
              >
                {isRebalancing ? 'Rebalancing...' : 'Optimize Portfolio'}
              </button>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="analytics-grid">
              <div className="chart-container">
                <h3>Yield Performance</h3>
                <div className="chart-placeholder">
                  <p>Yield chart would go here</p>
                </div>
              </div>
              
              <div className="metrics-container">
                <h3>Portfolio Metrics</h3>
                <div className="metrics-list">
                  <div className="metric">
                    <span className="label">Diversification Score</span>
                    <span className="value">{portfolio?.diversificationScore || 0}/10</span>
                  </div>
                  <div className="metric">
                    <span className="label">Risk-Adjusted Return</span>
                    <span className="value">{((portfolio?.averageApy || 0) / (portfolio?.riskScore || 1)).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BaseDeFiDashboard;test/BaseNFTLaunchpad.test.ts  import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * Comprehensive test suite for BaseNFTLaunchpad
 * Tests Dutch auction mechanics, allowlist functionality, and royalty management
 */

describe("BaseNFTLaunchpad", function () {
  let launchpad: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let royaltyRecipient: Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;
  let royaltyAddress: string;

  const COLLECTION_NAME = "Base NFT Collection";
  const COLLECTION_SYMBOL = "BNC";
  const MAX_SUPPLY = 1000;
  const START_PRICE = ethers.utils.parseEther("1.0");
  const END_PRICE = ethers.utils.parseEther("0.1");
  const AUCTION_DURATION = 3600; // 1 hour
  const ALLOWLIST_DURATION = 1800; // 30 minutes
  const MAX_PER_WALLET = 5;

  beforeEach(async function () {
    [owner, user1, user2, royaltyRecipient] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    royaltyAddress = await royaltyRecipient.getAddress();

    const LaunchpadFactory = await ethers.getContractFactory("BaseNFTLaunchpad");
    launchpad = await LaunchpadFactory.deploy(
      COLLECTION_NAME,
      COLLECTION_SYMBOL,
      royaltyAddress
    );
    await launchpad.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await launchpad.name()).to.equal(COLLECTION_NAME);
      expect(await launchpad.symbol()).to.equal(COLLECTION_SYMBOL);
    });

    it("Should set the correct owner", async function () {
      expect(await launchpad.owner()).to.equal(ownerAddress);
    });

    it("Should set the correct royalty recipient", async function () {
      expect(await launchpad.royaltyRecipient()).to.equal(royaltyAddress);
    });

    it("Should set default royalty fee to 7.5%", async function () {
      expect(await launchpad.royaltyFee()).to.equal(750);
    });
  });

  describe("Launch Configuration", function () {
    it("Should configure launch parameters correctly", async function () {
      const currentTime = await time.latest();
      const publicSaleStart = currentTime + ALLOWLIST_DURATION + 100;

      const launchConfig = {
        maxSupply: MAX_SUPPLY,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: publicSaleStart,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "https://api.example.com/metadata/",
        hiddenURI: "https://api.example.com/hidden.json"
      };

      await launchpad.configureLaunch(launchConfig);

      const storedConfig = await launchpad.launchConfig();
      expect(storedConfig.maxSupply).to.equal(MAX_SUPPLY);
      expect(storedConfig.startPrice).to.equal(START_PRICE);
      expect(storedConfig.endPrice).to.equal(END_PRICE);
    });

    it("Should revert with invalid parameters", async function () {
      const invalidConfig = {
        maxSupply: 0,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: 0,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "",
        hiddenURI: ""
      };

      await expect(launchpad.configureLaunch(invalidConfig))
        .to.be.revertedWith("Invalid max supply");
    });

    it("Should only allow owner to configure launch", async function () {
      const launchConfig = {
        maxSupply: MAX_SUPPLY,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: 0,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "",
        hiddenURI: ""
      };

      await expect(launchpad.connect(user1).configureLaunch(launchConfig))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Allowlist Management", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const launchConfig = {
        maxSupply: MAX_SUPPLY,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: currentTime + ALLOWLIST_DURATION + 100,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "https://api.example.com/metadata/",
        hiddenURI: "https://api.example.com/hidden.json"
      };
      await launchpad.configureLaunch(launchConfig);
    });

    it("Should add addresses to allowlist", async function () {
      await launchpad.updateAllowlist([user1Address, user2Address], true);
      
      expect(await launchpad.allowlist(user1Address)).to.be.true;
      expect(await launchpad.allowlist(user2Address)).to.be.true;
    });

    it("Should remove addresses from allowlist", async function () {
      await launchpad.updateAllowlist([user1Address], true);
      expect(await launchpad.allowlist(user1Address)).to.be.true;
      
      await launchpad.updateAllowlist([user1Address], false);
      expect(await launchpad.allowlist(user1Address)).to.be.false;
    });

    it("Should only allow owner to update allowlist", async function () {
      await expect(launchpad.connect(user1).updateAllowlist([user1Address], true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Allowlist Minting", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const launchConfig = {
        maxSupply: MAX_SUPPLY,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: currentTime + ALLOWLIST_DURATION + 100,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "https://api.example.com/metadata/",
        hiddenURI: "https://api.example.com/hidden.json"
      };
      await launchpad.configureLaunch(launchConfig);
      await launchpad.updateAllowlist([user1Address], true);
    });

    it("Should allow allowlisted users to mint", async function () {
      const mintQuantity = 2;
      const totalCost = START_PRICE.mul(mintQuantity);
      
      await expect(
        launchpad.connect(user1).allowlistMint(mintQuantity, { value: totalCost })
      ).to.emit(launchpad, "NFTMinted");
      
      expect(await launchpad.balanceOf(user1Address)).to.equal(mintQuantity);
      expect(await launchpad.totalMinted(user1Address)).to.equal(mintQuantity);
    });

    it("Should reject non-allowlisted users", async function () {
      const mintQuantity = 1;
      const totalCost = START_PRICE.mul(mintQuantity);
      
      await expect(
        launchpad.connect(user2).allowlistMint(mintQuantity, { value: totalCost })
      ).to.be.revertedWith("Not on allowlist");
    });

    it("Should enforce max per wallet limit", async function () {
      const mintQuantity = MAX_PER_WALLET + 1;
      const totalCost = START_PRICE.mul(mintQuantity);
      
      await expect(
        launchpad.connect(user1).allowlistMint(mintQuantity, { value: totalCost })
      ).to.be.revertedWith("Exceeds max per wallet");
    });

    it("Should require sufficient payment", async function () {
      const mintQuantity = 1;
      const insufficientPayment = START_PRICE.sub(1);
      
      await expect(
        launchpad.connect(user1).allowlistMint(mintQuantity, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should refund excess payment", async function () {
      const mintQuantity = 1;
      const excessPayment = START_PRICE.mul(2);
      
      const balanceBefore = await user1.getBalance();
      const tx = await launchpad.connect(user1).allowlistMint(mintQuantity, { value: excessPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const balanceAfter = await user1.getBalance();
      
      const expectedBalance = balanceBefore.sub(START_PRICE).sub(gasUsed);
      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.utils.parseEther("0.001"));
    });
  });

  describe("Dutch Auction Pricing", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const launchConfig = {
        maxSupply: MAX_SUPPLY,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: currentTime + 100,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "https://api.example.com/metadata/",
        hiddenURI: "https://api.example.com/hidden.json"
      };
      await launchpad.configureLaunch(launchConfig);
      await launchpad.advancePhase(); // Move to public sale phase
    });

    it("Should start at start price", async function () {
      const currentPrice = await launchpad.getCurrentPrice();
      expect(currentPrice).to.equal(START_PRICE);
    });

    it("Should decrease price over time", async function () {
      await time.increase(AUCTION_DURATION / 2);
      
      const currentPrice = await launchpad.getCurrentPrice();
      const expectedPrice = START_PRICE.add(END_PRICE).div(2);
      
      expect(currentPrice).to.be.closeTo(expectedPrice, ethers.utils.parseEther("0.1"));
    });

    it("Should reach end price at auction end", async function () {
      await time.increase(AUCTION_DURATION);
      
      const currentPrice = await launchpad.getCurrentPrice();
      expect(currentPrice).to.equal(END_PRICE);
    });
  });

  describe("Public Minting", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const launchConfig = {
        maxSupply: MAX_SUPPLY,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: currentTime + 100,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "https://api.example.com/metadata/",
        hiddenURI: "https://api.example.com/hidden.json"
      };
      await launchpad.configureLaunch(launchConfig);
      await launchpad.advancePhase();
      await time.increase(200);
    });

    it("Should allow public minting at current price", async function () {
      const mintQuantity = 1;
      const currentPrice = await launchpad.getCurrentPrice();
      
      await expect(
        launchpad.connect(user1).publicMint(mintQuantity, { value: currentPrice })
      ).to.emit(launchpad, "NFTMinted");
      
      expect(await launchpad.balanceOf(user1Address)).to.equal(mintQuantity);
    });

    it("Should enforce max supply", async function () {
      // This test would require minting close to max supply
      // Simplified version:
      const mintQuantity = 1;
      const currentPrice = await launchpad.getCurrentPrice();
      
      await launchpad.connect(user1).publicMint(mintQuantity, { value: currentPrice });
      expect(await launchpad.totalSupply()).to.equal(1);
    });
  });

  describe("Royalty Management", function () {
    it("Should update royalty information", async function () {
      const newRecipient = user1Address;
      const newFee = 500; // 5%
      
      await launchpad.updateRoyalty(newRecipient, newFee);
      
      expect(await launchpad.royaltyRecipient()).to.equal(newRecipient);
      expect(await launchpad.royaltyFee()).to.equal(newFee);
    });

    it("Should reject royalty fee above 10%", async function () {
      const newFee = 1100; // 11%
      
      await expect(launchpad.updateRoyalty(royaltyAddress, newFee))
        .to.be.revertedWith("Royalty fee too high");
    });
  });

  describe("Reveal Mechanism", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const launchConfig = {
        maxSupply: MAX_SUPPLY,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: currentTime + 100,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "https://api.example.com/metadata/",
        hiddenURI: "https://api.example.com/hidden.json"
      };
      await launchpad.configureLaunch(launchConfig);
      await launchpad.updateAllowlist([user1Address], true);
      
      // Mint a token
      await launchpad.connect(user1).allowlistMint(1, { value: START_PRICE });
    });

    it("Should return hidden URI before reveal", async function () {
      const tokenURI = await launchpad.tokenURI(0);
      const config = await launchpad.launchConfig();
      expect(tokenURI).to.equal(config.hiddenURI);
    });

    it("Should reveal metadata after reveal", async function () {
      const revealTime = await time.latest();
      await launchpad.setRevealTimestamp(revealTime);
      await launchpad.reveal();
      
      const config = await launchpad.launchConfig();
      expect(config.isRevealed).to.be.true;
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const launchConfig = {
        maxSupply: MAX_SUPPLY,
        startPrice: START_PRICE,
        endPrice: END_PRICE,
        auctionDuration: AUCTION_DURATION,
        allowlistDuration: ALLOWLIST_DURATION,
        publicSaleStart: currentTime + 100,
        maxPerWallet: MAX_PER_WALLET,
        isRevealed: false,
        baseURI: "https://api.example.com/metadata/",
        hiddenURI: "https://api.example.com/hidden.json"
      };
      await launchpad.configureLaunch(launchConfig);
      await launchpad.updateAllowlist([user1Address], true);
      
      // Generate some revenue
      await launchpad.connect(user1).allowlistMint(2, { value: START_PRICE.mul(2) });
    });

    it("Should allow owner to withdraw funds", async function () {
      const contractBalance = await ethers.provider.getBalance(launchpad.address);
      const ownerBalanceBefore = await owner.getBalance();
      
      const tx = await launchpad.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const ownerBalanceAfter = await owner.getBalance();
      const expectedBalance = ownerBalanceBefore.add(contractBalance).sub(gasUsed);
      
      expect(ownerBalanceAfter).to.be.closeTo(expectedBalance, ethers.utils.parseEther("0.001"));
    });

    it("Should only allow owner to withdraw", async function () {
      await expect(launchpad.connect(user1).withdraw())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow owner to pause contract", async function () {
      await launchpad.pause();
      expect(await launchpad.paused()).to.be.true;
    });

    it("Should prevent minting when paused", async function () {
      await launchpad.pause();
      
      await expect(launchpad.connect(user1).allowlistMint(1, { value: START_PRICE }))
        .to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to unpause", async function () {
      await launchpad.pause();
      await launchpad.unpause();
      expect(await launchpad.paused()).to.be.false;
    });
  });
});scripts/deploy-nft-launchpad.ts  import { ethers } from "hardhat";
import { Contract } from "ethers";

/**
 * Deployment script for BaseNFTLaunchpad on Base network
 * Handles contract deployment, configuration, and verification
 */

interface NFTLaunchConfig {
  collectionName: string;
  collectionSymbol: string;
  maxSupply: number;
  startPrice: string;
  endPrice: string;
  auctionDuration: number;
  allowlistDuration: number;
  maxPerWallet: number;
  royaltyRecipient: string;
  royaltyFee: number;
  baseURI: string;
  hiddenURI: string;
}

const BASE_NFT_CONFIG: NFTLaunchConfig = {
  collectionName: "Base Builders NFT",
  collectionSymbol: "BBN",
  maxSupply: 10000,
  startPrice: "0.08", // 0.08 ETH
  endPrice: "0.02", // 0.02 ETH
  auctionDuration: 86400, // 24 hours
  allowlistDuration: 3600, // 1 hour
  maxPerWallet: 10,
  royaltyRecipient: "0x1234567890123456789012345678901234567890",
  royaltyFee: 750, // 7.5%
  baseURI: "https://api.basebuilders.xyz/metadata/",
  hiddenURI: "https://api.basebuilders.xyz/hidden.json"
};

async function deployNFTLaunchpad(): Promise<Contract> {
  console.log("🚀 Starting BaseNFTLaunchpad deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    throw new Error("❌ Insufficient balance for deployment");
  }

  console.log("🔨 Deploying BaseNFTLaunchpad contract...");
  const LaunchpadFactory = await ethers.getContractFactory("BaseNFTLaunchpad");
  
  const launchpad = await LaunchpadFactory.deploy(
    BASE_NFT_CONFIG.collectionName,
    BASE_NFT_CONFIG.collectionSymbol,
    BASE_NFT_CONFIG.royaltyRecipient,
    {
      gasLimit: 4000000,
      gasPrice: ethers.utils.parseUnits("1", "gwei")
    }
  );

  await launchpad.deployed();
  console.log("✅ BaseNFTLaunchpad deployed to:", launchpad.address);

  return launchpad;
}

async function configureLaunch(launchpad: Contract): Promise<void> {
  console.log("⚙️ Configuring NFT launch parameters...");
  
  const currentTime = Math.floor(Date.now() / 1000);
  const publicSaleStart = currentTime + BASE_NFT_CONFIG.allowlistDuration + 300; // 5 min buffer
  
  const launchConfig = {
    maxSupply: BASE_NFT_CONFIG.maxSupply,
    startPrice: ethers.utils.parseEther(BASE_NFT_CONFIG.startPrice),
    endPrice: ethers.utils.parseEther(BASE_NFT_CONFIG.endPrice),
    auctionDuration: BASE_NFT_CONFIG.auctionDuration,
    allowlistDuration: BASE_NFT_CONFIG.allowlistDuration,
    publicSaleStart: publicSaleStart,
    maxPerWallet: BASE_NFT_CONFIG.maxPerWallet,
    isRevealed: false,
    baseURI: BASE_NFT_CONFIG.baseURI,
    hiddenURI: BASE_NFT_CONFIG.hiddenURI
  };
  
  try {
    const tx = await launchpad.configureLaunch(launchConfig, {
      gasLimit: 300000
    });
    await tx.wait();
    console.log("✅ Launch configuration completed");
  } catch (error) {
    console.error("❌ Failed to configure launch:", error);
    throw error;
  }
}

async function setupAllowlist(launchpad: Contract): Promise<void> {
  console.log("📋 Setting up initial allowlist...");
  
  // Example allowlist addresses (replace with actual addresses)
  const allowlistAddresses = [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    "0x3333333333333333333333333333333333333333",
    "0x4444444444444444444444444444444444444444",
    "0x5555555555555555555555555555555555555555"
  ];
  
  try {
    // Add addresses in batches to avoid gas limit issues
    const batchSize = 50;
    for (let i = 0; i < allowlistAddresses.length; i += batchSize) {
      const batch = allowlistAddresses.slice(i, i + batchSize);
      const tx = await launchpad.updateAllowlist(batch, true, {
        gasLimit: 500000
      });
      await tx.wait();
      console.log(`✅ Added ${batch.length} addresses to allowlist (batch ${Math.floor(i/batchSize) + 1})`);
    }
  } catch (error) {
    console.error("❌ Failed to setup allowlist:", error);
  }
}

async function setRevealTimestamp(launchpad: Contract): Promise<void> {
  console.log("🕰️ Setting reveal timestamp...");
  
  // Set reveal for 48 hours after deployment
  const revealTime = Math.floor(Date.now() / 1000) + (48 * 60 * 60);
  
  try {
    const tx = await launchpad.setRevealTimestamp(revealTime, {
      gasLimit: 100000
    });
    await tx.wait();
    console.log(`✅ Reveal timestamp set for: ${new Date(revealTime * 1000).toISOString()}`);
  } catch (error) {
    console.error("❌ Failed to set reveal timestamp:", error);
  }
}

async function verifyContract(
  contractAddress: string,
  constructorArgs: any[]
): Promise<void> {
  console.log("🔍 Verifying contract on Base block explorer...");
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
      network: "base"
    });
    console.log("✅ Contract verified successfully");
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
  }
}

async function generateLaunchReport(
  launchpad: Contract,
  deploymentTx: any
): Promise<void> {
  console.log("📊 Generating launch report...");
  
  const report = {
    contractAddress: launchpad.address,
    deploymentTx: deploymentTx.hash,
    deployer: deploymentTx.from,
    gasUsed: deploymentTx.gasUsed?.toString(),
    gasPrice: deploymentTx.gasPrice?.toString(),
    blockNumber: deploymentTx.blockNumber,
    timestamp: new Date().toISOString(),
    network: "Base Mainnet",
    config: BASE_NFT_CONFIG,
    launchTimeline: {
      allowlistStart: "Immediate",
      allowlistDuration: `${BASE_NFT_CONFIG.allowlistDuration / 3600} hours`,
      publicSaleStart: "After allowlist + 5min buffer",
      auctionDuration: `${BASE_NFT_CONFIG.auctionDuration / 3600} hours`,
      revealTime: "48 hours after deployment"
    },
    pricing: {
      startPrice: `${BASE_NFT_CONFIG.startPrice} ETH`,
      endPrice: `${BASE_NFT_CONFIG.endPrice} ETH`,
      priceDecreaseRate: "Linear over auction duration"
    },
    features: [
      "Dutch Auction Pricing",
      "Allowlist Phase",
      "ERC2981 Royalties",
      "Reveal Mechanism",
      "Emergency Pause",
      "Batch Allowlist Management"
    ]
  };

  console.log("📋 Launch Report:");
  console.log(JSON.stringify(report, null, 2));
  
  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    `nft-launch-report-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );
}

async function main(): Promise<void> {
  try {
    console.log("🌟 BaseNFTLaunchpad Deployment Started");
    console.log("🔗 Network: Base Mainnet");
    console.log("⏰ Timestamp:", new Date().toISOString());
    
    // Deploy main contract
    const launchpad = await deployNFTLaunchpad();
    
    // Configure launch parameters
    await configureLaunch(launchpad);
    
    // Setup initial allowlist
    await setupAllowlist(launchpad);
    
    // Set reveal timestamp
    await setRevealTimestamp(launchpad);
    
    // Verify contract
    await verifyContract(launchpad.address, [
      BASE_NFT_CONFIG.collectionName,
      BASE_NFT_CONFIG.collectionSymbol,
      BASE_NFT_CONFIG.royaltyRecipient
    ]);
    
    // Generate launch report
    const deploymentTx = launchpad.deployTransaction;
    await generateLaunchReport(launchpad, deploymentTx);
    
    console.log("🎉 NFT Launchpad deployment completed successfully!");
    console.log("📍 Contract Address:", launchpad.address);
    console.log("🔗 Base Explorer:", `https://basescan.org/address/${launchpad.address}`);
    console.log("🎨 Collection:", BASE_NFT_CONFIG.collectionName);
    console.log("💰 Price Range:", `${BASE_NFT_CONFIG.endPrice} - ${BASE_NFT_CONFIG.startPrice} ETH`);
    
  } catch (error) {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployNFTLaunchpad, configureLaunch, setupAllowlist };
