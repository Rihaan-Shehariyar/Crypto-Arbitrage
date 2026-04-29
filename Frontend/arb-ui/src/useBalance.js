import { useEffect, useState } from "react";

export default function useBalance() {
  const [balance, setBalance] = useState({});

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("http://localhost:8080/balance");
        const data = await res.json();
        setBalance(data);
      } catch (err) {
        console.log("Balance error:", err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);

    return () => clearInterval(interval);
  }, []);

  return balance;
}