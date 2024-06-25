import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { MINT_FEE, adminCap, clock, pools, stakingContract } from './constants';
import { toast } from 'react-toastify';
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export const getSuiClient = () => {
    // use getFullnodeUrl to define Testnet RPC location
    const rpcUrl = getFullnodeUrl("testnet")

    // create a client connected to testnet
    const client = new SuiClient({ url: rpcUrl });

    return client;
};

export const client = getSuiClient()

export const fetchSuiBalance = async (walletAddress) => {
    try {
        const suiBalance = await client.getCoins({ owner: walletAddress });
        const suiAmount = suiBalance.data.reduce((total, coin) => total + parseInt(coin.balance, 10), 0);

        return suiAmount
    }
    catch (err) {
        console.log("Error", err)
    }
}

export const fetchTokenBalance = async (walletAddress, index) => {
    try {

        let tokenBalance = 0;
        let nextCursor = null;
        console.log(" pools[index]", pools[index])
        do {
            const tokenResponse = await client.getCoins({ coinType: pools[index].coinType, owner: walletAddress, cursor: nextCursor });


            for (const coin of tokenResponse.data) {
                tokenBalance += parseInt(coin.balance, 10);
            }

            nextCursor = tokenResponse.nextCursor;
        } while (nextCursor);


        return tokenBalance;
    } catch (error) {
        console.error("Error fetching token balance:", error.message);
        return 0;
    }
};


export const deserializeU64 = (valueArray) => {
    let result = 0;
    for (let i = 0; i < valueArray.length; i++) {
        result += valueArray[i] * Math.pow(256, i);
    }
    return result;
}

export const getValidCoinId = async (account, amountNeeded, signAndExecute, index) => {
    let tokenBalance = await fetchTokenBalance(account.address, index)
    if (Number(tokenBalance) < Number(amountNeeded)) {
        return false
    }
    let coins = await client.getCoins({ coinType: pools[index].coinType, owner: account?.address });
    console.log("coins", coins)
    if (coins.data.length === 0) {
        console.error("No coins found for the address");
        return false;
    }
    let primaryCoinId = coins.data[0]?.coinObjectId
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
        return requiredCoinId
    }
    const coinIdsToMerge = coins.data.slice(1).map(coin => coin.coinObjectId);

    if (coinIdsToMerge.length > 0) {
        const mergeTx = new Transaction();
        mergeTx.setGasBudget(MINT_FEE);

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

                        return primaryCoinId
                    },
                    onError: async ({ digest }) => {
                        try {
                            toast.error("Transaction Failed: " + digest)

                            return false
                        }
                        catch (Err) {
                            console.log("Error", Err)
                            return false
                        }
                    }
                }
            )
        }
        catch (Err) {
            console.log("Error", Err)
            return false
        }
    }
    return primaryCoinId
}

