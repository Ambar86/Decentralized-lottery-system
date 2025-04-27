import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import constants from "./constants";

function Home() {
    const [currentAccount, setCurrentAccount] = useState("");
    const [contractInstance, setContractInstance] = useState(null);
    const [status, setStatus] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state for async operations
    const [message, setMessage] = useState(""); // Message state for user feedback
    const [isManager, setIsManager] = useState(false); // To check if the current user is the manager

    // Load blockchain data
    useEffect(() => {
        const loadBlockchainData = async () => {
            if (typeof window.ethereum !== "undefined") {
                try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const accounts = await provider.send("eth_requestAccounts", []);

                    if (accounts.length > 0) {
                        setCurrentAccount(accounts[0]);

                        // Listen for account changes
                        window.ethereum.on("accountsChanged", (accounts) => {
                            setCurrentAccount(accounts[0] || "");
                        });
                    } else {
                        setMessage("No accounts found. Please connect your wallet.");
                    }
                } catch (error) {
                    setMessage("Error accessing accounts. Please try again.");
                    console.error("Error accessing accounts:", error);
                }
            } else {
                alert("Please install MetaMask to use this application.");
            }
        };

        loadBlockchainData();
    }, []);

    // Load contract data and check lottery status
    useEffect(() => {
        const loadContract = async () => {
            if (currentAccount && typeof window.ethereum !== "undefined") {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contractIns = new ethers.Contract(
                    constants.contractAddress,
                    constants.contractAbi,
                    signer
                );
                setContractInstance(contractIns);

                try {
                    const isComplete = await contractIns.isComplete();
                    setStatus(isComplete);

                    const winner = await contractIns.getWinner();
                    setIsWinner(winner.toLowerCase() === currentAccount.toLowerCase());

                    const manager = await contractIns.getManager();
                    setIsManager(manager.toLowerCase() === currentAccount.toLowerCase());
                } catch (error) {
                    setMessage("Error fetching contract data.");
                    console.error("Error interacting with contract:", error);
                }
            }
        };

        loadContract();
    }, [currentAccount]);

    // Enter the lottery
    const enterLottery = async () => {
        if (contractInstance) {
            setLoading(true);
            setMessage("");

            try {
                const amountToSend = ethers.utils.parseEther("0.001");

                const tx = await contractInstance.enter({
                    value: amountToSend,
                    gasLimit: 300000, // Adjust gas limit as needed
                });

                await tx.wait();
                setMessage("Successfully entered the lottery!");
            } catch (error) {
                if (error.code === ethers.errors.UNPREDICTABLE_GAS_LIMIT) {
                    setMessage("Failed to estimate gas. Check the contract state.");
                } else {
                    setMessage("Error entering the lottery. Please try again.");
                }
                console.error("Error entering lottery:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Claim prize if the user is the winner
    const claimPrize = async () => {
        if (contractInstance) {
            setLoading(true);
            setMessage("");

            try {
                const tx = await contractInstance.claimPrize();
                await tx.wait();
                setMessage("Prize claimed successfully!");
            } catch (error) {
                if (error.message.includes("You are not the winner")) {
                    setMessage("You are not the winner.");
                } else if (error.message.includes("Lottery has not ended yet")) {
                    setMessage("The lottery has not ended yet.");
                } else if (error.message.includes("Prize has already been claimed")) {
                    setMessage("Prize has already been claimed.");
                } else {
                    setMessage("Error claiming prize. Please try again.");
                }
                console.error("Error claiming prize:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Reset the lottery
    const resetLottery = async () => {
        if (contractInstance) {
            setLoading(true);
            setMessage("");

            try {
                const tx = await contractInstance.resetLottery();
                await tx.wait();
                setMessage("Lottery reset successfully!");
                setStatus(false); // Reset lottery status
                setIsWinner(false); // Reset winner status
            } catch (error) {
                setMessage("Error resetting the lottery. Please try again.");
                console.error("Error resetting lottery:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="container">
            <h1>Lottery Page</h1>
            <p>Connected Account: {currentAccount || "Not connected"}</p>
            {message && <p className="message">{message}</p>}
            <div className="button-container">
                {loading ? (
                    <p>Loading...</p>
                ) : status ? (
                    isWinner ? (
                        <button className="action-button" onClick={claimPrize}>
                            Claim Prize
                        </button>
                    ) : (
                        <p>You are not the winner</p>
                    )
                ) : (
                    <button className="action-button" onClick={enterLottery}>
                        Enter Lottery
                    </button>
                )}
            </div>
            {isManager && (
                <div className="manager-actions">
                    <button className="reset-button" onClick={resetLottery}>
                        Reset Lottery
                    </button>
                </div>
            )}
        </div>
    );
}

export default Home;
