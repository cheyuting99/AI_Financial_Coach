# backend/debt.py
from pathlib import Path
from typing import Literal, Optional

import pandas as pd
from fastapi import APIRouter, HTTPException

from debt_engine import Debt, simulate_payoff, compare_strategies

router = APIRouter(prefix="/debt", tags=["debt"])
DEBT_CSV = Path(__file__).parent / "debt_data.csv"

def load_debts() -> list[Debt]:
    if not DEBT_CSV.exists():
        raise HTTPException(status_code=404, detail="debt_data.csv not found on server")

    df = pd.read_csv(DEBT_CSV)

    required = {"name", "balance", "apr", "min_payment"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns in CSV: {sorted(missing)}")

    # Normalize APR: if apr > 1, assume percent (e.g., 23.99)
    def norm_apr(x):
        x = float(x)
        return x / 100.0 if x > 1.0 else x

    debts = []
    for _, row in df.iterrows():
        debts.append(Debt(
            name=str(row["name"]),
            balance=float(row["balance"]),
            apr=norm_apr(row["apr"]),
            min_payment=float(row["min_payment"]),
        ))
    return debts

@router.get("/list")
def get_debt_list():
    debts = load_debts()
    return [{
        "name": d.name,
        "balance": d.balance,
        "apr": d.apr,
        "min_payment": d.min_payment
    } for d in debts]

@router.get("/plan")
def get_debt_plan(
    strategy: Literal["snowball", "avalanche"] = "avalanche",
    extra_payment: float = 0.0,
    schedule_months: int = 24
):
    debts = load_debts()
    # clamp schedule preview to prevent huge response
    schedule_months = max(1, min(schedule_months, 60))
    return simulate_payoff(
        debts,
        extra_payment=extra_payment,
        strategy=strategy,
        schedule_months=schedule_months
    )

@router.get("/compare")
def get_debt_compare(extra_payment: float = 0.0):
    debts = load_debts()
    return compare_strategies(debts, extra_payment=extra_payment)