export const Stake = async (account, stakeAmount, signAndExecute, setReload, reload, setPageLoader, index) => {
    try {
        if (Number(stakeAmount) <= 0) {
            toast.error("Invalid Stake Amount")
            setPageLoader(false)
            return false
        }

        let tokenBalance = await fetchTokenBalance(account.address, index)
        if (Number(tokenBalance) < Number(stakeAmount) * 1e9) {
            console.error("No coins found for the address");
        }
        let coins = await client.getCoins({ coinType: pools[index].coinType, owner: account?.address });
        console.log("coins", coins)
        if (coins.data.length === 0) {
            console.error("No coins found for the address");
            return false;
        }
        let primaryCoinId = coins.data[0]?.coinObjectId

        let requiredCoinId = null
        let i = 0
        const tx = new Transaction();
        while (i > coins.data.length) {
            if (coins?.data[i].balance >= Number(stakeAmount) * 1e9) {
                requiredCoinId = coins.data[i].coinObjectId
            }
            i++
        }
        if (requiredCoinId != null) {
            primaryCoinId = requiredCoinId
        }
        if (requiredCoinId == null) {
            const coinIdsToMerge = coins.data.slice(1).map(coin => coin.coinObjectId);
            if (coinIdsToMerge.length > 0) {
                tx.mergeCoins(tx.object(primaryCoinId), coinIdsToMerge.map(id => tx.object(id)));
            }
        }

        // let primaryCoinId = await getValidCoinId(account, stakeAmount, signAndExecute, index)
        if (primaryCoinId === false) {
            toast.error("Insufficient Token balance");
            setPageLoader(false)
            return false
        }



        tx.setGasBudget(1000000000);
        console.log("primaryyyy", primaryCoinId)
        let [coin] = tx.splitCoins(primaryCoinId, [tx.pure(Number(stakeAmount) * 1e9)])
        console.log("coin", coin)
        tx.moveCall({
            typeArguments: [pools[index].coinType],
            arguments: [
                tx.object(pools[index].poolId),
                tx.object(coin),
                tx.object(clock)
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


                        // if (objectId) {
                        toast.success("Transaction Success: " + digest)
                        setReload(!reload)
                        setPageLoader(false)
                        // }
                    },
                    onError: async ({ digest }) => {
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
    catch (Err) {
        console.log("Error", Err)
        setPageLoader(false)
        return false
    }
}

export const unStake = async (signAndExecute, setReload, reload, setPageLoader, index) => {
    try {
        const tx = new Transaction();

        tx.setGasBudget(1000000000);


        tx.moveCall({
            typeArguments: [pools[index].coinType],
            arguments: [
                tx.object(pools[index].poolId),
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

export const claimReward = async (signAndExecute, setReload, reload, setPageLoader, index) => {
    try {
        const tx = new Transaction();

        tx.setGasBudget(1000000000);

        tx.moveCall({
            typeArguments: [pools[index].coinType],
            arguments: [
                tx.object(pools[index].poolId),
                tx.object(clock), // Add the account address as an argument
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

export const poolInfo = async (address, index) => {
    try {
        console.log("inside pool info", index)
        const res = await client.call('sui_getObject', {
            objectId: pools[index].poolId,
            options: {
                showContent: true,
            },
        });
        let stats = res?.data?.content?.fields?.stats?.fields
        console.log("res?.data?.content?.fields", res?.data?.content?.fields)
        if (stats) {
            console.log("stats", stats)
        }
        let response = {
            total_staked: stats?.staked_balance,
            total_reward: stats?.total_reward,
            reward_percent: res?.data?.content?.fields?.reward_percent
        }
        if (res?.data?.content?.fields?.users?.length > 0 && address != null) {
            for (let i = 0; i < res?.data?.content?.fields?.users?.length; i++) {
                if (res?.data?.content?.fields?.users[i]?.fields?.user?.toLowerCase() === address?.toLowerCase()) {
                    response.stakedAmount = res?.data?.content?.fields?.users[i]?.fields?.stake_balance
                    break
                }
            }
        }

        return response
    }
    catch (Err) {
        console.log("Err", Err)
        return 0
    }
}

export const getPoolsInfoByUser = async (address = null) => {
    try {
        // if (address == null) {
        //     return pools
        // }
        const result = []
        const poolInfoPromises = pools.map((pool, key) => poolInfo(address, key));
        const poolInfos = await Promise.all(poolInfoPromises);
        poolInfos.reduce((acc, poolId, index) => {
            const parts = pools[index].coinType.split('::');
            const lastItem = parts[parts.length - 1];
            result.push({
                "poolId": pools[index].poolId,
                "coinType": pools[index].coinType,
                "symbol": lastItem,
                "stakedAmount": poolInfos[index].stakedAmount,
                "total_staked": poolInfos[index].total_staked,
                "total_reward": poolInfos[index].total_reward,
                "reward_percent": poolInfos[index].reward_percent
            })
        }, {});
        let total_volume_for_platform = 0
        let total_volume_for_user = 0
        let total_rewards_earned_by_user = 0
        for (let i = 0; i < pools?.length; i++) {
            total_volume_for_platform += result[i].total_staked ? Number(result[i].total_staked) * pools[i].price / 1e9 : 0
            total_volume_for_user += result[i].stakedAmount ? Number(result[i].stakedAmount) * pools[i].price / 1e9 : 0
            total_rewards_earned_by_user += result[i].total_reward ? Number(result[i].total_reward) * pools[i].price / 1e9 : 0
        }
        return { result, total_volume_for_platform, total_volume_for_user, total_rewards_earned_by_user };

    }
    catch (Err) {
        console.log("Err", Err)
        return []
    }
}

export const getPendingReward = async (address, index) => {
    try {
        const tx = new Transaction();
        tx.moveCall({
            target: `${stakingContract}::staking::get_pending_rewards`,
            typeArguments: [pools[index].coinType],
            arguments: [tx.object(pools[index].poolId), tx.pure(address), tx.pure(clock)],
        });


        let result = await client.devInspectTransactionBlock({ sender: address, transactionBlock: tx })
        if (result?.effects && result.effects?.status && result.effects?.status?.status === "success" && result?.results) {
            const returnValues = result?.results?.[0]?.returnValues;
            if (returnValues.length > 0) {
                return (Number(deserializeU64(returnValues[0][0])))
            } else {
                console.error('No return values from transaction');
                return 0
            }
        } else {
            console.error('Invalid transaction effects');
            return 0
        }
    }
    catch (Err) {
        console.log("Err", Err)
        return 0
    }
}

export const getAllPoolsPendingRewards = async (address) => {
    try {
        if (address == null) {
            return []
        }
        const results = []
        const poolInfoPromises = pools.map((pool, key) => getPendingReward(address, key));
        const poolInfos = await Promise.all(poolInfoPromises);
        poolInfos.reduce((acc, poolId, index) => {
            results.push(poolId)
        }, {});
        return results
    }
    catch (Err) {
        console.log("Err", Err)
        return []
    }
}

export const getTokenBalancesForUsers = async (address) => {
    try {
        if (address == null) {
            return []
        }
        const results = []
        const poolInfoPromises = pools.map((pool, key) => fetchTokenBalance(address, key));
        const poolInfos = await Promise.all(poolInfoPromises);
        poolInfos.reduce((acc, poolId, index) => {
            results.push(poolId)
        }, {});
        return results
    }
    catch (Err) {
        console.log("Err", Err)
        return []
    }
}

export const adminCreateStake = async () => {
    const { keypair, walletAddress } = privateWallet();
    if (!keypair) {
        console.error("Keypair is not initialized");
        return null;
    }

    try {
        const tx = new Transaction();
        const client = getSuiClient(); // Fetch the coin details
        console.log("client: ", client)
        let coins = await client.getCoins({ coinType: pools[0].coinType, owner: walletAddress });
        console.log("coins", coins);
        if (coins.data.length === 0) {
            console.error("No coins found for the address");
            return;
        }

        console.log("rd", walletAddress)
        tx.setGasBudget(100000000);

        const sui = await client.getCoins({ owner: walletAddress });
        console.log("sui", sui);
        console.log("before sign")


        // Merge all coins into one
        let primaryCoinId = coins.data[0].coinObjectId;
        console.log("primaryCoinId", primaryCoinId)
        if (coins.data[0]?.balance < Number(MINT_FEE)) {
            const coinIdsToMerge = coins.data.slice(1).map(coin => coin.coinObjectId);

            if (coinIdsToMerge.length > 0) {
                const mergeTx = new Transaction();
                mergeTx.setGasBudget(MINT_FEE);

                console.log("Primary Coin ID: ", primaryCoinId);
                console.log("Coins to merge: ", coinIdsToMerge);

                mergeTx.mergeCoins(mergeTx.object(primaryCoinId), coinIdsToMerge.map(id => mergeTx.object(id)));

                // Sign and execute the merge transaction
                const mergeResult = await client.signAndExecuteTransaction({
                    signer: keypair,
                    transaction: mergeTx,
                });

                console.log("Merge Result: ", mergeResult);

                // Wait for the merge transaction to be confirmed
                const mergeTransaction = await client.waitForTransaction({
                    digest: mergeResult.digest,
                    options: {
                        showEffects: true,
                    },
                });

                console.log("Merge Transaction: ", mergeTransaction);

                if (mergeTransaction.effects.status.status !== "success") {
                    console.error("Merge transaction failed");
                    return;
                }
            } else {
                console.log("No additional coins to merge");
            }

        }

        tx.moveCall({
            target: `${stakingContract}::staking::create_stake`,
            typeArguments: [pools[0].coinType],
            arguments: [
                tx.object(adminCap),
                tx.object(primaryCoinId),
                tx.pure(2, "u64")
            ]
        });
        console.log("before sign")
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
        });
        console.log("result", result);
        const transaction = await client.waitForTransaction({
            digest: result.digest,
            options: {
                showEffects: true,
            },
        });
        console.log("transaction", transaction, transaction?.effects?.status?.status);
        if (transaction?.effects?.status?.status === "success") {
            return true
        }
        return false
    } catch (error) {
        console.log(error)
        return error;
    }
};

export const adminAddStake = async () => {
    const { keypair, walletAddress } = privateWallet();
    if (!keypair) {
        console.error("Keypair is not initialized");
        return null;
    }

    try {
        const tx = new Transaction();
        const client = getSuiClient(); // Fetch the coin details
        console.log("client: ", client)
        let coins = await client.getCoins({ coinType: pools[0].coinType, owner: walletAddress });
        console.log("coins", coins);
        if (coins.data.length === 0) {
            console.error("No coins found for the address");
            return;
        }

        console.log("rd", walletAddress)
        tx.setGasBudget(100000000);

        const sui = await client.getCoins({ owner: walletAddress });
        console.log("sui", sui);
        console.log("before sign")


        // Merge all coins into one
        let primaryCoinId = coins.data[0].coinObjectId;
        console.log("primaryCoinId", primaryCoinId)
        if (coins.data[0]?.balance < Number(MINT_FEE)) {
            const coinIdsToMerge = coins.data.slice(1).map(coin => coin.coinObjectId);

            if (coinIdsToMerge.length > 0) {
                const mergeTx = new Transaction();
                mergeTx.setGasBudget(MINT_FEE);

                console.log("Primary Coin ID: ", primaryCoinId);
                console.log("Coins to merge: ", coinIdsToMerge);

                mergeTx.mergeCoins(mergeTx.object(primaryCoinId), coinIdsToMerge.map(id => mergeTx.object(id)));

                // Sign and execute the merge transaction
                const mergeResult = await client.signAndExecuteTransaction({
                    signer: keypair,
                    transaction: mergeTx,
                });

                console.log("Merge Result: ", mergeResult);

                // Wait for the merge transaction to be confirmed
                const mergeTransaction = await client.waitForTransaction({
                    digest: mergeResult.digest,
                    options: {
                        showEffects: true,
                    },
                });

                console.log("Merge Transaction: ", mergeTransaction);

                if (mergeTransaction.effects.status.status !== "success") {
                    console.error("Merge transaction failed");
                    return;
                }
            } else {
                console.log("No additional coins to merge");
            }

        }

        tx.moveCall({
            target: `${stakingContract}::staking::deposit_stake`,
            typeArguments: [pools[0].coinType],
            arguments: [
                tx.object(adminCap),
                tx.object(pools[0]?.poolId),
                tx.object(primaryCoinId)
            ]
        });
        console.log("before sign")
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
        });
        console.log("result", result);
        const transaction = await client.waitForTransaction({
            digest: result.digest,
            options: {
                showEffects: true,
            },
        });
        console.log("transaction", transaction, transaction?.effects?.status?.status);
        if (transaction?.effects?.status?.status === "success") {
            return true
        }
        return false
    } catch (error) {
        console.log(error)
        return error;
    }
};

export const privateWallet = () => {
    try {
        const mn =
            "home access borrow begin rabbit decorate surge coyote globe alien coin detail";
        const _keypair = Ed25519Keypair.deriveKeypair(mn);
        const privateKey = _keypair.getSecretKey();
        console.log("privateKey", privateKey);
        const _address = _keypair.getPublicKey().toSuiAddress();
        console.log("Address:", _address);
        return { walletAddress: _address, keypair: _keypair, error: null };
    } catch (error) {
        console.error("Failed to initialize keypair:", error);
        return { walletAddress: "", keyPair: "", error };
    }
};

export const mintFT = async (index, beneficiary) => {
    const { keypair, walletAddress } = privateWallet();
    if (!keypair) {
        console.error("Keypair is not initialized");
        return null;
    }

    try {
        // const tx = new Transaction();
        const client = getSuiClient(); // Fetch the coin details
        console.log("client: ", client)


        const tx = new Transaction();

        console.log("rd", walletAddress)
        tx.setGasBudget(10000000);

        const sui = await client.getCoins({ owner: walletAddress });
        console.log("sui", sui);
        console.log("before sign")


        tx.moveCall({
            target: `${pools[index].coin}::mint`,
            // typeArguments: ["0x8cf30a95bfb2ce8fc0ed0e6ab0b7be83fe8864686d9cc34081dd52628ac4c8a5::NENE::NENE"],
            arguments: [
                tx.object(pools[index].treasury),
                tx.pure(1000000000000, "u64"),
                tx.object(beneficiary)
            ]
        });
        console.log("before sign")
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
        });
        console.log("result", result);
        const transaction = await client.waitForTransaction({
            digest: result.digest,
            options: {
                showEffects: true,
            },
        });
        console.log("transaction", transaction, transaction?.effects?.status?.status);
        if (transaction?.effects?.status?.status === "success") {
            return true
        }
        return false
    } catch (error) {
        console.log(error)
        return error;
    }
};
