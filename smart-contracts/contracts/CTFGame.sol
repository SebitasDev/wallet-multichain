// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CTFGame is Ownable {
    uint256 public immutable startTime;
    uint256 public immutable maxDuration;
    uint256 public immutable captureFee; // In native Token (wei)

    address public currentHolder;
    uint256 public lastCaptureTime;
    
    // Mapping to track total time held by each address
    mapping(address => uint256) public timeHeld;
    
    // Participants tracking
    mapping(address => bool) public hasJoined;
    address[] public players;
    
    bool public isFinished;

    event PlayerJoined(address indexed player);
    event FlagCaptured(address indexed previousHolder, address indexed newHolder, uint256 timeHeldByPrevious);
    event GameFinished(address indexed winner);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    constructor(
        uint256 _duration, 
        uint256 _captureFee, 
        address _creator
    ) Ownable(_creator) {
        startTime = block.timestamp;
        maxDuration = _duration;
        captureFee = _captureFee;
        lastCaptureTime = block.timestamp;
    }

    modifier onlyActive() {
        require(block.timestamp <= startTime + maxDuration, "Game ended");
        require(!isFinished, "Game finished");
        _;
    }

    function joinGame() external onlyActive {
        require(!hasJoined[msg.sender], "Already joined");
        require(block.timestamp <= startTime + maxDuration, "Registration closed");
        
        hasJoined[msg.sender] = true;
        players.push(msg.sender);
        emit PlayerJoined(msg.sender);
    }

    function captureFlag() external payable onlyActive {
        require(hasJoined[msg.sender], "Not joined");
        require(msg.value >= captureFee, "Insufficient fee");
        require(msg.sender != currentHolder, "Already holding");

        if (currentHolder != address(0)) {
            uint256 timeDiff = block.timestamp - lastCaptureTime;
            timeHeld[currentHolder] += timeDiff;
            emit FlagCaptured(currentHolder, msg.sender, timeDiff);
        } else {
            emit FlagCaptured(address(0), msg.sender, 0);
        }

        currentHolder = msg.sender;
        lastCaptureTime = block.timestamp;
    }

    function distributeRewards() external {
        require(block.timestamp > startTime + maxDuration, "Game not ended yet");
        require(!isFinished, "Already finished");
        
        isFinished = true;

        if (currentHolder != address(0)) {
           uint256 endTime = startTime + maxDuration; 
           if (lastCaptureTime < endTime) {
               uint256 timeDiff = endTime - lastCaptureTime;
               timeHeld[currentHolder] += timeDiff;
           }
        }
        
        address winner;
        uint256 maxTime = 0;
        
        for (uint256 i = 0; i < players.length; i++) {
            address p = players[i];
            if (timeHeld[p] > maxTime) {
                maxTime = timeHeld[p];
                winner = p;
            }
        }
        
        // Just emit winner, no transfers
        emit GameFinished(winner);
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
        emit FeesWithdrawn(owner(), balance);
    }
    
    function getGameState() external view returns (
        address _holder,
        uint256 _timeLeft,
        bool _isActive
    ) {
        _holder = currentHolder;
        if (block.timestamp < startTime + maxDuration) {
            _timeLeft = (startTime + maxDuration) - block.timestamp;
        } else {
            _timeLeft = 0;
        }
        _isActive = !isFinished && (_timeLeft > 0);
    }
}
