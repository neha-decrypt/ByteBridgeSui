import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Stake, claimReward, unStake, getPoolsInfoByUser, getAllPoolsPendingRewards, getTokenBalancesForUsers } from '../helpers';
import { Audio } from 'react-loader-spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { pools } from '../constants';

function Pool() {
    const [modalShow, setModalShow] = React.useState(false);
    const account = useCurrentAccount();
    const [stakeAmount, setStakeAmount] = useState();
    const [tokenBalances, setTokenBalances] = useState([]);
    const [reload, setReload] = useState(false);
    const [pendingReward, setPendingReward] = useState([]);
    const [pageLoader, setPageLoader] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [poolsInfo, setPoolsInfo] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false)
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isWithdraw, setIsWithdraw] = useState(false)
    const [activeKey, setActiveKey] = useState()

    const [overAllStats, setOverAllStats] = useState({
        "total_volume_for_platform": 0,
        "total_volume_for_user": 0
    })

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
        setPendingReward(poolInfoArray)
        setPoolsInfo(poolInfoArray)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (!isRefresh)
                setPageLoader(true);
            let poolsData = await getPoolsInfoByUser(account?.address)
            setPoolsInfo(poolsData?.result)
            console.log("poolsData", poolsData)
            setOverAllStats({ total_volume_for_platform: poolsData?.total_volume_for_platform, total_volume_for_user: poolsData?.total_volume_for_user, total_rewards_earned_by_user: poolsData?.total_rewards_earned_by_user })
            if (account && account?.address) {
                let pending = await getAllPoolsPendingRewards(account?.address)
                let balances = await getTokenBalancesForUsers(account?.address)
                setPendingReward(pending)
                console.log("balances", balances)
                setTokenBalances(balances)
            }
            setIsRefresh(false)
            setPageLoader(false);
        };

        fetchData();
    }, [account, reload]);

    function MyVerticallyCenteredModal(props) {
        return (
            <Modal
                {...props}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >

                <Modal.Body>
                    <div id="connect" className={pageLoader ? "blur" : ""}>
                        <div className="mainBtns">
                            <button className={!props.isWithdraw ? 'active' : ""} onClick={() => props.setIsWithdraw(false)}>Deposit</button>
                            <button className={props.isWithdraw ? 'active' : ""} onClick={() => props.setIsWithdraw(true)}>Withdraw</button>
                        </div>
                        {!isWithdraw ? (<><div className="inputCon">
                            <div className="meriInput">
                                <span>{poolsInfo?.[activeKey]?.symbol}</span>
                                <input className='myInput' placeholder='0.00' value={stakeAmount} onChange={(e) => {
                                    setStakeAmount(e.target.value)
                                }} type="text" />
                            </div>
                            <div className="text">
                                <p>Available to stake: {Number(tokenBalances[activeKey]) / 1e9} {poolsInfo?.[activeKey]?.symbol}</p>
                                <p>Staked Balance: {Number(poolsInfo[activeKey]?.stakedAmount) / 1e9} {poolsInfo[activeKey]?.symbol}</p>
                                <div className="text-white" onClick={() => {
                                    setStakeAmount(Number(tokenBalances[activeKey]) / 1e9)
                                }}>Use Max</div>
                            </div>
                        </div>
                            <div className="btns">
                                <button onClick={() => localStake(account, stakeAmount, signAndExecute, setReload, reload, setPageLoader, activeKey)}>Deposit</button>
                                <button onClick={() => setModalShow(false)}> Cancel</button>
                            </div>
                        </>) :
                            (<> <div className="inputCon">
                                <div className="meriInput">
                                    {/* <span>DCB</span>
                                    <input className='myInput' placeholder='0.00' type="text" /> */}
                                </div>
                                <div className="text mt-3">
                                    <p>Staked Balance: {Number(poolsInfo[activeKey]?.stakedAmount) / 1e9} {poolsInfo[activeKey]?.symbol}</p>
                                    <br></br>
                                    <p>Pending Reward: {Number(pendingReward[activeKey]) / 1e9} {poolsInfo[activeKey]?.symbol}</p><button
                                        className="refresh-btn"
                                        onClick={() => handleRefreshClick(activeKey)}
                                        disabled={isRotating}
                                    >
                                        <FontAwesomeIcon icon={faSyncAlt} spin={isRotating} /> Refresh
                                    </button>
                                </div>

                            </div>
                                <div className="btns">
                                    <button onClick={() => localUnstake(signAndExecute, setReload, reload, setPageLoader, activeKey)}>Withdraw</button>
                                    <button onClick={() => localClaimReward(signAndExecute, setReload, reload, setPageLoader, activeKey)}>Claim Reward</button>
                                    <button onClick={() => setModalShow(false)}>Cancel</button>
                                </div>
                            </>)}
                    </div>
                </Modal.Body>

            </Modal >
        );
    }

    return (
        <>
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
            <div id='Pool' className={pageLoader ? "blur" : ""}>

                <div className="container first">
                    <div className="row">
                        <div className="col-5 common-col  ">
                            <div className="loloPad">
                                <h4>LAUNCHPAD</h4>
                                <p>Lorem ipsum dolor sit amet consectetur. In justo a integer justo arcu mauris enim est scelerisque. Posuere tempor id at sit aliquam venenatis amet.</p>
                            </div>
                        </div>
                        <div className="col-7 common-col ">
                            <div className="row ">
                                <div className="col innerCol">
                                    <div className="myCard card1">
                                        <h4>Platform</h4>
                                        <div className="myInnerCard">
                                            <div className="myContent">

                                                <div className="wrapper">
                                                    <h2>{overAllStats?.total_volume_for_platform ? overAllStats?.total_volume_for_platform : "0"} USD</h2>
                                                    <div className="pCon">
                                                        <p>TOTAL STAKED (0.00%)</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col innerCol">
                                    <div className="myCard card1">
                                        <h4>My Account</h4>
                                        <div className="myInnerCard">
                                            <div className="myContent">

                                                <div className="wrapper">
                                                    <h2>~ {overAllStats?.total_volume_for_user ? overAllStats?.total_volume_for_user : "0"} USD</h2>
                                                    <div className="pCon">
                                                        <p>TOTAL VALUE STAKED</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                <div className="container myCon">
                    <h4>ACTIVE POOLS</h4>
                </div>

                <div className="container second">
                    <div className="myWrapper ">
                        <div className="row">
                            <div className="col-12 common-col">
                                <div className="row">
                                    <div className="col common-cls">
                                        <div className="grad">
                                            <p>Composition</p>
                                        </div>
                                    </div>
                                    <div className="col common-cls">
                                        <div className="grad">
                                            <p>Reward (APY)</p>
                                        </div>
                                    </div>
                                    <div className="col common-cls">
                                        <div className="grad">
                                            <p>Your reward</p>
                                        </div>
                                    </div>
                                    <div className="col common-cls">
                                        <div className="grad">
                                            <p>Your stake</p>
                                        </div>
                                    </div>
                                    <div className="col common-cls">
                                        <div className="grad">
                                            <p>Total Volume</p>
                                        </div>
                                    </div>
                                    <div className="col common-cls">
                                        <div className="grad">
                                            <p>Total Rewards Distributed</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {poolsInfo && poolsInfo?.length > 0 && poolsInfo?.map((pool, key) => (
                                <div onClick={() => {
                                    setActiveKey(key)
                                    setModalShow(true)
                                }} className="col-12 common-col">
                                    <div className="row">
                                        <div className="col common-cls">
                                            <div className="ultimate">

                                                <div className="andarUske">
                                                    <h4>{pool?.symbol ? pool?.symbol : "-"}</h4>
                                                    <p>Stake & earn</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col common-cls">

                                            <p>+{pool?.reward_percent ? Number(pool?.reward_percent) / 1e3 : "0"}%</p></div>
                                        <div className="col common-cls">{pendingReward ? Number(pendingReward[key]) / 1e9 : "0"} {pool?.symbol ? pool?.symbol : "-"}</div>
                                        <div className="col common-cls">{pool?.stakedAmount ? Number(pool?.stakedAmount) / 1e9 : "0"} {pool?.symbol ? pool?.symbol : "-"}</div>
                                        <div className="col common-cls">{pool?.total_staked ? Number(pool?.total_staked) / 1e9 : "0"} {pool?.symbol ? pool?.symbol : "-"}</div>
                                        <div className="col common-cls">{pool?.total_reward ? Number(pool?.total_reward) / 1e9 : "0"} {pool?.symbol ? pool?.symbol : "-"}</div>
                                    </div>
                                </div>
                            ))}


                        </div>


                        <MyVerticallyCenteredModal
                            show={modalShow}
                            onHide={() => setModalShow(false)}
                            key={activeKey}
                            isWithdraw={isWithdraw}
                            setIsWithdraw={setIsWithdraw}
                        />
                    </div>
                </div>
            </div>
        </>

    )
}

export default Pool