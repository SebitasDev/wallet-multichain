// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CTFGame.sol";

contract CTFFactory {
    event GameCreated(address indexed gameAddress, address indexed creator);

    address[] public games;

    constructor() {}

    function createGame(uint256 _duration, uint256 _captureFee) external returns (address) {
        // Deploy new Game
        CTFGame newGame = new CTFGame(_duration, _captureFee, msg.sender);

        games.push(address(newGame));
        emit GameCreated(address(newGame), msg.sender);
        
        return address(newGame);
    }
    
    function getAllGames() external view returns (address[] memory) {
        return games;
    }
    
    function getGamesCount() external view returns (uint256) {
        return games.length;
    }
}
