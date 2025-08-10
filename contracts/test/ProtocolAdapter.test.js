const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ProtocolAdapter", function () {
  async function deployProtocolAdapterFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const tokenA = await MockERC20.deploy("Token A", "TKNA", ethers.parseEther("1000000"));
    const tokenB = await MockERC20.deploy("Token B", "TKNB", ethers.parseEther("1000000"));

    // Deploy ProtocolAdapter
    const ProtocolAdapter = await ethers.getContractFactory("ProtocolAdapter");
    const protocolAdapter = await ProtocolAdapter.deploy();

    // Setup initial token support
    await protocolAdapter.addSupportedToken(tokenA.target);
    await protocolAdapter.addSupportedToken(tokenB.target);

    // Transfer tokens to users
    await tokenA.transfer(user1.address, ethers.parseEther("10000"));
    await tokenB.transfer(user1.address, ethers.parseEther("10000"));
    await tokenA.transfer(user2.address, ethers.parseEther("10000"));
    await tokenB.transfer(user2.address, ethers.parseEther("10000"));

    return { protocolAdapter, tokenA, tokenB, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial configuration", async function () {
      const { protocolAdapter, owner } = await loadFixture(deployProtocolAdapterFixture);
      
      expect(await protocolAdapter.owner()).to.equal(owner.address);
      
      // Check initial Uniswap V3 configuration
      const uniswapConfig = await protocolAdapter.protocolConfigs(0); // UNISWAP_V3
      expect(uniswapConfig.isActive).to.be.true;
      expect(uniswapConfig.maxSlippage).to.equal(300);
      expect(uniswapConfig.gasLimit).to.equal(300000);
    });

    it("Should have correct protocol types", async function () {
      const { protocolAdapter } = await loadFixture(deployProtocolAdapterFixture);
      
      // Test that we can query different protocol configurations
      const uniswapConfig = await protocolAdapter.protocolConfigs(0);
      const aaveConfig = await protocolAdapter.protocolConfigs(1);
      
      expect(uniswapConfig.protocolAddress).to.not.equal(ethers.ZeroAddress);
      expect(aaveConfig.protocolAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Protocol Configuration", function () {
    it("Should allow owner to configure protocols", async function () {
      const { protocolAdapter, owner } = await loadFixture(deployProtocolAdapterFixture);
      
      const newConfig = {
        protocolAddress: "0x1234567890123456789012345678901234567890",
        isActive: true,
        maxSlippage: 500,
        gasLimit: 400000
      };

      await expect(protocolAdapter.configureProtocol(2, newConfig)) // COMPOUND
        .to.emit(protocolAdapter, "ProtocolConfigured")
        .withArgs(2, newConfig.protocolAddress);

      const config = await protocolAdapter.protocolConfigs(2);
      expect(config.protocolAddress).to.equal(newConfig.protocolAddress);
      expect(config.isActive).to.equal(newConfig.isActive);
      expect(config.maxSlippage).to.equal(newConfig.maxSlippage);
      expect(config.gasLimit).to.equal(newConfig.gasLimit);
    });

    it("Should reject invalid protocol configurations", async function () {
      const { protocolAdapter } = await loadFixture(deployProtocolAdapterFixture);
      
      const invalidConfig = {
        protocolAddress: ethers.ZeroAddress,
        isActive: true,
        maxSlippage: 500,
        gasLimit: 400000
      };

      await expect(protocolAdapter.configureProtocol(2, invalidConfig))
        .to.be.revertedWith("Invalid protocol address");
    });

    it("Should reject high slippage configurations", async function () {
      const { protocolAdapter } = await loadFixture(deployProtocolAdapterFixture);
      
      const highSlippageConfig = {
        protocolAddress: "0x1234567890123456789012345678901234567890",
        isActive: true,
        maxSlippage: 1500, // 15% - too high
        gasLimit: 400000
      };

      await expect(protocolAdapter.configureProtocol(2, highSlippageConfig))
        .to.be.revertedWith("Slippage too high");
    });

    it("Should only allow owner to configure protocols", async function () {
      const { protocolAdapter, user1 } = await loadFixture(deployProtocolAdapterFixture);
      
      const config = {
        protocolAddress: "0x1234567890123456789012345678901234567890",
        isActive: true,
        maxSlippage: 500,
        gasLimit: 400000
      };

      await expect(protocolAdapter.connect(user1).configureProtocol(2, config))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Rate Calculation", function () {
    it("Should return best rate across protocols", async function () {
      const { protocolAdapter, tokenA, tokenB } = await loadFixture(deployProtocolAdapterFixture);
      
      const amount = ethers.parseEther("100");
      const [bestProtocol, bestRate, gasEstimate] = await protocolAdapter.getBestRate(
        tokenA.target,
        tokenB.target,
        amount
      );

      expect(bestRate).to.be.gt(0);
      expect(gasEstimate).to.be.gt(0);
      expect(bestProtocol).to.be.oneOf([0, 1, 2, 3]); // Valid protocol types
    });

    it("Should reject unsupported tokens", async function () {
      const { protocolAdapter, tokenA } = await loadFixture(deployProtocolAdapterFixture);
      
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const unsupportedToken = await MockERC20.deploy("Unsupported", "UNS", ethers.parseEther("1000"));

      const amount = ethers.parseEther("100");
      
      await expect(protocolAdapter.getBestRate(
        tokenA.target,
        unsupportedToken.target,
        amount
      )).to.be.revertedWith("Unsupported token");
    });

    it("Should reject zero amount", async function () {
      const { protocolAdapter, tokenA, tokenB } = await loadFixture(deployProtocolAdapterFixture);
      
      await expect(protocolAdapter.getBestRate(
        tokenA.target,
        tokenB.target,
        0
      )).to.be.revertedWith("Invalid amount");
    });
  });

  describe("Swap Execution", function () {
    it("Should execute swap successfully", async function () {
      const { protocolAdapter, tokenA, tokenB, user1 } = await loadFixture(deployProtocolAdapterFixture);
      
      const amount = ethers.parseEther("100");
      const minOutput = ethers.parseEther("95");
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Approve tokens
      await tokenA.connect(user1).approve(protocolAdapter.target, amount);

      const initialBalanceA = await tokenA.balanceOf(user1.address);
      const initialBalanceB = await tokenB.balanceOf(user1.address);

      await expect(protocolAdapter.connect(user1).executeSwap(
        tokenA.target,
        tokenB.target,
        amount,
        minOutput,
        deadline
      )).to.emit(protocolAdapter, "SwapExecuted");

      const finalBalanceA = await tokenA.balanceOf(user1.address);
      const finalBalanceB = await tokenB.balanceOf(user1.address);

      expect(finalBalanceA).to.equal(initialBalanceA - amount);
      expect(finalBalanceB).to.be.gt(initialBalanceB);
    });

    it("Should reject expired transactions", async function () {
      const { protocolAdapter, tokenA, tokenB, user1 } = await loadFixture(deployProtocolAdapterFixture);
      
      const amount = ethers.parseEther("100");
      const minOutput = ethers.parseEther("95");
      const deadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      await tokenA.connect(user1).approve(protocolAdapter.target, amount);

      await expect(protocolAdapter.connect(user1).executeSwap(
        tokenA.target,
        tokenB.target,
        amount,
        minOutput,
        deadline
      )).to.be.revertedWith("Transaction expired");
    });

    it("Should reject insufficient output", async function () {
      const { protocolAdapter, tokenA, tokenB, user1 } = await loadFixture(deployProtocolAdapterFixture);
      
      const amount = ethers.parseEther("100");
      const minOutput = ethers.parseEther("150"); // Unrealistic high expectation
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await tokenA.connect(user1).approve(protocolAdapter.target, amount);

      await expect(protocolAdapter.connect(user1).executeSwap(
        tokenA.target,
        tokenB.target,
        amount,
        minOutput,
        deadline
      )).to.be.revertedWith("Insufficient output");
    });
  });

  describe("Token Management", function () {
    it("Should allow owner to add supported tokens", async function () {
      const { protocolAdapter, owner } = await loadFixture(deployProtocolAdapterFixture);
      
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const newToken = await MockERC20.deploy("New Token", "NEW", ethers.parseEther("1000"));

      await expect(protocolAdapter.addSupportedToken(newToken.target))
        .to.emit(protocolAdapter, "TokenAdded")
        .withArgs(newToken.target);

      expect(await protocolAdapter.supportedTokens(newToken.target)).to.be.true;
    });

    it("Should allow owner to remove supported tokens", async function () {
      const { protocolAdapter, tokenA } = await loadFixture(deployProtocolAdapterFixture);

      await protocolAdapter.removeSupportedToken(tokenA.target);
      expect(await protocolAdapter.supportedTokens(tokenA.target)).to.be.false;
    });

    it("Should only allow owner to manage tokens", async function () {
      const { protocolAdapter, tokenA, user1 } = await loadFixture(deployProtocolAdapterFixture);

      await expect(protocolAdapter.connect(user1).removeSupportedToken(tokenA.target))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause and unpause", async function () {
      const { protocolAdapter } = await loadFixture(deployProtocolAdapterFixture);

      await protocolAdapter.emergencyPause();
      expect(await protocolAdapter.paused()).to.be.true;

      await protocolAdapter.emergencyUnpause();
      expect(await protocolAdapter.paused()).to.be.false;
    });

    it("Should prevent swaps when paused", async function () {
      const { protocolAdapter, tokenA, tokenB, user1 } = await loadFixture(deployProtocolAdapterFixture);

      await protocolAdapter.emergencyPause();

      const amount = ethers.parseEther("100");
      const minOutput = ethers.parseEther("95");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await tokenA.connect(user1).approve(protocolAdapter.target, amount);

      await expect(protocolAdapter.connect(user1).executeSwap(
        tokenA.target,
        tokenB.target,
        amount,
        minOutput,
        deadline
      )).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for rate queries", async function () {
      const { protocolAdapter, tokenA, tokenB } = await loadFixture(deployProtocolAdapterFixture);
      
      const amount = ethers.parseEther("100");
      
      const tx = await protocolAdapter.getBestRate.staticCall(
        tokenA.target,
        tokenB.target,
        amount
      );
      
      // This is a view function, so gas estimation is for reference
      expect(tx).to.not.be.undefined;
    });

    it("Should optimize gas for multiple protocol comparisons", async function () {
      const { protocolAdapter, tokenA, tokenB } = await loadFixture(deployProtocolAdapterFixture);
      
      // Configure multiple protocols
      const configs = [
        {
          protocolAddress: "0x1111111111111111111111111111111111111111",
          isActive: true,
          maxSlippage: 300,
          gasLimit: 250000
        },
        {
          protocolAddress: "0x2222222222222222222222222222222222222222",
          isActive: true,
          maxSlippage: 200,
          gasLimit: 280000
        }
      ];

      await protocolAdapter.configureProtocol(2, configs[0]); // COMPOUND
      await protocolAdapter.configureProtocol(3, configs[1]); // CURVE

      const amount = ethers.parseEther("100");
      const [bestProtocol, bestRate, gasEstimate] = await protocolAdapter.getBestRate(
        tokenA.target,
        tokenB.target,
        amount
      );

      expect(bestRate).to.be.gt(0);
      expect(gasEstimate).to.be.lte(400000); // Should be reasonable
    });
  });

  describe("Integration Tests", function () {
    it("Should handle multiple consecutive swaps", async function () {
      const { protocolAdapter, tokenA, tokenB, user1 } = await loadFixture(deployProtocolAdapterFixture);
      
      const amount = ethers.parseEther("50");
      const minOutput = ethers.parseEther("45");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Approve sufficient tokens
      await tokenA.connect(user1).approve(protocolAdapter.target, amount * 2n);
      await tokenB.connect(user1).approve(protocolAdapter.target, amount * 2n);

      // First swap: A -> B
      await protocolAdapter.connect(user1).executeSwap(
        tokenA.target,
        tokenB.target,
        amount,
        minOutput,
        deadline
      );

      // Second swap: B -> A
      await protocolAdapter.connect(user1).executeSwap(
        tokenB.target,
        tokenA.target,
        amount,
        minOutput,
        deadline
      );

      // Both swaps should complete successfully
      expect(await tokenA.balanceOf(user1.address)).to.be.gt(0);
      expect(await tokenB.balanceOf(user1.address)).to.be.gt(0);
    });

    it("Should handle edge case amounts", async function () {
      const { protocolAdapter, tokenA, tokenB, user1 } = await loadFixture(deployProtocolAdapterFixture);
      
      // Test with very small amount
      const smallAmount = ethers.parseEther("0.001");
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await tokenA.connect(user1).approve(protocolAdapter.target, smallAmount);

      const [, bestRate] = await protocolAdapter.getBestRate(
        tokenA.target,
        tokenB.target,
        smallAmount
      );

      expect(bestRate).to.be.gt(0);
    });
  });
});
