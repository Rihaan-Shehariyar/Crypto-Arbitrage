import { useEffect, useState } from "react";

export default function useBalance() {

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchBalance = async () => {

      try {

        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:8080/balance",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch balance");
        }

        const data = await res.json();

        setBalance(data);
        setError(null);

      } catch (err) {

        console.log("Balance error:", err.message);

        setError(err.message);

      } finally {

        setLoading(false);
      }
    };

    fetchBalance();

    // refresh every 5 sec
    const interval = setInterval(
      fetchBalance,
      5000
    );

    return () => clearInterval(interval);

  }, []);

  return {
    balance,
    loading,
    error,
  };
}