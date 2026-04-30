import { useEffect, useState } from "react";

export default function useBalance() {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("http://localhost:8080/balance");

        if (!res.ok) {
          throw new Error("API error");
        }

        const data = await res.json();
        setBalance(data);
      } catch (err) {
        console.log("Balance error:", err.message);
      }
    };

    fetchBalance();

    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, []);

  return balance;
}