// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BaseDefiAggregator
 * @dev Advanced DeFi yield aggregator and portfolio optimizer for Base ecosystem
 * @author wearedood
 */
contract BaseDefiAggregator is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Strategy {
        address protocol;
        uint256 allocation;
        uint256 expectedYield;
        bool active;
        uint256 lastUpdate;
    }

    struct UserPosition {
        uint256 totalDeposited;
        uint256 shares;
        uint256 lastRebalance;
        mapping(address => uint256) tokenBalances;
    }

    mapping(address => UserPosition) public userPositions;
    mapping(uint256 => Strategy) public strategies;
    mapping(address => bool) public supportedTokens;
    
    uint256 public totalStrategies;
    uint256 public totalValueLocked;
    uint256 public performanceFee = 200; // 2%
    uint256 public constant MAX_STRATEGIES = 10;
    
    address public feeRecipient;
    bool public emergencyPause;

    event Deposit(address indexed user, address token, uint256 amount);
    event Withdraw(address indexed user, address token, uint256 amount);
    event Rebalance(uint256 indexed strategyId, uint256 newAllocation);
    event StrategyAdded(uint256 indexed strategyId, address protocol);
    event EmergencyPause(bool paused);

    modifier notPaused() {
        require(!emergencyPause, "Contract is paused");
        _;
    }

    modifier validStrategy(uint256 strategyId) {
        require(strategyId < totalStrategies, "Invalid strategy");
        require(strategies[strategyId].active, "Strategy inactive");
        _;
    }

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }

    function deposit(address token, uint256 amount) external nonReentrant notPaused {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        UserPosition storage position = userPositions[msg.sender];
        position.totalDeposited += amount;
        position.tokenBalances[token] += amount;
        
        totalValueLocked += amount;
        
        if (shouldRebalance(msg.sender)) {
            _rebalanceUserPosition(msg.sender);
        }

        emit Deposit(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        UserPosition storage position = userPositions[msg.sender];
        require(position.tokenBalances[token] >= amount, "Insufficient balance");

        position.tokenBalances[token] -= amount;
        position.totalDeposited -= amount;
        totalValueLocked -= amount;

        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, token, amount);
    }

    function addStrategy(address protocol, uint256 allocation, uint256 expectedYield) external onlyOwner {
        require(totalStrategies < MAX_STRATEGIES, "Max strategies reached");
        require(protocol != address(0), "Invalid protocol address");
        require(allocation <= 10000, "Allocation too high");

        strategies[totalStrategies] = Strategy({
            protocol: protocol,
            allocation: allocation,
            expectedYield: expectedYield,
            active: true,
            lastUpdate: block.timestamp
        });

        emit StrategyAdded(totalStrategies, protocol);
        totalStrategies++;
    }

    function shouldRebalance(address user) public view returns (bool) {
        UserPosition storage position = userPositions[user];
        return block.timestamp - position.lastRebalance > 1 days;
    }

    function _rebalanceUserPosition(address user) internal {
        UserPosition storage position = userPositions[user];
        position.lastRebalance = block.timestamp;
    }

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    function setEmergencyPause(bool paused) external onlyOwner {
        emergencyPause = paused;
        emit EmergencyPause(paused);
    }
}
