pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract Dai is ERC20, Ownable {
  constructor() ERC20('Dai', 'DAI') {}

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}