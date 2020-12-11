const XAG = artifacts.require('ArgentXAG');
const Proxy = artifacts.require('AdminUpgradeabilityProxyXAG');

module.exports = async function(deployer) {
  await deployer;

  await deployer.deploy(XAG);
  const proxy = await deployer.deploy(Proxy, XAG.address);
  const proxiedXAG = await XAG.at(proxy.address);
  await proxy.changeAdmin("0x75E2d5B3Ed2A8854B416edf16C4b9Aa901dD4ea5");
  await proxiedXAG.initialize();
};
