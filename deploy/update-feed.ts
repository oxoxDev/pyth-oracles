import { Provider } from "zksync-web3";
import * as ethers from "ethers";
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load contract artifact. Make sure to compile first!
import * as ContractArtifact from "../artifacts-zk/contracts/PythAggregatorV3.sol/PythAggregatorV3.json";

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

// Address of the contract on zksync testnet
const CONTRACT_ADDRESS = "0x517F9cd13fE63e698d0466ad854cDba5592eeA73";

if (!CONTRACT_ADDRESS) throw "⛔️ Contract address not provided";

// An example of a deploy script that will deploy and call a simple contract.
export default async function () {
  console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);

  const pythPriceService = new EvmPriceServiceConnection(
    "https://xc-mainnet.pyth.network", // https://docs.pyth.network/documentation/pythnet-price-feeds/price-service
    {
      logger: {
        error: console.error,
        warn: console.warn,
        info: () => undefined,
        debug: () => undefined,
        trace: () => undefined,
      },
    }
  );

  const priceIds = [
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // eth/usd
    "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b", // usdt/usd
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", // usdc/usd
  ];

  const data = await pythPriceService.getPriceFeedsUpdateData(priceIds);
  console.log("update data", data);

  // // Initialize the provider.
  // // @ts-ignore
  const provider = new Provider("https://mainnet.era.zksync.io");
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  // Initialize contract instance
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ContractArtifact.abi,
    signer
  );

  // Read message from contract
  // console.log(`The message is ${await contract.greet()}`);

  console.log("updating feeds");
  const tx = await contract.updateFeeds(data, { value: "10000000000000000" });
  console.log(tx.hash);

  await tx.wait();
}
