import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { MINT_FEE, clock, coinType, stakingContract, stakingPool } from './constants';
import { toast } from 'react-toastify';

export const getSuiClient = () => {
    // use getFullnodeUrl to define Testnet RPC location
    const rpcUrl = getFullnodeUrl("testnet")

    // create a client connected to testnet
    const client = new SuiClient({ url: rpcUrl });

    return client;
};

const client = getSuiClient()

export const fetchBalance = async (walletAddress) => {
    try {
        const fullnodeUrl = getFullnodeUrl("testnet"); // or 'mainnet' if you're on the main network
        const client = new SuiClient({ url: fullnodeUrl });


        console.log("walletAddress", walletAddress)
        console.log("Fetching SUI balance...");
        const suiBalance = await client.getCoins({ owner: walletAddress });
        console.log("SUI Balance Response:", suiBalance);

        let tokenBalance = 0;
        let nextCursor = null;

        do {
            const tokenResponse = await client.getCoins({ coinType, owner: walletAddress, cursor: nextCursor });
            console.log("Token Balance Response:", tokenResponse);

            for (const coin of tokenResponse.data) {
                tokenBalance += parseInt(coin.balance, 10);
            }

            nextCursor = tokenResponse.nextCursor;
        } while (nextCursor);

        const suiAmount = suiBalance.data.reduce((total, coin) => total + parseInt(coin.balance, 10), 0);

        console.log("SUI Amount:", suiAmount);
        console.log("Token Amount:", tokenBalance);

        return {
            suiAmount: Number(suiAmount) / 1e9, tokenBalance: Number(tokenBalance) / 1e9
        };
    } catch (error) {
        console.error("Error fetching token balance:", error.message);
        console.error("Stack Trace:", error.stack);
        return { suiAmount: 0, tokenBalance: 0 };
    }
};


export const deserializeU64 = (valueArray) => {
    let result = 0;
    for (let i = 0; i < valueArray.length; i++) {
        result += valueArray[i] * Math.pow(256, i);
    }
    return result;
}

export const getValidCoinId = async (account, amountNeeded, signAndExecute) => {
    let tokenBal = await fetchBalance(account.address)
    if (Number(tokenBal?.tokenBalance) < Number(amountNeeded)) {
        console.log("111")
        return false
    }
    let coins = await client.getCoins({ coinType, owner: account?.address });
    console.log("coins", coins);
    if (coins.data.length === 0) {
        console.error("No coins found for the address");
        console.log("222")
        return false;
    }
    let primaryCoinId = coins.data[0]?.coinObjectId
    console.log("primaryCoinId", primaryCoinId)
    if (coins.data[0]?.balance >= Number(amountNeeded) * 1e9) {
        return primaryCoinId
    }
    let requiredCoinId = null
    let i = 0
    while (i > coins.data.length) {
        if (coins?.data[i].balance >= Number(amountNeeded) * 1e9) {
            requiredCoinId = coins.data[i].coinObjectId
        }
        i++
    }
    if (requiredCoinId != null) {
        console.log("333")
        return requiredCoinId
    }
    const coinIdsToMerge = coins.data.slice(1).map(coin => coin.coinObjectId);

    if (coinIdsToMerge.length > 0) {
        const mergeTx = new Transaction();
        mergeTx.setGasBudget(MINT_FEE);

        console.log("Primary Coin ID: ", primaryCoinId);
        console.log("Coins to merge: ", coinIdsToMerge);

        mergeTx.mergeCoins(mergeTx.object(primaryCoinId), coinIdsToMerge.map(id => mergeTx.object(id)));
        try {
            signAndExecute(
                {
                    transaction: mergeTx,
                },
                {
                    onSuccess: async ({ digest }) => {
                        const txRes = await client.waitForTransaction({
                            digest,
                            options: {
                                showEffects: true,
                            },
                        });

                        // The first created object in this Transaction should be the new Counter
                        const objectId = txRes.effects?.created?.[0]?.reference?.objectId;
                        console.log("merged", objectId)

                        console.log("444")
                        return primaryCoinId
                    },
                    onError: async ({ digest }) => {
                        try {
                            toast.error("Transaction Failed: " + digest)
                            console.log("tx", digest)
                            console.log("333")
                            return false
                        }
                        catch (Err) {
                            console.log("Error", Err)
                            console.log("444")
                            return false
                        }
                    }
                }
            )
        }
        catch (Err) {
            console.log("Error", Err)
            console.log("555")
            return false
        }
    }

}

