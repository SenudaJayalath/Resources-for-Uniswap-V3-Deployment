pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract Matic is ERC20, Ownable {
  constructor() ERC20('Matic', 'MATIC') {}

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
