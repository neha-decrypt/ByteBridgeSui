import React, { useEffect, useState } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Stake, claimReward, unStake, getPoolsInfoByUser, getAllPoolsPendingRewards, getTokenBalancesForUsers } from '../helpers';
import { Audio } from 'react-loader-spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { pools } from '../constants';

const Pools = (props) => {
   

    const account = useCurrentAccount();
    const [stakeAmount, setStakeAmount] = useState([]);
    const [tokenBalances, setTokenBalances] = useState([]);
    const [reload, setReload] = useState(false);
    const [pendingReward, setPendingReward] = useState([]);
    const [pageLoader, setPageLoader] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [poolsInfo, setPoolsInfo] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false)
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const handleRefreshClick = (key) => {
        setIsRotating(true);
        setIsRefresh(true)
        setReload(!reload);
        setTimeout(() => setIsRotating(false), 2000); // Rotate for 2 seconds
    };

    const localStake = async (...args) => {
        setPageLoader(true);
        let res = await Stake(...args);
        if (res === false) {
            console.log("failed");
        }
    };

    const localUnstake = async (...args) => {
        setPageLoader(true);
        let res = await unStake(...args);
        if (res === false) {
            console.log("failed");
        }
    };

    const localClaimReward = async (...args) => {
        setPageLoader(true);
        let res = await claimReward(...args);
        if (res === false) {
            console.log("failed");
        }
    };

    useEffect(() => {
        const poolInfoArray = Array.from({ length: pools.length }, () => 0);
        setStakeAmount(poolInfoArray)
        setPendingReward(poolInfoArray)
        setPoolsInfo(poolInfoArray)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (!isRefresh)
                setPageLoader(true);
            let poolsData = await getPoolsInfoByUser(account?.address)
            setPoolsInfo(poolsData)

            if (account && account?.address) {
                let pending = await getAllPoolsPendingRewards(account?.address)
                let balances = await getTokenBalancesForUsers(account?.address)
                setPendingReward(pending)
                setTokenBalances(balances)
            }
            setIsRefresh(false)
            setPageLoader(false);
        };

        fetchData();
    }, [account, reload]);

    return (
        <div className={`StakePortal container-fluid d-flex align-items-center justify-content-center ${pageLoader ? 'loading' : ''}`}>
            <img className='BGUP' src='assets/bgImg.png' />
            <div className='BGUPCIRCLE'></div>
            <div className='BGDNCIRCLE'></div>
            <img className='BGDN' src='assets/bgImgDown.png' />

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

            <div className={`${pageLoader ? 'blur' : ''}`}>
                <div className="card-deck">
                    {poolsInfo && poolsInfo?.length > 0 && poolsInfo?.map((pool, key) => (
                        <div className="card mb-3" key={key}>
                            <div className="card-body">
                                <button
                                    className="btn-info"
                                    onClick={() => handleRefreshClick(key)}
                                    disabled={isRotating}
                                >
                                    <FontAwesomeIcon icon={faSyncAlt} spin={isRotating} /> Refresh
                                </button>
                                <h5 className="card-title">Pool ID: </h5><div className="pb-3">{pool?.poolId}</div>

                                <p className="card-text"><b>Available Balance:</b> {tokenBalances?.[key] ? (Number(tokenBalances?.[key]) / 1e9) : "0"} {pool?.symbol}</p>
                                <p className="card-text"><b>Staked Amount:</b> {pool?.stakedAmount ? (Number(pool?.stakedAmount) / 1e9) : "0"} {pool?.symbol}</p>
                                <p className="card-text"><b>Pending Reward:</b> {pendingReward ? (Number(pendingReward[key]) / 1e9) : "0"} {pool?.symbol}</p>
                                <div className="input-group mb-3">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Stake Amount"
                                        value={stakeAmount[key]}
                                        onChange={(e) => {
                                            const updatedStakeAmount = [...stakeAmount];
                                            updatedStakeAmount[key] = e.target.value;
                                            setStakeAmount(updatedStakeAmount);
                                        }}
                                    />
                                    <button
                                        className="btn btn-primary rounded-right"
                                        disabled={!account?.address}
                                        onClick={() => localStake(account, stakeAmount[key], signAndExecute, setReload, reload, setPageLoader, key)}
                                    >
                                        Stake
                                    </button>
                                </div>
                                <div className='connectedDiv'>
                                    {account?.address ?
                                        <div className="btn-group">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => localUnstake(signAndExecute, setReload, reload, setPageLoader, key)}
                                            >
                                                Unstake
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => localClaimReward(signAndExecute, setReload, reload, setPageLoader, key)}
                                            >
                                                Claim Reward
                                            </button>

                                        </div>
                                        : <ConnectButton className='connect-wallet' />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pools;
