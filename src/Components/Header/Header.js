import React, { useEffect, useState } from 'react'
import { GiHamburgerMenu } from "react-icons/gi";
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { fetchBalance } from '../../helpers';


const Header = () => {
    const account = useCurrentAccount();
    const [suiBal, setSuiBal] = useState(0)

    useEffect(() => {
        const fetchData = async () => {
            if (account && account?.address) {

                let bal = await fetchBalance(account?.address)
                setSuiBal(bal?.suiAmount)
            }
        }
        fetchData()
    }, [account])

    return (
        <div>
            <nav className="navbar navbar-expand-lg  HeaderBar " style={{ zIndex: '1' }}>
                <div className='container py-3'>
                    <a className="navbar-brand" href="#">
                        <div className='LogoDiv'>
                            <img src='assets/ByteLogo.png' className='img-fluid' />
                        </div>
                    </a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <div className="navbar-toggler-icon d-flex align-items-center justify-content-center">
                            <GiHamburgerMenu size={25} color='#fff' />
                        </div>
                    </button>
                    <div className="collapse navbar-collapse navUl" id="navbarSupportedContent">
                        <ul className="navbar-nav mb-lg-0">
                            <li className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Products
                                </a>
                                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                    <li><a className="dropdown-item" href="#">Action</a></li>
                                    <li><a className="dropdown-item" href="#">Another action</a></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><a className="dropdown-item" href="#">Something else here</a></li>
                                </ul>
                            </li>
                            <li className="nav-item dropdown">
                                <div className="nav-link" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    {suiBal} SUI
                                </div>

                            </li>
                            <li className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Launchpad
                                </a>
                                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                    <li><a className="dropdown-item" href="#">Action</a></li>
                                    <li><a className="dropdown-item" href="#">Another action</a></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><a className="dropdown-item" href="#">Something else here</a></li>
                                </ul>
                            </li>

                            <li>

                                <ConnectButton />
                            </li>
                        </ul>



                    </div>
                </div>
            </nav>
        </div>
    )
}

export default Header
