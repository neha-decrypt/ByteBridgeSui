import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';

function MyVerticallyCenteredModal({ setIsWithdraw, setModalShow, setPageLoader, setReload, setStakeAmount, pageLoader, isWithdraw, poolsInfo, tokenBalances, activeKey, signAndExecute, stakeAmount, localClaimReward, localStake, localUnstake, account, reload, pendingReward, isRotating, handleRefreshClick }) {
  return (
    <Modal
      show={true}
      onHide={() => setModalShow(false)}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >

      <Modal.Body>
        <div id="connect" className={pageLoader ? "blur" : ""}>
          <div className="mainBtns">
            <button className={!isWithdraw ? 'active' : ""} onClick={(e) => {
              e.preventDefault()
              setIsWithdraw(false)
            }}>Deposit</button>
            <button className={isWithdraw ? 'active' : ""} onClick={(e) => {
              e.preventDefault()
              setIsWithdraw(true)
            }}>Withdraw</button>
          </div>
          {!isWithdraw ? (<><div className="inputCon">
            <div className="meriInput">
              <span>{poolsInfo?.[activeKey]?.symbol}</span>
              <input className='myInput' placeholder='0.00' value={stakeAmount} onChange={(e) => {
                setStakeAmount(e.target.value)
              }} type="text" />
            </div>
            <div className="text">
              <p>Available to stake: {tokenBalances[activeKey] ? Number(tokenBalances[activeKey]) / 1e9 : "0"} {poolsInfo?.[activeKey]?.symbol}</p>
              <p>Staked Balance: {poolsInfo[activeKey]?.stakedAmount ? Number(poolsInfo[activeKey]?.stakedAmount) / 1e9 : "0"} {poolsInfo[activeKey]?.symbol}</p>
              <div className="text-white" onClick={() => {
                setStakeAmount(tokenBalances[activeKey] ? Number(tokenBalances[activeKey]) / 1e9 : "0")
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
                <p>Staked Balance: {poolsInfo[activeKey]?.stakedAmount ? Number(poolsInfo[activeKey]?.stakedAmount) / 1e9 : "0"} {poolsInfo[activeKey]?.symbol}</p>
                <br></br>
                <p>Pending Reward: {pendingReward[activeKey] ? Number(pendingReward[activeKey]) / 1e9 : "0"} {poolsInfo[activeKey]?.symbol}</p><button
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


export default MyVerticallyCenteredModal