export const Stake = async (account, stakeAmount, signAndExecute, setReload, reload, setPageLoader) => {
    try {
        if (Number(stakeAmount) <= 0) {
            toast.error("Invalid Stake Amount")
            setPageLoader(false)
            return false
        }
        let primaryCoinId = await getValidCoinId(account, stakeAmount, signAndExecute)
        console.log("primary coin id", primaryCoinId)
        if (primaryCoinId === false) {
            toast.error("Insufficient Token balance");
            setPageLoader(false)
            return false
        }

        setTimeout(async () => {
            const tx = new Transaction();

            console.log("rd", account?.address)
            tx.setGasBudget(1000000000);
            let [coin] = tx.splitCoins(primaryCoinId, [tx.pure(Number(stakeAmount) * 1e9)])

            console.log("tx")
            tx.moveCall({
                typeArguments: [coinType],
                arguments: [
                    tx.object(stakingPool),
                    tx.object(coin),
                    tx.object(clock),
                ],
                target: `${stakingContract}::staking::stake`,
            });
            try {
                signAndExecute(
                    {
                        transaction: tx,
                    },
                    {
                        onSuccess: async ({ digest }) => {
                            const tx = await client.waitForTransaction({
                                digest,
                                options: {
                                    showEffects: true,
                                },
                            });

                            // The first created object in this Transaction should be the new Counter
                            const objectId = tx.effects?.created?.[0]?.reference?.objectId;

                            // if (objectId) {
                            toast.success("Transaction Success: " + digest)
                            setReload(!reload)
                            setPageLoader(false)
                            // }
                        },
                        onError: async ({ digest }) => {
                            toast.error("Transaction Failed: " + digest)
                            setPageLoader(false)
                            console.log("tx", digest)
                            return false
                        }
                    },
                );
            }
            catch (Err) {
                console.log("Error", Err)
                setPageLoader(false)
                return false
            }
        }, 3000)

    }
    catch (Err) {
        console.log("Error", Err)
        setPageLoader(false)
        return false
    }
}

export const unStake = async (signAndExecute, setReload, reload, setPageLoader) => {
    try {
        const tx = new Transaction();

        tx.setGasBudget(1000000000);

        // const sui = await client.getCoins({ owner: account.address });
        // console.log("sui", sui);
        console.log("before sign")

        tx.moveCall({
            typeArguments: [coinType],
            arguments: [
                tx.object(stakingPool),
                tx.object(clock),
            ],
            target: `${stakingContract}::staking::unstake`,
        });

        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: async ({ digest }) => {
                    const tx = await client.waitForTransaction({
                        digest,
                        options: {
                            showEffects: true,
                        },
                    });

                    // The first created object in this Transaction should be the new Counter
                    const objectId = tx.effects?.created?.[0]?.reference?.objectId;
                    setReload(!reload)
                    if (objectId) {
                        toast.success("Transaction Success: " + digest)
                        setPageLoader(false)

                    }
                },
                onError: async ({ digest }) => {
                    toast.error("Transaction Failed: " + digest)
                    console.log("tx", digest)
                    setPageLoader(false)
                    return false
                }
            },
        );
    }
    catch (Err) {
        console.log("Error", Err)
        setPageLoader(false)
        return false
    }

}

export const claimReward = async (signAndExecute, setReload, reload, setPageLoader) => {
    try {
        const tx = new Transaction();

        tx.setGasBudget(1000000000);

        // const sui = await client.getCoins({ owner: account.address });
        // console.log("sui", sui);
        console.log("before sign")

        tx.moveCall({
            typeArguments: [coinType],
            arguments: [
                tx.object(stakingPool),
                tx.object(clock),
            ],
            target: `${stakingContract}::staking::claim_pending_rewards`,
        });

        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: async ({ digest }) => {
                    const tx = await client.waitForTransaction({
                        digest,
                        options: {
                            showEffects: true,
                        },
                    });

                    // The first created object in this Transaction should be the new Counter
                    const objectId = tx.effects?.created?.[0]?.reference?.objectId;
                    setReload(!reload)
                    if (objectId) {
                        toast.success("Transaction Success: " + digest)
                        setPageLoader(false)

                    }
                },
                onError: async ({ digest }) => {
                    console.log("error")
                    toast.error("Transaction Failed: " + digest)
                    setPageLoader(false)
                    return false
                }
            },
        );
    }
    catch (Err) {
        console.log("Error", Err)
        setPageLoader(false)
        return false
    }

}