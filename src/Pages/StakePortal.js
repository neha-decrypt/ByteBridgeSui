import React, { useEffect, useState } from 'react'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { clock, coinType, stakingContract, stakingPool } from '../constants';
import { Transaction } from '@mysten/sui/transactions';
import { Stake, claimReward, deserializeU64, unStake, fetchBalance, getSuiClient } from '../helpers';
import { Audio } from 'react-loader-spinner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';

console.log("herrrrr")

const StakePortal = (props) => {
    const [withdraw, setWithdraw] = useState(false)
    const account = useCurrentAccount();
    const client = getSuiClient();
    const [stakedBal, setStakedBal] = useState(0)
    const [stakeAmount, setStakeAmount] = useState(0)
    const [tokenBal, setTokenBal] = useState(0)
    const [reload, setReload] = useState(false)
    const [pendingReward, setPendingReward] = useState(0)
    const [pageLoader, setPageLoader] = useState(false)
    const [contentLoader, setContentLoader] = useState(false)
    const [isRotating, setIsRotating] = useState(false);


    const { mutate: signAndExecute } = useSignAndExecuteTransaction();


    const handleRefreshClick = () => {
        setIsRotating(true);
        setReload(!reload);
        setTimeout(() => setIsRotating(false), 2000); // Rotate for 2 seconds
    };

    const localStake = async (...args) => {
        setPageLoader(true)
        let res = await Stake(...args, setPageLoader)
        console.log("resss", res)
        if (res === false) {
            console.log("failed")
        }
    }

    const localUnstake = async (...args) => {
        setPageLoader(true)
        let res = await unStake(...args, setPageLoader)
        console.log("resss", res)
        if (res === false) {
            console.log("failed")
        }
    }


    useEffect(() => {
        const fetchData = async () => {
            setContentLoader(true)
            if (account && account?.address) {

                let bal = await fetchBalance(account?.address)
                if (bal && bal?.tokenBalance) {
                    setTokenBal(bal?.tokenBalance)
                }
                else {
                    setTokenBal(0)
                }
                const res = await client.call('sui_getObject', {
                    objectId: stakingPool,
                    options: {
                        showContent: true,
                    },
                });
                setStakedBal(0)
                if (res?.data?.content?.fields?.users?.length > 0) {
                    for (let i = 0; i < res?.data?.content?.fields?.users?.length; i++) {
                        console.log("res" + i, " - ", res?.data?.content?.fields?.users[i]?.fields)
                        if (res?.data?.content?.fields?.users[i]?.fields?.user?.toLowerCase() === account?.address?.toLowerCase()) {

                            setStakedBal(res?.data?.content?.fields?.users[i]?.fields?.stake_balance)
                            break
                        }
                    }
                }

                const tx = new Transaction();
                tx.moveCall({
                    target: `${stakingContract}::staking::get_pending_rewards`,
                    typeArguments: [coinType],
                    arguments: [tx.object(stakingPool), tx.pure(account?.address), tx.pure(clock)],
                });

                console.log("account?.address", account?.address)

                let result = await client.devInspectTransactionBlock({ sender: account?.address, transactionBlock: tx })
                console.log("ress", result)
                if (result?.effects && result.effects?.status && result.effects?.status?.status === "success" && result?.results) {
                    const returnValues = result?.results?.[0]?.returnValues;
                    if (returnValues.length > 0) {
                        console.log("pending reward", deserializeU64(returnValues[0][0]));
                        setPendingReward(Number(deserializeU64(returnValues[0][0])) / 1e9)
                    } else {
                        setPendingReward(0)
                        console.error('No return values from transaction');
                    }
                } else {
                    setPendingReward(0)
                    console.error('Invalid transaction effects');
                }

            }
            setContentLoader(false)
        };

        fetchData();
    }, [account, reload]);



    return (
        <div className={`StakePortal container-fluid d-flex align-items-center justify-content-center ${pageLoader ? 'loading' : ''}`}>
            <div className="loader-container">
                {pageLoader && (
                    <div className="loader">
                        <Audio
                            height="80"
                            width="80"
                            radius="9"
                            color="#009dda"
                            ariaLabel="loading"
                            wrapperStyle={{ margin: 'auto' }}
                            wrapperClass="loader-inner"
                        />
                    </div>
                )}
            </div>

            <div className={` ${pageLoader ? 'blur' : ''}`}>

                <img className='BGUP' src='assets/bgImg.png' />
                <div className='BGUPCIRCLE'></div>
                <div className='BGDNCIRCLE'></div>

                <img className='BGDN' src='assets/bgImgDown.png' />


                <div className='container-fluid' >
                    <div className='row'>

                        <div className='col-md-6  d-flex align-items-center justify-content-center' >
                            <div style={{ maxWidth: '600px' }}>
                                <div className='HeadingText'>Stake $Bytes</div>
                                <div className='paraText'>Lorem ipsum dolor sit amet consectetur. In justo a integer justo arcu mauris enim est scelerisque. Posuere tempor id at sit aliquam venenatis amet eget. Feugiat leo elementum eu molestie.</div>
                            </div>
                        </div>
                        <div className='col-md-6 BGVid d-flex align-items-center justify-content-center'>
                            <div className='stakeForm d-flex align-items-center justify-content-center'>
                                {/* <div className='UpperSwitch'>
                                    <div
                                        className={`DepositBtn ${!withdraw ? 'active' : ''}`}
                                        onClick={handleChangeToDeposit}
                                    >
                                        Deposit
                                    </div>
                                    <div
                                        className={`DepositBtn ${withdraw ? 'active' : ''}`}
                                        onClick={handleChangeToWithdraw}
                                    >
                                        Withdraw
                                    </div>
                                </div > */}



                                <>
                                    <div className='FormText'></div>
                                    <div className='d-flex align-items-center justify-content-around w-100 mb-1' >
                                        <div className='AVAIText'>Available: {tokenBal} $BYTES </div>

                                    </div>
                                    <div className='EtheriumDiv'>
                                        <img className="sui-logo" src="assets/sui.png"></img>

                                        <div>Sui</div>
                                    </div>
                                    <div className='mt-4 TextInputDiv'>
                                        <input type='text' onChange={(e) => {
                                            setStakeAmount(e.target.value)
                                        }} placeholder='0.00' maxLength={20} value={stakeAmount} className='TextInput' />
                                        <div className='textAbsolute'>$Bytes</div>
                                    </div>


                                    <div className='connectedDiv'>
                                        {account?.address ? <>
                                            <p className='stakeInfo'> Staked Balance: {Number(stakedBal) / 1e9}</p>
                                            <p className='stakeInfo'>Pending Reward {pendingReward} <FontAwesomeIcon
                                                icon={faSyncAlt}
                                                className={`refreshIcon ${isRotating ? 'rotating' : ''}`}
                                                onClick={handleRefreshClick}
                                            /></p>
                                            {stakedBal ? <div><button className='ConnectWallet' disabled={Number(stakedBal) <= 0} onClick={async () => { await localUnstake(signAndExecute, setReload, reload) }}>Unstake</button>
                                                <button className='ConnectWallet' onClick={() => { claimReward(signAndExecute, setReload, reload, setPageLoader) }}>Claim Pending Reward</button>
                                            </div> : <button className='ConnectWallet' disabled={Number(stakedBal) > 0} onClick={async () => { await localStake(account, stakeAmount, signAndExecute, setReload, reload) }}>Stake</button>}

                                        </> : <ConnectButton className='ConnectWallet' />}
                                    </div>



                                </>


                            </div >
                        </div >
                    </div >
                </div >
            </div >
        </div >
    )
}

export default StakePortal
