import React, { useState } from 'react';
import { adminAddStake, mintFT } from '../../helpers';
import "./admin.scss"

function Admin() {
    const [selectedPool, setSelectedPool] = useState(0);
    const [beneficiary, setBeneficiary] = useState(0);

    return (
        <div className="admin-container">
            <div className="form-group">
                <label className='label'>Pool ID</label>
                <input
                    className="input"
                    type="text"
                    value={selectedPool}
                    onChange={(e) => setSelectedPool(e.target.value)}
                />
            </div>
            <button className="button" onClick={async () => {
                await adminAddStake();
            }}>Add Stake To Pool</button>

            <div className="form-group">
                <label className='label'>Beneficiary</label>
                <input
                    className="input"
                    type="text"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                />
            </div>
            <button className="button" onClick={async () => {
                await mintFT(Number(selectedPool), beneficiary);
            }}>Mint Token</button>
        </div>
    );
}

export default Admin;
