# backend/debt_engine.py
from dataclasses import dataclass
from typing import List, Dict, Literal, Tuple

Strategy = Literal["snowball", "avalanche"]

@dataclass
class Debt:
    name: str
    balance: float
    apr: float          # annual rate, e.g. 0.2399
    min_payment: float

def _monthly_rate(apr: float) -> float:
    return apr / 12.0

def simulate_payoff(
    debts: List[Debt],
    extra_payment: float = 0.0,
    strategy: Strategy = "avalanche",
    max_months: int = 600,
    schedule_months: int = 24,   # return only first N months (avoid huge payload)
) -> Dict:
    # Defensive copy
    debts = [Debt(d.name, float(d.balance), float(d.apr), float(d.min_payment)) for d in debts]

    # Sort target order
    def sort_key(d: Debt):
        if strategy == "snowball":
            return (d.balance, -d.apr)  # smallest balance first
        return (-d.apr, d.balance)      # highest APR first

    total_interest = 0.0
    month = 0
    schedule = []

    # If extra_payment < 0, treat as 0
    extra_payment = max(0.0, float(extra_payment))

    while month < max_months and any(d.balance > 1e-6 for d in debts):
        month += 1

        # 1) Interest accrual
        month_interest_map = {}
        for d in debts:
            if d.balance <= 1e-6:
                month_interest_map[d.name] = 0.0
                continue
            interest = d.balance * _monthly_rate(d.apr)
            d.balance += interest
            total_interest += interest
            month_interest_map[d.name] = interest

        # 2) Pay minimums first (but not more than balance)
        payments_map = {d.name: 0.0 for d in debts}

        for d in debts:
            if d.balance <= 1e-6:
                continue
            pay = min(d.min_payment, d.balance)
            d.balance -= pay
            payments_map[d.name] += pay

        # 3) Allocate extra payment to target debt(s)
        remaining_extra = extra_payment

        # Recompute target order each month (balances change)
        targets = sorted([d for d in debts if d.balance > 1e-6], key=sort_key)

        for d in targets:
            if remaining_extra <= 1e-9:
                break
            pay = min(remaining_extra, d.balance)
            d.balance -= pay
            payments_map[d.name] += pay
            remaining_extra -= pay

        # Record schedule (limited)
        if len(schedule) < schedule_months:
            snapshot = []
            for d in debts:
                snapshot.append({
                    "name": d.name,
                    "interest": round(month_interest_map.get(d.name, 0.0), 2),
                    "payment": round(payments_map.get(d.name, 0.0), 2),
                    "ending_balance": round(max(d.balance, 0.0), 2),
                })
            schedule.append({
                "month": month,
                "debts": snapshot,
                "total_payment": round(sum(payments_map.values()), 2),
            })

    payoff_months = month if not any(d.balance > 1e-6 for d in debts) else None

    return {
        "strategy": strategy,
        "extra_payment": round(extra_payment, 2),
        "payoff_months": payoff_months,
        "payoff_years": round(payoff_months / 12.0, 2) if payoff_months else None,
        "total_interest_paid": round(total_interest, 2),
        "schedule_preview": schedule,
        "note": f"Schedule preview limited to first {schedule_months} months."
    }

def compare_strategies(
    debts: List[Debt],
    extra_payment: float = 0.0,
) -> Dict:
    av = simulate_payoff(debts, extra_payment=extra_payment, strategy="avalanche")
    sn = simulate_payoff(debts, extra_payment=extra_payment, strategy="snowball")

    # Determine winner (interest)
    winner = None
    if av["payoff_months"] and sn["payoff_months"]:
        if av["total_interest_paid"] < sn["total_interest_paid"]:
            winner = "avalanche"
        elif sn["total_interest_paid"] < av["total_interest_paid"]:
            winner = "snowball"
        else:
            winner = "tie"

    interest_diff = None
    if av["payoff_months"] and sn["payoff_months"]:
        interest_diff = round(abs(av["total_interest_paid"] - sn["total_interest_paid"]), 2)

    return {
        "extra_payment": round(float(extra_payment), 2),
        "avalanche": av,
        "snowball": sn,
        "recommended": winner,
        "interest_difference": interest_diff,
    }