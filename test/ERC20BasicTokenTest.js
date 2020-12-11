const XAGMock = artifacts.require('XAGWithBalance.sol');
const Proxy = artifacts.require('AdminUpgradeabilityProxyXAG.sol');

const assertRevert = require('./helpers/assertRevert');

// Test that XAG operates correctly as an ERC20Basic token.
contract('ERC20Basic XAG', function ([_, admin, recipient, anotherAccount, owner]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    const xag = await XAGMock.new({from: owner});
    const proxy = await Proxy.new(xag.address, {from: admin});
    const proxiedXAG = await XAGMock.at(proxy.address);
    await proxiedXAG.initialize({from: owner});
    await proxiedXAG.initializeBalance(owner, 100);
    this.token = proxiedXAG;
  });

  describe('basic data', function () {
    it('has getters for the name, symbol, and decimals', async function () {
      const name = await this.token.name();
      assert.equal(name, "ARGENT");
      const symbol = await this.token.symbol();
      assert.equal(symbol, "XAG");
      const decimals = await this.token.decimals();
      assert.equal(decimals, 18);
    });
  });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      const totalSupply = await this.token.totalSupply();

      assert.equal(totalSupply, 100);
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        const balance = await this.token.balanceOf(anotherAccount);

        assert.equal(balance, 0);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        const balance = await this.token.balanceOf(owner);

        assert.equal(balance, 100);
      });
    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        it('reverts', async function () {
          await assertRevert(this.token.transfer(to, amount, {from: owner}));
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('transfers the requested amount', async function () {
          await this.token.transfer(to, amount, {from: owner});

          const senderBalance = await this.token.balanceOf(owner);
          assert.equal(senderBalance, 0);

          const recipientBalance = await this.token.balanceOf(to);
          assert.equal(recipientBalance, amount);
        });

        it('emits a transfer event', async function () {
          const {logs} = await this.token.transfer(to, amount, {from: owner});

          // we expect a length of two because we emit a transfer event
          // for both the original transfer and the fee transfer
          assert.equal(logs.length, 2);
          assert.equal(logs[0].event, 'Transfer');
          assert.equal(logs[0].args.from, owner);
          assert.equal(logs[0].args.to, to);
          assert.equal(logs[0].args.value, amount);
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(this.token.transfer(to, 100, {from: owner}));
      });
    });
  });
});
