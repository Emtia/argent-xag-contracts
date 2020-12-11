const XAGMock = artifacts.require('XAGWithBalance.sol');
const Proxy = artifacts.require('AdminUpgradeabilityProxyXAG.sol');

const assertRevert = require('./helpers/assertRevert');

// Test that the XAG contract can reclaim XAG it has received.
// Note that the contract is not payable in Eth.
contract('CanReclaimFunds', function ([_, admin, owner, assetProtectionRole, anyone]) {
  const amount = 100;

  beforeEach(async function () {
    // Create contract and token
    const xag = await XAGMock.new({from: owner});
    const proxy = await Proxy.new(xag.address, {from: admin});
    const proxiedXAG = await XAGMock.at(proxy.address);
    await proxiedXAG.initialize({from: owner});
    await proxiedXAG.initializeBalance(owner, amount);
    this.token = proxiedXAG;

    // Send token to the contract
    await this.token.transfer(this.token.address, amount, {from: owner});
    const balance = await this.token.balanceOf(owner);
    assert.equal(0, balance.toNumber());
    const contractBalance = await this.token.balanceOf(this.token.address);
    assert.equal(amount, contractBalance);

    // freeze the contract address to mimick the current state on mainnet
    await this.token.setAssetProtectionRole(assetProtectionRole, {from: owner});
    await this.token.freeze(this.token.address, {from: assetProtectionRole});
  });

  it('should not accept Eth', async function () {
    await assertRevert(
      web3.eth.sendTransaction({from: owner, to: this.token.address, value: amount})
    );
  });

  it('should allow owner to reclaim tokens', async function () {
    await this.token.reclaimXAG({from: owner});

    const balance = await this.token.balanceOf(owner);
    assert.equal(amount, balance);
    const contractBalance = await this.token.balanceOf(this.token.address);
    assert.equal(0, contractBalance);
  });

  it('should allow only owner to reclaim tokens', async function () {
    await assertRevert(
      this.token.reclaimXAG({from: anyone})
    );
  });
});
