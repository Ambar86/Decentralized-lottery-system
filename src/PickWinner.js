import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import constants from './constants';

function PickWinner() {
    const [owner, setOwner] = useState('');
    const [contractInstance, setContractInstance] = useState(null); // Initialize as null
    const [currentAccount, setCurrentAccount] = useState('');
    const [isOwnerConnected, setIsOwnerConnected] = useState(false);
    const [winner, setWinner] = useState('');
    const [status, setStatus] = useState(false);

    useEffect(() => {
        const loadBlockchainData = async () => {
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                try {
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    setCurrentAccount(address);

                    window.ethereum.on('accountsChanged', (accounts) => {
                        setCurrentAccount(accounts[0]);
                    });
                } catch (err) {
                    console.error(err);
                }
            } else {
                alert('Please install Metamask to use this application');
            }
        };

        const loadContract = async () => {
            if (currentAccount && typeof window.ethereum !== 'undefined') {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contractIns = new ethers.Contract(constants.contractAddress, constants.contractAbi, signer);
                setContractInstance(contractIns);

                // Wait for contractInstance to be available before calling contract methods
                if (contractIns) {
                    const status = await contractIns.isComplete();
                    setStatus(status);

                    const winner = await contractIns.getWinner();
                    setWinner(winner);

                    const owner = await contractIns.getManager();
                    setOwner(owner);

                    setIsOwnerConnected(owner === currentAccount);
                }
            }
        };

        loadBlockchainData();
        loadContract();
    }, [currentAccount]); // Trigger contract loading when currentAccount changes

    const pickWinner = async () => {
        if (contractInstance) {
            const tx = await contractInstance.pickWinner();
            await tx.wait();
        }
    };

    return (
        <div className='container'>
            <h1>Result Page</h1>
            <div className='button-container'>
                {status ? (
                    <p>Lottery Winner is : {winner}</p>
                ) : (
                    isOwnerConnected ? (
                        <button className="enter-button" onClick={pickWinner}>Pick Winner</button>
                    ) : (
                        <p>You are not the owner</p>
                    )
                )}
            </div>
        </div>
    );
}

export default PickWinner;
