from fastapi import APIRouter, Query
import duckdb

router = APIRouter(prefix="/spend", tags=["spending"])

CSV_PATH = "personal_expense_dataset.csv"

def connect_with_view():
    con = duckdb.connect()
    con.execute(f"""
    CREATE OR REPLACE VIEW expenses AS
    SELECT
      TRY_CAST(Date AS DATE) AS Date,
      Category,
      TRY_CAST(Amount AS DOUBLE) AS Amount,
      Payment_Mode,
      *
    FROM read_csv_auto('{CSV_PATH}')
    """)
    return con


@router.get("/summary")
def summary(
    start: str = Query(None),
    end: str = Query(None),
):
    con = connect_with_view()
    where, params = [], []
    if start:
        where.append("Date >= ?")
        params.append(start)
    if end:
        where.append("Date <= ?")
        params.append(end)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    df = con.execute(f"""
        SELECT
          COUNT(*) AS num_transactions,
          COALESCE(SUM(Amount), 0) AS total_spend,
          COALESCE(AVG(Amount), 0) AS avg_spend,
          MIN(Date) AS min_date,
          MAX(Date) AS max_date
        FROM expenses
        {where_sql}
    """, params).fetchdf()

    con.close()
    return df.to_dict(orient="records")[0]

@router.get("/top_categories")
def top_categories(
    k: int = 5,
    start: str = Query(None),
    end: str = Query(None),
):
    con = connect_with_view()
    where, params = [], []
    if start:
        where.append("Date >= ?")
        params.append(start)
    if end:
        where.append("Date <= ?")
        params.append(end)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    df = con.execute(f"""
        SELECT
          Category,
          COALESCE(SUM(Amount), 0) AS total_spend,
          COUNT(*) AS txn_count
        FROM expenses
        {where_sql}
        GROUP BY Category
        ORDER BY total_spend DESC
        LIMIT ?
    """, params + [k]).fetchdf()
    con.close()
    return df.to_dict(orient="records")

@router.get("/payment_split")
def payment_split(
    start: str = Query(None),
    end: str = Query(None),
):
    con = connect_with_view()
    where, params = [], []
    if start:
        where.append("Date >= ?")
        params.append(start)
    if end:
        where.append("Date <= ?")
        params.append(end)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    df = con.execute(f"""
        SELECT
          Payment_Mode,
          COALESCE(SUM(Amount), 0) AS total_spend,
          COUNT(*) AS txn_count
        FROM expenses
        {where_sql}
        GROUP BY Payment_Mode
        ORDER BY total_spend DESC
    """, params).fetchdf()
    con.close()
    return df.to_dict(orient="records")

@router.get("/search")
def search(
    q: str = Query(..., description="keyword for Category/Payment_Mode"),
    start: str = Query(None),
    end: str = Query(None),
):
    con = connect_with_view()
    where = ["(LOWER(Category) LIKE LOWER(?) OR LOWER(Payment_Mode) LIKE LOWER(?))"]
    params = [f"%{q}%", f"%{q}%"]
    if start:
        where.append("Date >= ?")
        params.append(start)
    if end:
        where.append("Date <= ?")
        params.append(end)

    df = con.execute(f"""
        SELECT Date, Category, Amount, Payment_Mode
        FROM expenses
        WHERE {" AND ".join(where)}
        ORDER BY Date DESC
        LIMIT 50
    """, params).fetchdf()
    con.close()
    return df.to_dict(orient="records")

@router.get("/budget_advice")
def budget_advice(
    month: str = Query(..., description="YYYY-MM (e.g., 2024-03)"),
):
    """
    Returns monthly spending structure (total, top category, daily average, payment split). 
    Used by agent to generate next-month budget recommendations.
    """
    con = connect_with_view()
    df = con.execute("""
        WITH m AS (
          SELECT *
          FROM expenses
          WHERE strftime(Date, '%Y-%m') = ?
        ),
        totals AS (
          SELECT
            COALESCE(SUM(Amount), 0) AS total_spend,
            COALESCE(AVG(Amount), 0) AS avg_txn,
            COUNT(*) AS txn_count,
            COUNT(DISTINCT Date) AS active_days
          FROM m
        ),
        cat AS (
          SELECT Category, COALESCE(SUM(Amount), 0) AS total_spend
          FROM m
          GROUP BY Category
          ORDER BY total_spend DESC
          LIMIT 5
        ),
        pay AS (
          SELECT Payment_Mode, COALESCE(SUM(Amount), 0) AS total_spend
          FROM m
          GROUP BY Payment_Mode
          ORDER BY total_spend DESC
        )
        SELECT
          (SELECT total_spend FROM totals) AS total_spend,
          (SELECT txn_count FROM totals) AS txn_count,
          (SELECT active_days FROM totals) AS active_days,
          CASE WHEN (SELECT active_days FROM totals) = 0
               THEN 0
               ELSE (SELECT total_spend FROM totals) / (SELECT active_days FROM totals)
          END AS daily_avg_spend,
          (SELECT list(struct_pack(Category := Category, total_spend := total_spend)) FROM cat) AS top_categories,
          (SELECT list(struct_pack(Payment_Mode := Payment_Mode, total_spend := total_spend)) FROM pay) AS payment_modes
    """, [month]).fetchdf()
    con.close()
    return df.to_dict(orient="records")[0]