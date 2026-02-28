from fastapi import APIRouter, Query
import duckdb

router = APIRouter(prefix="/income", tags=["income"])

CSV_PATH = "student_income_2024.csv"

def connect_with_view():
    con = duckdb.connect()
    con.execute(f"""
    CREATE OR REPLACE VIEW income AS
    SELECT
      TRY_CAST(date AS DATE) AS date,
      TRY_CAST(amount AS DOUBLE) AS amount,
      source
    FROM read_csv_auto('{CSV_PATH}')
    """)
    return con

@router.get("/summary")
def summary(
    start: str = Query(None, description="YYYY-MM-DD"),
    end: str = Query(None, description="YYYY-MM-DD"),
):
    con = connect_with_view()
    where, params = [], []
    if start:
        where.append("date >= ?"); params.append(start)
    if end:
        where.append("date <= ?"); params.append(end)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    df = con.execute(f"""
        SELECT
          COUNT(*) AS num_income_events,
          COALESCE(SUM(amount), 0) AS total_income,
          COALESCE(AVG(amount), 0) AS avg_income,
          MIN(date) AS min_date,
          MAX(date) AS max_date
        FROM income
        {where_sql}
    """, params).fetchdf()
    con.close()
    return df.to_dict(orient="records")[0]

@router.get("/by_source")
def by_source(
    start: str = Query(None),
    end: str = Query(None),
):
    con = connect_with_view()
    where, params = [], []
    if start:
        where.append("date >= ?"); params.append(start)
    if end:
        where.append("date <= ?"); params.append(end)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    df = con.execute(f"""
        SELECT
          source,
          COALESCE(SUM(amount), 0) AS total_income,
          COUNT(*) AS event_count
        FROM income
        {where_sql}
        GROUP BY source
        ORDER BY total_income DESC
    """, params).fetchdf()
    con.close()
    return df.to_dict(orient="records")

@router.get("/monthly")
def monthly(
    year: int = Query(2024),
):
    con = connect_with_view()
    df = con.execute("""
        SELECT
          strftime(date, '%Y-%m') AS month,
          COALESCE(SUM(amount), 0) AS total_income,
          COUNT(*) AS event_count
        FROM income
        WHERE strftime(date, '%Y') = ?
        GROUP BY month
        ORDER BY month
    """, [str(year)]).fetchdf()
    con.close()
    return df.to_dict(orient="records")

@router.get("/search")
def search(
    q: str = Query(..., description="keyword for source"),
    start: str = Query(None),
    end: str = Query(None),
):
    con = connect_with_view()
    where = ["LOWER(source) LIKE LOWER(?)"]
    params = [f"%{q}%"]
    if start:
        where.append("date >= ?"); params.append(start)
    if end:
        where.append("date <= ?"); params.append(end)

    df = con.execute(f"""
        SELECT date, amount, source
        FROM income
        WHERE {" AND ".join(where)}
        ORDER BY date DESC
        LIMIT 100
    """, params).fetchdf()
    con.close()
    return df.to_dict(orient="records")