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
    const [stakeAmount, setStakeAmount] = useState([]);
    const [tokenBalances, setTokenBalances] = useState([]);
    const [reload, setReload] = useState(false);
    const [pendingReward, setPendingReward] = useState([]);
    const [pageLoader, setPageLoader] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [poolsInfo, setPoolsInfo] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false)
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
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
        setStakeAmount(poolInfoArray)
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
                    <div id="connect">
                        <div className="mainBtns">
                            <button className='active'>Btn1</button>
                            <button>Btn2</button>
                        </div>
                        <div className="inputCon">
                            <div className="meriInput">
                                <span>DCB</span>
                                <input className='myInput' placeholder='0.00' type="text" />
                            </div>
                            <div className="text">
                                <p>Available to stake: 0 DCB</p>
                                <a href="">Use Max</a>
                            </div>
                        </div>
                        <div className="btns">
                            <button>Deposit</button>
                            <button>Cancel</button>
                        </div>
                    </div>

                </Modal.Body>

            </Modal>
        );
    }
    return (
        <div id='Pool' className={pageLoader ? "blur" : ""}>
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
                                            {/* <div className="wrapper">
                                                <h2>~ 0.0 USD</h2>
                                                <div className="pCon">
                                                    <p>TOTAL VALUE LOCKED</p>
                                                </div>
                                            </div> */}
                                            <div className="wrapper">
                                                <h2>{overAllStats?.total_volume_for_platform ? overAllStats?.total_volume_for_platform : "0"} USD</h2>
                                                <div className="pCon">
                                                    <p>TOTAL DCB STAKED (0.00%)</p>
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
                                            {/* <div className="wrapper">
                                                <h2>~ {overAllStats?.total_rewards_earned_by_user ? overAllStats?.total_rewards_earned_by_user : "0"} USD</h2>
                                                <div className="pCon">
                                                    <p>TOTAL REWARDS EARNED</p>
                                                </div>
                                            </div> */}
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
                                {/* <div className="col common-cls">
                                    <div className="grad">
                                        <p>Network</p>
                                    </div>
                                </div> */}
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
                            <div onClick={() => setModalShow(true)} className="col-12 common-col">
                                <div className="row">
                                    <div className="col common-cls">
                                        <div className="ultimate">
                                            {/* <svg width="50" height="50" viewBox="-3 -3 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_3143_4197)">
                                                    <g clip-path="url(#clip1_3143_4197)">
                                                        <path d="M13 0C20.1794 0 26 5.82062 26 13C26 20.1794 20.1791 26 13 26C5.82088 26 0 20.1809 0 13C0 5.81906 5.81984 0 13 0Z" fill="#53AE94" />
                                                        <path d="M14.6045 11.2677V9.33379H19.0269V6.38721H6.98469V9.33379H11.4076V11.2661C7.81305 11.4312 5.11035 12.1431 5.11035 12.9959C5.11035 13.8487 7.81435 14.5606 11.4076 14.7267V20.9212H14.6056V14.7262C18.1936 14.5606 20.8908 13.8492 20.8908 12.9972C20.8908 12.1452 18.1936 11.4338 14.6056 11.2682M14.6056 14.2015V14.1999C14.5153 14.2057 14.0518 14.2335 13.0196 14.2335C12.1943 14.2335 11.6137 14.2101 11.4091 14.1994V14.202C8.23347 14.0614 5.86305 13.5083 5.86305 12.8466C5.86305 12.1849 8.23373 11.6327 11.4091 11.4918V13.6511C11.6171 13.6654 12.212 13.7005 13.0331 13.7005C14.0192 13.7005 14.5151 13.6594 14.6061 13.6511V11.4918C17.7755 11.633 20.1404 12.1865 20.1404 12.8459C20.1404 13.5052 17.7744 14.059 14.6061 14.2002" fill="white" />
                                                    </g>
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_3143_4197">
                                                        <rect width="26" height="26" fill="white" />
                                                    </clipPath>
                                                    <clipPath id="clip1_3143_4197">
                                                        <rect width="26" height="26" fill="white" />
                                                    </clipPath>
                                                </defs>
                                            </svg> */}
                                            <div className="andarUske">
                                                <h4>{pool?.symbol ? pool?.symbol : "-"}</h4>
                                                <p>Stake & earn</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div className="col common-cls">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                                            <g filter="url(#filter0_b_3143_4204)">
                                                <path d="M32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32C24.8366 32 32 24.8366 32 16Z" fill="url(#paint0_linear_3143_4204)" fill-opacity="0.06" />
                                                <path d="M16 0.51444C24.5524 0.51444 31.4856 7.44756 31.4856 16C31.4856 24.5524 24.5524 31.4856 16 31.4856C7.44756 31.4856 0.51444 24.5524 0.51444 16C0.51444 7.44756 7.44756 0.51444 16 0.51444Z" stroke="url(#paint1_linear_3143_4204)" stroke-opacity="0.35" stroke-width="1.02888" />
                                            </g>
                                            <path d="M12.1154 14.4041L15.9994 10.5202L19.8854 14.4061L22.1454 12.1461L15.9994 6L9.85547 12.1441L12.1154 14.4041Z" fill="#F3BA2F" />
                                            <path d="M10.52 15.9996L8.26005 13.7397L6 15.9997L8.25994 18.2597L10.52 15.9996Z" fill="#F3BA2F" />
                                            <path d="M12.1158 17.5956L15.9998 21.4795L19.8857 17.5938L22.1458 19.8538L15.9998 25.9998L9.85254 19.8526L12.1158 17.5956Z" fill="#F3BA2F" />
                                            <path d="M23.74 18.2607L26 16.0006L23.7401 13.7407L21.48 16.0008L23.74 18.2607Z" fill="#F3BA2F" />
                                            <path d="M18.2921 15.9989L15.9997 13.7056L13.7085 15.9969L15.9997 18.2946L18.2921 15.9989Z" fill="#F3BA2F" />
                                            <defs>
                                                <filter id="filter0_b_3143_4204" x="-17.8" y="-17.8" width="67.6" height="67.6" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                                    <feGaussianBlur in="BackgroundImageFix" stdDeviation="8.9" />
                                                    <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_3143_4204" />
                                                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_3143_4204" result="shape" />
                                                </filter>
                                                <linearGradient id="paint0_linear_3143_4204" x1="0" y1="0" x2="36.8035" y2="8.98536" gradientUnits="userSpaceOnUse">
                                                    <stop stop-color="#009DDA" />
                                                    <stop offset="1" stop-color="#62BA47" />
                                                </linearGradient>
                                                <linearGradient id="paint1_linear_3143_4204" x1="0" y1="0" x2="36.8035" y2="8.98536" gradientUnits="userSpaceOnUse">
                                                    <stop stop-color="#009DDA" />
                                                    <stop offset="1" stop-color="#62BA47" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div> */}
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
                    />
                </div>
            </div>
        </div>
    )
}

export default Pool